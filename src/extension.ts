// ============================================================================
// ZenNode — Extension Entry Point (standalone, no local server required)
//
// Everything runs inside VS Code:
//   • TraceCollector  → captures behavioral signals
//   • CognitiveScorer → scores locally (pure TypeScript math)
//   • SessionStore    → persists sessions to local JSON file
//   • ZenBar          → shows live score in status bar
//   • CloudSyncService → optionally syncs anonymized summaries (opt-in only)
//   • ConnectWizard   → lets developer join a team (shown after 3 sessions)
//
// Zero setup for the developer. Install extension → ZenBar appears.
// ============================================================================

import * as vscode from 'vscode';
import { TraceCollector } from './traceCollector';
import { CognitiveScorer } from './scorer';
import { SessionStore } from './sessionStore';
import { CloudSyncService } from './cloudSync';
import { showConnectWizard } from './connectWizard';
import { ZenBar } from './zenBar';
import { ThemeShifter } from './themeShifter';
import { showBreathingExercise, disposeBreathingExercise } from './breathingExercise';
import { showDashboard, updateDashboard, disposeDashboard } from './dashboard';
import { CognitiveReport } from './types';

// ── Module-level state ──────────────────────────────────────────────────────
let traceCollector: TraceCollector;
let scorer: CognitiveScorer;
let sessionStore: SessionStore;
let cloudSync: CloudSyncService;
let zenBar: ZenBar;
let themeShifter: ThemeShifter;
let mainLoopInterval: ReturnType<typeof setInterval> | null = null;
let isTrackingEnabled = true;
let lastReport: CognitiveReport | null = null;
let tickCount = 0;

// ── Notification state ──────────────────────────────────────────────────────
let lastNotificationTime = 0;
let lastFatigueNotificationTime = 0;
let previousState = 'flow';
let fallbackMessageIndex = 0;

const OVERLOAD_COOLDOWN_MS = 3 * 60 * 1000;
const FATIGUE_COOLDOWN_MS  = 5 * 60 * 1000;

const OVERLOAD_FALLBACKS = [
    '🧘 High cognitive load detected. Heavy switching and corrections — consider a short pause.',
    '🌿 Heavy mental lifting. Close all tabs except the one that matters most.',
    '💨 You\'re pushing hard. Re-read the last function slowly before editing more.',
    '🫧 Lots of undo actions — you might be second-guessing yourself. Trust your instincts.',
    '🌟 Heavy paste activity detected. Try writing the next few lines from scratch.',
];

const FATIGUE_NUDGES = [
    '🟠 Entering fatigue territory. A 2-minute stretch could help reset your focus.',
    '🟠 Cognitive load climbing. Good time to save and take a micro-break.',
    '🟠 Switching rate is up — try focusing on just one file for a few minutes.',
    '🟠 Mental fatigue building. Jot down your current thought before it slips.',
];

const RECOVERY_MESSAGES = [
    '🎉 You\'re back in flow! Keep that momentum.',
    '🟢 Cognitive load dropped. Nice recovery!',
    '✨ You made it through the rough patch. Your brain thanks you.',
    '💪 Recovered from overload — great self-regulation.',
];

// ============================================================================
// Activation
// ============================================================================

export function activate(context: vscode.ExtensionContext): void {
    console.log('[ZenNode] Activating...');

    const cfg = getConfig();
    if (!cfg.enabled) {
        console.log('[ZenNode] Disabled via settings.');
        return;
    }

    // ── Initialize all components ───────────────────────────────────────────
    traceCollector = new TraceCollector();
    scorer         = new CognitiveScorer();
    sessionStore   = new SessionStore(context.globalStorageUri.fsPath);
    cloudSync      = new CloudSyncService(context);
    zenBar         = new ZenBar();
    themeShifter   = new ThemeShifter();

    context.subscriptions.push(traceCollector, zenBar, themeShifter);

    // ── Restore EMA from last session so score doesn't cold-start ──────────
    const savedEma = sessionStore.savedEmaScore;
    if (savedEma !== null) {
        scorer.restoreEma(savedEma);
        console.log(`[ZenNode] Restored EMA score: ${savedEma}`);
    }

    // ── Start collecting ────────────────────────────────────────────────────
    traceCollector.start();

    // ── Start main loop ─────────────────────────────────────────────────────
    startMainLoop(cfg.sampleIntervalMs);

    // ── Fire first snapshot immediately so ZenBar shows data right away ─────
    setTimeout(() => runOneTick(), 500);

    // ── Register commands ───────────────────────────────────────────────────
    registerCommands(context);

    // ── Watch settings changes ──────────────────────────────────────────────
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('zennode')) { onConfigChange(); }
        })
    );

    console.log(`[ZenNode] Active — scoring every ${cfg.sampleIntervalMs / 1000}s locally.`);
}

// ============================================================================
// Deactivation
// ============================================================================

export async function deactivate(): Promise<void> {
    stopMainLoop();
    disposeBreathingExercise();
    disposeDashboard();
    if (themeShifter) { await themeShifter.forceRevert(); }
}

// ============================================================================
// Main Loop
// ============================================================================

function startMainLoop(intervalMs: number): void {
    stopMainLoop();
    mainLoopInterval = setInterval(() => runOneTick(), intervalMs);
}

function stopMainLoop(): void {
    if (mainLoopInterval) {
        clearInterval(mainLoopInterval);
        mainLoopInterval = null;
    }
}

async function runOneTick(): Promise<void> {
    if (!isTrackingEnabled) { return; }

    try {
        const cfg      = getConfig();
        const snapshot = traceCollector.flush();
        const report   = scorer.score(snapshot);

        // ── Layer B: fetch LLM intervention from cloud if enabled ───────────
        if (cfg.enableLLM && report.state === 'overload') {
            const intervention = await cloudSync.requestIntervention(snapshot, report);
            if (intervention) {
                report.intervention = intervention;
                // Reset notification cooldown so LLM message is always shown
                lastNotificationTime = 0;
                console.log('[ZenNode] LLM intervention received:', report.intervention);
            }
        }

        // Persist to local store
        sessionStore.record(report, scorer.lastScore);

        lastReport = report;
        zenBar.update(report);
        updateDashboard(report);

        await handleCognitiveState(report);

        // Auto-sync live session to manager dashboard every 10 ticks
        tickCount++;
        if (tickCount % 10 === 0 && await cloudSync.isConnected()) {
            const liveSummary = sessionStore.getSummary();
            if (liveSummary.snapshotCount > 0) {
                cloudSync.syncLiveSession(liveSummary).catch(() => {});
            }
        }

        // After every 3 completed sessions, nudge to connect (if not already)
        await maybePromptConnect();

    } catch (err) {
        console.error('[ZenNode] Main loop error:', err);
    }
}

// ============================================================================
// Cognitive State Handlers
// ============================================================================

async function handleCognitiveState(report: CognitiveReport): Promise<void> {
    const cfg = getConfig();

    if (cfg.enableThemeShift) {
        await themeShifter.evaluate(report.score, report.themeShift);
    }

    if (cfg.showNotifications) {
        // Recovery
        if (
            (previousState === 'overload' || previousState === 'fatigue') &&
            (report.state === 'flow' || report.state === 'friction')
        ) {
            vscode.window.showInformationMessage(
                `ZenNode: ${getNextFallback(RECOVERY_MESSAGES)}`
            );
        }

        if (report.state === 'overload') {
            await showOverloadNotification(report);
        } else if (report.state === 'fatigue') {
            await showFatigueNotification();
        }
    }

    previousState = report.state;
}

async function showOverloadNotification(report: CognitiveReport): Promise<void> {
    const now = Date.now();
    if (now - lastNotificationTime < OVERLOAD_COOLDOWN_MS) { return; }
    lastNotificationTime = now;

    const message = report.intervention ?? getNextFallback(OVERLOAD_FALLBACKS);

    const action = await vscode.window.showWarningMessage(
        `🔴 ZenNode: ${message}`,
        '🫁 Breathe', '📊 Dashboard', '⏭️ Dismiss',
    );

    if (action === '🫁 Breathe')    { vscode.commands.executeCommand('zennode.showBreathingExercise'); }
    if (action === '📊 Dashboard') { vscode.commands.executeCommand('zennode.showDashboard'); }
}

async function showFatigueNotification(): Promise<void> {
    const now = Date.now();
    if (now - lastFatigueNotificationTime < FATIGUE_COOLDOWN_MS) { return; }
    lastFatigueNotificationTime = now;

    const action = await vscode.window.showInformationMessage(
        `ZenNode: ${getNextFallback(FATIGUE_NUDGES)}`,
        '🎯 Focus Mode', '⏭️ Dismiss',
    );

    if (action === '🎯 Focus Mode') {
        await vscode.commands.executeCommand('workbench.action.closeOtherEditors');
        vscode.window.showInformationMessage('ZenNode: Focus mode — other tabs closed. One thing at a time. 🎯');
    }
}

function getNextFallback(pool: string[]): string {
    return pool[fallbackMessageIndex++ % pool.length];
}

// ============================================================================
// Connect-to-team nudge (after 3 sessions, only once)
// ============================================================================

const CONNECT_PROMPT_KEY = 'zn_connect_prompted';

async function maybePromptConnect(): Promise<void> {
    const alreadyPrompted = sessionStore.completedSessionCount === 0;
    if (alreadyPrompted) { return; }

    const ctx = getContext();
    if (!ctx) { return; }
    if (ctx.globalState.get<boolean>(CONNECT_PROMPT_KEY)) { return; }
    if (sessionStore.completedSessionCount < 3) { return; }
    if (await cloudSync.isConnected()) { return; }

    await ctx.globalState.update(CONNECT_PROMPT_KEY, true);

    const action = await vscode.window.showInformationMessage(
        '🧠 ZenNode: You\'ve completed 3 sessions! Want to share wellbeing insights with your team?',
        'Connect to team',
        'Not now',
    );

    if (action === 'Connect to team') {
        vscode.commands.executeCommand('zennode.connectToTeam');
    }
}

// Keep a ref to context for the nudge
let _context: vscode.ExtensionContext | null = null;
function getContext() { return _context; }

// ============================================================================
// Command Registrations
// ============================================================================

function registerCommands(context: vscode.ExtensionContext): void {
    _context = context;

    // ── Toggle Tracking ─────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('zennode.toggleTracking', () => {
            isTrackingEnabled = !isTrackingEnabled;
            if (isTrackingEnabled) {
                traceCollector.start();
                if (lastReport) { zenBar.update(lastReport); }
                vscode.window.showInformationMessage('ZenNode: Tracking resumed.');
            } else {
                traceCollector.stop();
                zenBar.setPaused();
                vscode.window.showInformationMessage('ZenNode: Tracking paused.');
            }
        })
    );

    // ── Reset Session ────────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('zennode.resetSession', async () => {
            traceCollector.reset();
            await themeShifter.forceRevert();
            scorer.reset();

            const archivedSession = sessionStore.reset();

            // Sync to cloud if connected (fire and forget)
            if (archivedSession && await cloudSync.isConnected()) {
                const unsynced = sessionStore.getUnsynced();
                if (unsynced.length > 0) {
                    cloudSync.pushSessions(unsynced).then(result => {
                        if (result.accepted > 0) {
                            sessionStore.markSynced(unsynced.map(s => s.sessionId));
                        }
                    });
                }
            }

            lastReport = null;
            zenBar.update({
                score: 0, state: 'flow', themeShift: false, intervention: null,
                metrics: { switchRate: 0, errorRate: 0, undoRate: 0, idleRatio: 0, pasteRatio: 0 },
            });
            vscode.window.showInformationMessage('ZenNode: Session reset. Fresh start! 🧘');
        })
    );

    // ── Show Dashboard ───────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('zennode.showDashboard', () => {
            showDashboard(context, sessionStore, lastReport);
        })
    );

    // ── Breathing Exercise ───────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('zennode.showBreathingExercise', () => {
            showBreathingExercise(context);
        })
    );

    // ── Connect to Team ──────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('zennode.connectToTeam', () => {
            showConnectWizard(context, cloudSync, (teamName) => {
                vscode.window.showInformationMessage(
                    teamName
                        ? `ZenNode: Connected! Sessions will sync privately to "${teamName}".`
                        : 'ZenNode: Connected! Sessions will sync to your team.'
                );
            });
        })
    );

    // ── Disconnect ───────────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('zennode.disconnect', async () => {
            await cloudSync.disconnect();
            vscode.window.showInformationMessage('ZenNode: Disconnected from team. Data stays local.');
        })
    );
}

// ============================================================================
// Configuration
// ============================================================================

function getConfig() {
    const cfg = vscode.workspace.getConfiguration('zennode');
    return {
        enabled:          cfg.get<boolean>('enabled', true),
        sampleIntervalMs: cfg.get<number>('sampleIntervalMs', 5000),
        enableThemeShift: cfg.get<boolean>('enableThemeShift', true),
        enableLLM:        cfg.get<boolean>('enableLLM', false),
        warningThreshold: cfg.get<number>('warningThreshold', 50),
        criticalThreshold:cfg.get<number>('criticalThreshold', 80),
        showNotifications:cfg.get<boolean>('showNotifications', true),
    };
}

function onConfigChange(): void {
    const cfg = getConfig();
    if (mainLoopInterval) { startMainLoop(cfg.sampleIntervalMs); }
    console.log('[ZenNode] Config reloaded.');
}
