// ============================================================================
// ZenNode — Zen Bar (Status Bar)
// The always-visible status bar icon that shows real-time cognitive load.
//
// Displays:
//   🟢 Flow (23)     — green, all is well
//   🟡 Friction (45)  — yellow, some stress
//   🟠 Fatigue (67)   — orange, getting tired
//   🔴 Overload (87)  — red, needs intervention
//   ⚠️ Disconnected   — backend unreachable
//
// Click → opens the Cognitive Dashboard (Feature #12)
// Hover → shows detailed tooltip with metric breakdown
// ============================================================================

import * as vscode from 'vscode';
import { CognitiveReport, CognitiveState, STATE_DISPLAY, ZenBarState } from './types';

/**
 * ZenBar manages the status bar item that shows real-time cognitive load.
 *
 * Usage:
 *   const zenBar = new ZenBar();
 *   zenBar.update(report);         // update from a CognitiveReport
 *   zenBar.setDisconnected();      // show disconnected state
 *   zenBar.dispose();
 */
export class ZenBar implements vscode.Disposable {

    private _statusBarItem: vscode.StatusBarItem;
    private _currentState: ZenBarState | null = null;

    constructor() {
        // Create status bar item on the right side, high priority so it's visible
        this._statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            1000 // high priority = appears toward the left of right-aligned items
        );

        // Click opens the dashboard command
        this._statusBarItem.command = 'zennode.showDashboard';

        // Initialize with a "starting" state
        this._setStarting();

        // Show immediately
        this._statusBarItem.show();
    }

    // ====================================================================
    // Public API
    // ====================================================================

    /**
     * Update the Zen Bar with a new cognitive report from the backend.
     */
    public update(report: CognitiveReport): void {
        const display = STATE_DISPLAY[report.state];
        const state: ZenBarState = {
            score: Math.round(report.score),
            state: report.state,
            icon: display.icon,
            label: display.label,
            color: display.color,
            tooltip: this._buildTooltip(report),
        };

        this._currentState = state;
        this._render(state);
    }

    /**
     * Show a disconnected / backend-unreachable state.
     */
    public setDisconnected(): void {
        this._statusBarItem.text = '$(warning) ZenNode: Offline';
        this._statusBarItem.tooltip = new vscode.MarkdownString(
            '### ⚠️ ZenNode Backend Offline\n\n' +
            'Cannot reach the cognitive engine.\n\n' +
            '**To fix:** Run the backend with:\n' +
            '```\ncd backend && source .venv/bin/activate\n' +
            'uvicorn main:app --reload --port 8420\n```\n\n' +
            '_Click to retry._'
        );
        this._statusBarItem.backgroundColor = new vscode.ThemeColor(
            'statusBarItem.warningBackground'
        );
        this._statusBarItem.color = undefined;
    }

    /**
     * Show a "paused / tracking disabled" state.
     */
    public setPaused(): void {
        this._statusBarItem.text = '$(debug-pause) ZenNode: Paused';
        this._statusBarItem.tooltip = 'ZenNode tracking is paused. Click to resume.';
        this._statusBarItem.backgroundColor = undefined;
        this._statusBarItem.color = new vscode.ThemeColor('descriptionForeground');
    }

    /**
     * Get the current cognitive state, if any.
     */
    public get currentState(): ZenBarState | null {
        return this._currentState;
    }

    /**
     * Get the current score, or 0 if no report received yet.
     */
    public get currentScore(): number {
        return this._currentState?.score ?? 0;
    }

    public dispose(): void {
        this._statusBarItem.dispose();
    }

    // ====================================================================
    // Rendering
    // ====================================================================

    /**
     * Render the status bar item with the given state.
     */
    private _render(state: ZenBarState): void {
        // Text: "🟢 ZenNode: Flow (23)"
        this._statusBarItem.text = `${state.icon} ZenNode: ${state.label} (${state.score})`;

        // Tooltip: rich markdown with metric breakdown
        this._statusBarItem.tooltip = new vscode.MarkdownString(state.tooltip);

        // Background color for critical states
        if (state.state === 'overload') {
            this._statusBarItem.backgroundColor = new vscode.ThemeColor(
                'statusBarItem.errorBackground'
            );
        } else if (state.state === 'fatigue') {
            this._statusBarItem.backgroundColor = new vscode.ThemeColor(
                'statusBarItem.warningBackground'
            );
        } else {
            this._statusBarItem.backgroundColor = undefined;
        }

        // Text color hint (VS Code may override this based on background)
        this._statusBarItem.color = undefined;
    }

    /**
     * Show the initial "starting up" state before any data arrives.
     */
    private _setStarting(): void {
        this._statusBarItem.text = '$(sync~spin) ZenNode: Starting...';
        this._statusBarItem.tooltip = 'ZenNode is initializing. Waiting for first behavioral snapshot...';
        this._statusBarItem.backgroundColor = undefined;
        this._statusBarItem.color = new vscode.ThemeColor('descriptionForeground');
    }

    // ====================================================================
    // Tooltip Builder
    // ====================================================================

    /**
     * Build a rich markdown tooltip showing the score and metric breakdown.
     *
     * Example:
     *   ### 🟡 Friction — Score: 45/100
     *   | Metric | Score |
     *   |--------|-------|
     *   | Context Switching | ██████░░░░ 60 |
     *   | Error Rate        | ███░░░░░░░ 30 |
     *   ...
     */
    private _buildTooltip(report: CognitiveReport): string {
        const display = STATE_DISPLAY[report.state];
        const m = report.metrics;

        const bar = (value: number): string => {
            const filled = Math.round(value / 10);
            const empty = 10 - filled;
            return '█'.repeat(filled) + '░'.repeat(empty);
        };

        const stateEmoji = this._getStateEmoji(report.state);

        return [
            `### ${display.icon} ${display.label} — Score: ${Math.round(report.score)}/100`,
            '',
            `${stateEmoji}`,
            '',
            '| Metric | Level | Score |',
            '|--------|-------|-------|',
            `| 🔀 Context Switching | ${bar(m.switchRate)} | ${Math.round(m.switchRate)} |`,
            `| ⌫ Error Rate | ${bar(m.errorRate)} | ${Math.round(m.errorRate)} |`,
            `| ↩️ Undo Rate | ${bar(m.undoRate)} | ${Math.round(m.undoRate)} |`,
            `| 💤 Idle Time | ${bar(m.idleRatio)} | ${Math.round(m.idleRatio)} |`,
            `| 📋 Paste Ratio | ${bar(m.pasteRatio)} | ${Math.round(m.pasteRatio)} |`,
            '',
            '_Click for full dashboard. Updated every 30s._',
        ].join('\n');
    }

    /**
     * Get a human-friendly description for the current state.
     */
    private _getStateEmoji(state: CognitiveState): string {
        switch (state) {
            case 'flow':
                return '🧘 **You\'re in the zone.** Keep going — ZenNode is watching quietly.';
            case 'friction':
                return '⚡ **Some friction detected.** A few rough patches, but nothing serious yet.';
            case 'fatigue':
                return '😮‍💨 **Fatigue building.** Your brain is working hard. Consider a short break soon.';
            case 'overload':
                return '🚨 **Cognitive overload!** Too much context-switching and correction. Time to slow down.';
        }
    }
}
