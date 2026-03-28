// ============================================================================
// ZenNode — Dashboard Webview (Feature #12)
//
// A rich, live-updating dashboard panel displaying:
//   • Score gauge — 0-100 SVG arc with color transitions
//   • Cognitive state label with icon
//   • Per-metric breakdown — animated horizontal bars
//   • Session timeline — SVG line chart from /session/timeline
//   • Session summary — duration, avg/min/max score, state time distribution
//
// Communication:
//   extension.ts → postMessage({ command: 'updateReport', report })
//   webview       → postMessage({ command: 'refresh' }) to request data
//   webview       → fetch() directly to backend for timeline/summary
//
// Singleton panel — only one dashboard open at a time.
// ============================================================================

import * as vscode from 'vscode';
import { CognitiveReport } from './types';
import { SessionStore } from './sessionStore';

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * Show the dashboard webview panel.
 * If already open, reveal it and push the latest report.
 */
export function showDashboard(
    context: vscode.ExtensionContext,
    store: SessionStore,
    latestReport: CognitiveReport | null,
): void {
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Two);
        if (latestReport) {
            currentPanel.webview.postMessage({ command: 'updateReport', report: latestReport });
        }
        _pushStoreData(store);
        return;
    }

    currentPanel = vscode.window.createWebviewPanel(
        'zennode.dashboard',
        '📊 ZenNode — Dashboard',
        vscode.ViewColumn.Two,
        { enableScripts: true, retainContextWhenHidden: true }
    );

    currentPanel.webview.html = getDashboardHtml();

    // Send the latest report + session data immediately
    setTimeout(() => {
        if (latestReport) {
            currentPanel?.webview.postMessage({ command: 'updateReport', report: latestReport });
        }
        _pushStoreData(store);
    }, 500);

    // Handle messages from webview
    currentPanel.webview.onDidReceiveMessage(
        (message) => {
            if (message.command === 'breathe') {
                vscode.commands.executeCommand('zennode.showBreathingExercise');
            } else if (message.command === 'reset') {
                vscode.commands.executeCommand('zennode.resetSession');
            } else if (message.command === 'requestData') {
                _pushStoreData(store);
            }
        },
        undefined,
        context.subscriptions,
    );

    currentPanel.onDidDispose(() => { currentPanel = undefined; });
}

function _pushStoreData(store: SessionStore): void {
    if (!currentPanel) { return; }
    currentPanel.webview.postMessage({
        command: 'sessionData',
        timeline: store.getTimeline(60),
        summary:  store.getSummary(),
        history:  store.getHistory().slice(0, 10),
    });
}

/**
 * Push a new CognitiveReport to the dashboard if it's open.
 * Called from the main loop in extension.ts after each cycle.
 */
export function updateDashboard(report: CognitiveReport): void {
    currentPanel?.webview.postMessage({ command: 'updateReport', report });
}

/**
 * Dispose the dashboard panel (e.g., on deactivation).
 */
export function disposeDashboard(): void {
    currentPanel?.dispose();
    currentPanel = undefined;
}

// ============================================================================
// HTML Generation
// ============================================================================

function getDashboardHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ZenNode Dashboard</title>
<style>
    /* ── Reset & Base ───────────────────────────────────────────── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        background: #0e0e1a;
        color: #d4d4d4;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
        padding: 1.5rem 2rem;
        overflow-y: auto;
        line-height: 1.5;
    }

    /* ── Layout Grid ────────────────────────────────────────────── */
    .dash {
        display: grid;
        grid-template-columns: 320px 1fr;
        grid-template-rows: auto auto;
        gap: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
    }

    .card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        padding: 1.5rem;
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .header {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0 0.5rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        margin-bottom: 0.5rem;
    }

    .header-left { display: flex; align-items: center; gap: 0.8rem; }
    .header-logo { font-size: 1.6rem; }
    .header-title {
        font-size: 1.15rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        color: #4EC9B0;
    }
    .header-sub {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.3);
        letter-spacing: 0.1em;
    }

    .header-actions { display: flex; gap: 0.6rem; }

    .action-btn {
        padding: 0.4rem 1rem;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.03);
        color: #d4d4d4;
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
    }
    .action-btn:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.25);
    }

    /* ── Gauge Card (Left Column) ───────────────────────────────── */
    .gauge-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .gauge-wrap {
        position: relative;
        width: 240px;
        height: 150px;
    }

    .gauge-svg {
        width: 240px;
        height: 150px;
    }

    .gauge-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.06);
        stroke-width: 14;
        stroke-linecap: round;
    }

    .gauge-fg {
        fill: none;
        stroke: #4EC9B0;
        stroke-width: 14;
        stroke-linecap: round;
        transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.8s ease;
    }

    .gauge-score {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 3rem;
        font-weight: 200;
        color: #4EC9B0;
        font-variant-numeric: tabular-nums;
        transition: color 0.8s ease;
        line-height: 1;
    }

    .state-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1.4rem;
        border-radius: 50px;
        background: rgba(78, 201, 176, 0.08);
        border: 1px solid rgba(78, 201, 176, 0.2);
        transition: all 0.8s ease;
    }

    .state-icon { font-size: 1.2rem; }
    .state-label {
        font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #4EC9B0;
        transition: color 0.8s ease;
    }

    /* ── Metrics Card (Left Column) ─────────────────────────────── */
    .metrics-card { grid-column: 1; }

    .card-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: rgba(255, 255, 255, 0.35);
        margin-bottom: 1rem;
    }

    .metric-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.8rem;
    }

    .metric-name {
        width: 75px;
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .metric-bar-bg {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 3px;
        overflow: hidden;
        margin: 0 0.6rem;
    }

    .metric-bar-fg {
        height: 100%;
        border-radius: 3px;
        background: #4EC9B0;
        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.8s ease;
        width: 0%;
    }

    .metric-val {
        width: 32px;
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.6);
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    /* ── Timeline Card (Right Column, spans 2 rows) ─────────────── */
    .timeline-card {
        grid-column: 2;
        grid-row: 1 / 3;
        display: flex;
        flex-direction: column;
    }

    .chart-wrap {
        flex: 1;
        min-height: 200px;
        position: relative;
        margin-top: 0.8rem;
    }

    .chart-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .chart-grid-line {
        stroke: rgba(255, 255, 255, 0.05);
        stroke-width: 1;
        stroke-dasharray: 3, 3;
    }

    .chart-label {
        fill: rgba(255, 255, 255, 0.25);
        font-size: 10px;
        font-family: inherit;
    }

    .chart-area {
        fill: url(#areaGradient);
        opacity: 0.4;
    }

    .chart-line {
        fill: none;
        stroke: #4EC9B0;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .chart-dot {
        r: 3.5;
        fill: #0e0e1a;
        stroke-width: 2;
        stroke: #4EC9B0;
    }

    .chart-zone-flow     { fill: rgba(78, 201, 176, 0.06); }
    .chart-zone-friction { fill: rgba(220, 220, 170, 0.06); }
    .chart-zone-fatigue  { fill: rgba(206, 145, 120, 0.06); }
    .chart-zone-overload { fill: rgba(244, 71, 71, 0.06); }

    .threshold-line {
        stroke-dasharray: 6, 4;
        stroke-width: 1;
    }
    .threshold-30 { stroke: rgba(78, 201, 176, 0.25); }
    .threshold-60 { stroke: rgba(220, 220, 170, 0.25); }
    .threshold-80 { stroke: rgba(244, 71, 71, 0.25); }

    .chart-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: rgba(255, 255, 255, 0.2);
        font-size: 0.85rem;
        letter-spacing: 0.1em;
    }

    /* ── Summary Row ────────────────────────────────────────────── */
    .summary-row {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
    }

    .stat-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem 1.2rem;
        text-align: center;
    }

    .stat-value {
        font-size: 1.6rem;
        font-weight: 300;
        color: #4EC9B0;
        font-variant-numeric: tabular-nums;
        line-height: 1.2;
    }

    .stat-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: rgba(255, 255, 255, 0.3);
        margin-top: 0.3rem;
    }

    /* ── State Time Bars ────────────────────────────────────────── */
    .state-time-wrap { margin-top: 0.8rem; }

    .state-time-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .state-time-icon { width: 24px; text-align: center; font-size: 0.85rem; }

    .state-time-bar-bg {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 4px;
        overflow: hidden;
        margin: 0 0.6rem;
    }

    .state-time-bar-fg {
        height: 100%;
        border-radius: 4px;
        transition: width 1s ease;
        width: 0%;
    }

    .state-time-val {
        width: 50px;
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.45);
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .bar-flow     { background: #4EC9B0; }
    .bar-friction { background: #DCDCAA; }
    .bar-fatigue  { background: #CE9178; }
    .bar-overload { background: #F44747; }

    /* ── Waiting state ──────────────────────────────────────────── */
    .waiting {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        color: rgba(255, 255, 255, 0.3);
    }
    .waiting-icon { font-size: 3rem; margin-bottom: 1rem; }
    .waiting-text { font-size: 0.9rem; letter-spacing: 0.05em; }

    /* ── Intervention Banner ─────────────────────────────────────── */
    .intervention-banner {
        grid-column: 1 / -1;
        display: none;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        background: rgba(244, 71, 71, 0.06);
        border: 1px solid rgba(244, 71, 71, 0.15);
        font-size: 0.88rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.6;
    }

    .intervention-banner.visible { display: block; }
    .intervention-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #F44747;
        margin-bottom: 0.3rem;
    }

    /* ── Colors ──────────────────────────────────────────────────── */
    .color-flow     { color: #4EC9B0; }
    .color-friction { color: #DCDCAA; }
    .color-fatigue  { color: #CE9178; }
    .color-overload { color: #F44747; }
</style>
</head>
<body>

<!-- ━━ Waiting State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="waiting" id="waitingState">
    <div class="waiting-icon">🧠</div>
    <div class="waiting-text">Waiting for first cognitive report...<br>Keep coding — data arrives every 30 seconds.</div>
</div>

<!-- ━━ Main Dashboard ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="dash" id="dashboard" style="display:none;">

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <span class="header-logo">🧠</span>
            <div>
                <div class="header-title">ZenNode Dashboard</div>
                <div class="header-sub">REAL-TIME COGNITIVE MONITOR</div>
            </div>
        </div>
        <div class="header-actions">
            <button class="action-btn" onclick="requestBreathing()">🫁 Breathe</button>
            <button class="action-btn" onclick="requestReset()">🔄 Reset Session</button>
        </div>
    </div>

    <!-- Intervention Banner (hidden by default) -->
    <div class="intervention-banner" id="interventionBanner">
        <div class="intervention-label">🤖 AI Insight</div>
        <div id="interventionText"></div>
    </div>

    <!-- Left Column: Gauge -->
    <div class="card gauge-card">
        <div class="gauge-wrap">
            <svg class="gauge-svg" viewBox="0 0 240 150">
                <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#4EC9B0"/>
                        <stop offset="50%" stop-color="#DCDCAA"/>
                        <stop offset="80%" stop-color="#CE9178"/>
                        <stop offset="100%" stop-color="#F44747"/>
                    </linearGradient>
                </defs>
                <!-- Background arc -->
                <path class="gauge-bg"
                      d="M 24 135 A 96 96 0 0 1 216 135" />
                <!-- Foreground arc — will be animated via dashoffset -->
                <path class="gauge-fg" id="gaugeFg"
                      d="M 24 135 A 96 96 0 0 1 216 135"
                      stroke="url(#gaugeGrad)" />
            </svg>
            <div class="gauge-score" id="gaugeScore">0</div>
        </div>
        <div class="state-badge" id="stateBadge">
            <span class="state-icon" id="stateIcon">🟢</span>
            <span class="state-label" id="stateLabel">FLOW</span>
        </div>
    </div>

    <!-- Left Column: Metric Bars -->
    <div class="card metrics-card">
        <div class="card-title">Metric Breakdown</div>
        <div class="metric-row">
            <span class="metric-name">Switch</span>
            <div class="metric-bar-bg"><div class="metric-bar-fg" id="barSwitch"></div></div>
            <span class="metric-val" id="valSwitch">0</span>
        </div>
        <div class="metric-row">
            <span class="metric-name">Error</span>
            <div class="metric-bar-bg"><div class="metric-bar-fg" id="barError"></div></div>
            <span class="metric-val" id="valError">0</span>
        </div>
        <div class="metric-row">
            <span class="metric-name">Undo</span>
            <div class="metric-bar-bg"><div class="metric-bar-fg" id="barUndo"></div></div>
            <span class="metric-val" id="valUndo">0</span>
        </div>
        <div class="metric-row">
            <span class="metric-name">Idle</span>
            <div class="metric-bar-bg"><div class="metric-bar-fg" id="barIdle"></div></div>
            <span class="metric-val" id="valIdle">0</span>
        </div>
        <div class="metric-row">
            <span class="metric-name">Paste</span>
            <div class="metric-bar-bg"><div class="metric-bar-fg" id="barPaste"></div></div>
            <span class="metric-val" id="valPaste">0</span>
        </div>
    </div>

    <!-- Right Column: Timeline Chart -->
    <div class="card timeline-card">
        <div class="card-title">Session Timeline</div>
        <div class="chart-wrap" id="chartWrap">
            <div class="chart-empty" id="chartEmpty">Collecting data points...</div>
            <svg class="chart-svg" id="chartSvg" style="display:none;" viewBox="0 0 700 260" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stop-color="#4EC9B0" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#4EC9B0" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>
                <!-- Zone backgrounds -->
                <rect class="chart-zone-flow"     x="0" y="182" width="700" height="78"/>
                <rect class="chart-zone-friction"  x="0" y="104" width="700" height="78"/>
                <rect class="chart-zone-fatigue"   x="0" y="52"  width="700" height="52"/>
                <rect class="chart-zone-overload"  x="0" y="0"   width="700" height="52"/>
                <!-- Grid lines at 30, 60, 80 -->
                <line class="threshold-line threshold-30" x1="0" y1="182" x2="700" y2="182"/>
                <line class="threshold-line threshold-60" x1="0" y1="104" x2="700" y2="104"/>
                <line class="threshold-line threshold-80" x1="0" y1="52"  x2="700" y2="52"/>
                <!-- Labels -->
                <text class="chart-label" x="4" y="178">30</text>
                <text class="chart-label" x="4" y="100">60</text>
                <text class="chart-label" x="4" y="48">80</text>
                <text class="chart-label" x="4" y="16">100</text>
                <text class="chart-label" x="4" y="256">0</text>
                <!-- Dynamic elements added by JS -->
                <path class="chart-area" id="chartArea" d=""/>
                <path class="chart-line" id="chartLine" d=""/>
                <g id="chartDots"></g>
            </svg>
        </div>

        <!-- State time distribution -->
        <div class="state-time-wrap">
            <div class="card-title" style="margin-top:1rem;">Time Distribution</div>
            <div class="state-time-row">
                <span class="state-time-icon">🟢</span>
                <div class="state-time-bar-bg"><div class="state-time-bar-fg bar-flow" id="timeBarFlow"></div></div>
                <span class="state-time-val" id="timeValFlow">0s</span>
            </div>
            <div class="state-time-row">
                <span class="state-time-icon">🟡</span>
                <div class="state-time-bar-bg"><div class="state-time-bar-fg bar-friction" id="timeBarFriction"></div></div>
                <span class="state-time-val" id="timeValFriction">0s</span>
            </div>
            <div class="state-time-row">
                <span class="state-time-icon">🟠</span>
                <div class="state-time-bar-bg"><div class="state-time-bar-fg bar-fatigue" id="timeBarFatigue"></div></div>
                <span class="state-time-val" id="timeValFatigue">0s</span>
            </div>
            <div class="state-time-row">
                <span class="state-time-icon">🔴</span>
                <div class="state-time-bar-bg"><div class="state-time-bar-fg bar-overload" id="timeBarOverload"></div></div>
                <span class="state-time-val" id="timeValOverload">0s</span>
            </div>
        </div>
    </div>

    <!-- Summary Row -->
    <div class="summary-row" id="summaryRow">
        <div class="stat-card">
            <div class="stat-value" id="statAvg">—</div>
            <div class="stat-label">Avg Score</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="statMin">—</div>
            <div class="stat-label">Min Score</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="statMax">—</div>
            <div class="stat-label">Max Score</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="statDuration">—</div>
            <div class="stat-label">Session</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="statSnapshots">0</div>
            <div class="stat-label">Snapshots</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="statOverloads">0</div>
            <div class="stat-label">Overloads</div>
        </div>
    </div>
</div>

<script>
    // ── VS Code bridge ──────────────────────────────────────────────
    var vscode = acquireVsCodeApi();
    // Data comes via postMessage from extension (no HTTP backend needed)

    // ── State map for display ───────────────────────────────────────
    var STATE_MAP = {
        flow:     { icon: '🟢', label: 'FLOW',     color: '#4EC9B0', barColor: '#4EC9B0' },
        friction: { icon: '🟡', label: 'FRICTION',  color: '#DCDCAA', barColor: '#DCDCAA' },
        fatigue:  { icon: '🟠', label: 'FATIGUE',   color: '#CE9178', barColor: '#CE9178' },
        overload: { icon: '🔴', label: 'OVERLOAD',  color: '#F44747', barColor: '#F44747' }
    };

    // ── Gauge setup ─────────────────────────────────────────────────
    var gaugeFg     = document.getElementById('gaugeFg');
    var gaugeScore  = document.getElementById('gaugeScore');
    // Compute total arc length for the semicircle
    var gaugeArcLen = gaugeFg.getTotalLength();
    gaugeFg.style.strokeDasharray  = gaugeArcLen;
    gaugeFg.style.strokeDashoffset = gaugeArcLen; // start empty

    // ── DOM refs ────────────────────────────────────────────────────
    var stateIcon    = document.getElementById('stateIcon');
    var stateLabel   = document.getElementById('stateLabel');
    var stateBadge   = document.getElementById('stateBadge');
    var dashboard    = document.getElementById('dashboard');
    var waitingState = document.getElementById('waitingState');
    var banner       = document.getElementById('interventionBanner');
    var bannerText   = document.getElementById('interventionText');

    var barSwitch = document.getElementById('barSwitch');
    var barError  = document.getElementById('barError');
    var barUndo   = document.getElementById('barUndo');
    var barIdle   = document.getElementById('barIdle');
    var barPaste  = document.getElementById('barPaste');
    var valSwitch = document.getElementById('valSwitch');
    var valError  = document.getElementById('valError');
    var valUndo   = document.getElementById('valUndo');
    var valIdle   = document.getElementById('valIdle');
    var valPaste  = document.getElementById('valPaste');

    // ── Update from CognitiveReport ─────────────────────────────────
    function updateReport(r) {
        // Show dashboard, hide waiting
        waitingState.style.display = 'none';
        dashboard.style.display    = 'grid';

        var s = STATE_MAP[r.state] || STATE_MAP.flow;
        var score = Math.round(r.score);

        // ── Gauge arc ──
        var offset = gaugeArcLen * (1 - score / 100);
        gaugeFg.style.strokeDashoffset = offset;
        gaugeScore.textContent = score;
        gaugeScore.style.color = s.color;

        // ── State badge ──
        stateIcon.textContent  = s.icon;
        stateLabel.textContent = s.label;
        stateLabel.style.color = s.color;
        stateBadge.style.borderColor   = s.color + '33';
        stateBadge.style.background    = s.color + '14';

        // ── Metric bars ──
        setMetricBar(barSwitch, valSwitch, r.metrics.switchRate, s.barColor);
        setMetricBar(barError,  valError,  r.metrics.errorRate,  s.barColor);
        setMetricBar(barUndo,   valUndo,   r.metrics.undoRate,   s.barColor);
        setMetricBar(barIdle,   valIdle,   r.metrics.idleRatio,  s.barColor);
        setMetricBar(barPaste,  valPaste,  r.metrics.pasteRatio, s.barColor);

        // ── Intervention banner ──
        if (r.intervention) {
            bannerText.textContent = r.intervention;
            banner.classList.add('visible');
        } else {
            banner.classList.remove('visible');
        }

        // ── Fetch backend data for timeline + summary ──
        fetchTimeline();
        fetchSummary();
    }

    function setMetricBar(barEl, valEl, value, color) {
        var v = Math.min(Math.round(value), 100);
        barEl.style.width = v + '%';
        barEl.style.background = getMetricColor(v);
        valEl.textContent = v;
    }

    function getMetricColor(value) {
        if (value <= 30) return '#4EC9B0';
        if (value <= 60) return '#DCDCAA';
        if (value <= 80) return '#CE9178';
        return '#F44747';
    }

    // ── Timeline chart ──────────────────────────────────────────────
    function fetchTimeline() {
        fetch(BACKEND + '/api/v1/session/timeline')
            .then(function(res) { return res.json(); })
            .then(function(data) { renderTimeline(data.entries || []); })
            .catch(function() {});
    }

    function renderTimeline(entries) {
        var chartSvg   = document.getElementById('chartSvg');
        var chartEmpty = document.getElementById('chartEmpty');
        var chartArea  = document.getElementById('chartArea');
        var chartLine  = document.getElementById('chartLine');
        var chartDots  = document.getElementById('chartDots');

        if (entries.length < 2) {
            chartSvg.style.display   = 'none';
            chartEmpty.style.display = 'flex';
            return;
        }

        chartSvg.style.display   = 'block';
        chartEmpty.style.display = 'none';

        var W = 700, H = 260;
        var padL = 20, padR = 10;
        var usableW = W - padL - padR;
        var n = entries.length;
        var dx = usableW / Math.max(n - 1, 1);

        var points = [];
        for (var i = 0; i < n; i++) {
            var x = padL + i * dx;
            var y = H - (entries[i].score / 100) * H;
            points.push({ x: x, y: y, state: entries[i].state, score: entries[i].score });
        }

        // Build line path
        var linePath = 'M ' + points[0].x + ' ' + points[0].y;
        for (var i = 1; i < points.length; i++) {
            linePath += ' L ' + points[i].x + ' ' + points[i].y;
        }
        chartLine.setAttribute('d', linePath);

        // Build area path (closed to bottom)
        var areaPath = linePath + ' L ' + points[points.length - 1].x + ' ' + H + ' L ' + points[0].x + ' ' + H + ' Z';
        chartArea.setAttribute('d', areaPath);

        // Update area gradient based on latest state
        var lastState = entries[entries.length - 1].state;
        var gradColor = (STATE_MAP[lastState] || STATE_MAP.flow).color;
        var grad = document.getElementById('areaGradient');
        grad.querySelector('stop').setAttribute('stop-color', gradColor);
        chartLine.style.stroke = gradColor;

        // Render dots (only last 30 to keep it clean)
        chartDots.innerHTML = '';
        var startDot = Math.max(0, points.length - 30);
        for (var i = startDot; i < points.length; i++) {
            var p = points[i];
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '3.5');
            circle.setAttribute('fill', '#0e0e1a');
            circle.setAttribute('stroke', (STATE_MAP[p.state] || STATE_MAP.flow).color);
            circle.setAttribute('stroke-width', '2');
            chartDots.appendChild(circle);
        }
    }

    // ── Summary stats ───────────────────────────────────────────────
    function fetchSummary() {
        fetch(BACKEND + '/api/v1/session/summary')
            .then(function(res) { return res.json(); })
            .then(function(data) { renderSummary(data); })
            .catch(function() {});
    }

    function renderSummary(s) {
        document.getElementById('statAvg').textContent       = Math.round(s.avgScore);
        document.getElementById('statMin').textContent       = Math.round(s.minScore);
        document.getElementById('statMax').textContent       = Math.round(s.maxScore);
        document.getElementById('statSnapshots').textContent = s.snapshotCount;
        document.getElementById('statOverloads').textContent = s.overloadCount;
        document.getElementById('statDuration').textContent  = formatDuration(s.durationSeconds);

        // State time distribution bars
        var sd = s.stateDurations;
        var total = sd.flowSeconds + sd.frictionSeconds + sd.fatigueSeconds + sd.overloadSeconds;
        if (total > 0) {
            setTimeBar('timeBarFlow',     'timeValFlow',     sd.flowSeconds,     total);
            setTimeBar('timeBarFriction', 'timeValFriction', sd.frictionSeconds, total);
            setTimeBar('timeBarFatigue',  'timeValFatigue',  sd.fatigueSeconds,  total);
            setTimeBar('timeBarOverload', 'timeValOverload', sd.overloadSeconds, total);
        }
    }

    function setTimeBar(barId, valId, seconds, total) {
        var pct = (seconds / total) * 100;
        document.getElementById(barId).style.width = pct + '%';
        document.getElementById(valId).textContent = formatDuration(seconds);
    }

    function formatDuration(sec) {
        sec = Math.round(sec);
        if (sec < 60) return sec + 's';
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        if (m < 60) return m + 'm ' + s + 's';
        var h = Math.floor(m / 60);
        m = m % 60;
        return h + 'h ' + m + 'm';
    }

    // ── Actions → extension ─────────────────────────────────────────
    function requestBreathing() { vscode.postMessage({ command: 'breathe' }); }
    function requestReset()     { vscode.postMessage({ command: 'reset' }); }

    // ── Listen for messages from extension ──────────────────────────
    window.addEventListener('message', function(event) {
        var msg = event.data;
        if (msg.command === 'updateReport') {
            updateReport(msg.report);
        }
    });
</script>
</body>
</html>`;
}
