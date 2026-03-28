// ============================================================================
// ZenNode — Breathing Exercise (Feature #11)
//
// An animated webview panel guiding the developer through 4-7-8 breathing:
//   Inhale (4s) → Hold (7s) → Exhale (8s) = 19s per cycle × 3 cycles ≈ 1 min
//
// Visual design:
//   • Central orb that grows, holds, and shrinks with phase-specific colors
//   • SVG progress ring showing overall completion
//   • Ambient floating particles for immersion
//   • Three screens: Intro → Exercise → Completion
//   • Calming dark palette: greens → blues → purples
//
// Singleton pattern — only one panel open at a time.
// ============================================================================

import * as vscode from 'vscode';

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * Show the breathing exercise webview panel.
 * If a panel already exists, it is revealed instead of creating a new one.
 */
export function showBreathingExercise(context: vscode.ExtensionContext): void {
    // Singleton — reuse existing panel if open
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.One);
        return;
    }

    currentPanel = vscode.window.createWebviewPanel(
        'zennode.breathingExercise',
        '🫁 ZenNode — Breathing Exercise',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: false,
        }
    );

    currentPanel.webview.html = getBreathingHtml();

    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
        (message) => {
            if (message.command === 'complete') {
                vscode.window.showInformationMessage(
                    '🧘 ZenNode: Breathing exercise complete. You should feel calmer now. Back to coding! 💚'
                );
                currentPanel?.dispose();
            } else if (message.command === 'close') {
                currentPanel?.dispose();
            }
        },
        undefined,
        context.subscriptions
    );

    // Clean up reference on close
    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });
}

/**
 * Programmatically dispose the breathing exercise panel (e.g., on deactivation).
 */
export function disposeBreathingExercise(): void {
    currentPanel?.dispose();
    currentPanel = undefined;
}

// ============================================================================
// HTML Generation — The Full Webview
// ============================================================================

function getBreathingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Breathing Exercise</title>
<style>
    /* ── Reset & Base ───────────────────────────────────────────── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        background: #0a0a1a;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        overflow: hidden;
        user-select: none;
    }

    /* ── Background ─────────────────────────────────────────────── */
    .bg {
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at 50% 50%, #1a1a3a 0%, #0a0a1a 70%);
        z-index: -2;
    }

    /* ── Ambient Particles ──────────────────────────────────────── */
    .particles {
        position: fixed;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
    }

    .particle {
        position: absolute;
        border-radius: 50%;
        background: rgba(78, 201, 176, 0.15);
        pointer-events: none;
    }

    @keyframes drift-up {
        0%, 100% { transform: translate(0, 0);      opacity: 0.04; }
        50%      { transform: translate(12px, -28px); opacity: 0.22; }
    }

    @keyframes drift-side {
        0%, 100% { transform: translate(0, 0);       opacity: 0.06; }
        50%      { transform: translate(-18px, -14px); opacity: 0.18; }
    }

    /* ── Screen Containers ──────────────────────────────────────── */
    .screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        opacity: 0;
        transition: opacity 0.8s ease;
        position: absolute;
        pointer-events: none;
    }

    .screen.active {
        opacity: 1;
        pointer-events: auto;
    }

    /* ── The Breathing Orb ──────────────────────────────────────── */
    .orb-wrap {
        position: relative;
        width: 280px;
        height: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .orb {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #4EC9B0, #2196F3, #1a237e);
        box-shadow:
            0 0 40px rgba(78, 201, 176, 0.3),
            0 0 80px rgba(33, 150, 243, 0.15),
            inset 0 0 30px rgba(255, 255, 255, 0.05);
        transition: transform 4s ease-in-out, box-shadow 2s ease;
        will-change: transform;
    }

    /* Scale states — JS toggles these classes */
    .orb.expanded {
        transform: scale(2.2);
    }

    /* Gentle glow pulsing during the Hold phase */
    .orb.hold-glow {
        animation: glow-pulse 2.5s ease-in-out infinite;
    }

    @keyframes glow-pulse {
        0%, 100% {
            box-shadow:
                0 0 40px rgba(78, 201, 176, 0.4),
                0 0 80px rgba(33, 150, 243, 0.2),
                inset 0 0 30px rgba(255, 255, 255, 0.05);
        }
        50% {
            box-shadow:
                0 0 70px rgba(78, 201, 176, 0.6),
                0 0 140px rgba(33, 150, 243, 0.35),
                inset 0 0 40px rgba(255, 255, 255, 0.1);
        }
    }

    /* Intro idle pulse */
    .orb.intro-pulse {
        animation: intro-breathe 3s ease-in-out infinite;
    }

    @keyframes intro-breathe {
        0%, 100% { transform: scale(1);    opacity: 0.9; }
        50%      { transform: scale(1.08); opacity: 1;   }
    }

    /* Phase-specific orb gradients */
    .orb.phase-inhale {
        background: radial-gradient(circle at 35% 35%, #4EC9B0, #26C6DA, #00838F);
    }
    .orb.phase-hold {
        background: radial-gradient(circle at 35% 35%, #64B5F6, #42A5F5, #1565C0);
    }
    .orb.phase-exhale {
        background: radial-gradient(circle at 35% 35%, #B388FF, #7C4DFF, #311B92);
    }

    /* ── SVG Progress Ring ──────────────────────────────────────── */
    .progress-ring {
        position: absolute;
        top: 0;
        left: 0;
    }

    .ring-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.06);
        stroke-width: 2;
    }

    .ring-fg {
        fill: none;
        stroke: #4EC9B0;
        stroke-width: 2.5;
        stroke-linecap: round;
        transform: rotate(-90deg);
        transform-origin: center;
        transition: stroke-dashoffset 1s linear, stroke 1s ease;
    }

    /* ── Typography ─────────────────────────────────────────────── */
    .title {
        font-size: 1.8rem;
        font-weight: 300;
        letter-spacing: 0.15em;
        color: #4EC9B0;
        text-shadow: 0 0 30px rgba(78, 201, 176, 0.3);
    }

    .subtitle {
        color: rgba(255, 255, 255, 0.45);
        text-align: center;
        max-width: 380px;
        line-height: 1.7;
        font-size: 0.95rem;
        font-weight: 300;
    }

    .phase-text {
        font-size: 1.6rem;
        font-weight: 300;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: #4EC9B0;
        text-shadow: 0 0 20px currentColor;
        min-height: 2.5rem;
        transition: color 1s ease;
    }

    .timer-text {
        font-size: 4.5rem;
        font-weight: 100;
        color: rgba(255, 255, 255, 0.5);
        font-variant-numeric: tabular-nums;
        line-height: 1;
        min-height: 5rem;
    }

    .cycle-text {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 0.2em;
        text-transform: uppercase;
    }

    /* ── Buttons ─────────────────────────────────────────────────── */
    .btn {
        padding: 0.9rem 3rem;
        border: 1px solid rgba(78, 201, 176, 0.4);
        border-radius: 50px;
        background: rgba(78, 201, 176, 0.05);
        color: #4EC9B0;
        font-size: 1rem;
        letter-spacing: 0.2em;
        cursor: pointer;
        transition: all 0.3s ease;
        outline: none;
        font-family: inherit;
    }

    .btn:hover {
        background: rgba(78, 201, 176, 0.15);
        border-color: #4EC9B0;
        box-shadow: 0 0 25px rgba(78, 201, 176, 0.2);
        transform: translateY(-1px);
    }

    .btn:active { transform: translateY(0); }

    .btn-ghost {
        border-color: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.35);
        background: transparent;
        padding: 0.5rem 2rem;
        font-size: 0.8rem;
    }

    .btn-ghost:hover {
        border-color: rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.6);
        box-shadow: none;
    }

    /* ── Completion Screen ──────────────────────────────────────── */
    .done-emoji  { font-size: 3.5rem; margin-bottom: 0.5rem; }
    .done-title  {
        font-size: 2.2rem;
        font-weight: 200;
        color: #4EC9B0;
        letter-spacing: 0.1em;
    }
    .done-body {
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        line-height: 1.8;
        font-size: 1rem;
        font-weight: 300;
        max-width: 350px;
    }
</style>
</head>
<body>

<div class="bg"></div>
<div class="particles" id="particles"></div>

<!-- ━━ Intro Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="screen active" id="introScreen">
    <div class="orb-wrap">
        <div class="orb intro-pulse"></div>
    </div>
    <div class="title">Breathing Exercise</div>
    <div class="subtitle">
        Follow the 4&#8209;7&#8209;8 pattern.<br>
        Inhale for 4 seconds. Hold for 7. Exhale for 8.<br>
        Three cycles. About one minute.
    </div>
    <button class="btn" id="startBtn">BEGIN</button>
    <button class="btn btn-ghost" id="skipBtn">NOT NOW</button>
</div>

<!-- ━━ Exercise Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="screen" id="exerciseScreen">
    <div class="cycle-text" id="cycleText">CYCLE 1 OF 3</div>
    <div class="orb-wrap">
        <svg class="progress-ring" width="280" height="280" viewBox="0 0 280 280">
            <circle class="ring-bg" cx="140" cy="140" r="130" />
            <circle class="ring-fg" id="ringFg" cx="140" cy="140" r="130"
                    stroke-dasharray="816.81" stroke-dashoffset="816.81" />
        </svg>
        <div class="orb" id="breathOrb"></div>
    </div>
    <div class="phase-text" id="phaseText"></div>
    <div class="timer-text" id="timerText"></div>
</div>

<!-- ━━ Completion Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<div class="screen" id="completeScreen">
    <div class="done-emoji">🧘</div>
    <div class="done-title">Well Done</div>
    <div class="done-body">
        You completed 3 breathing cycles.<br>
        Your nervous system should feel calmer now.<br>
        Take this feeling back into your code.
    </div>
    <button class="btn" id="doneBtn">BACK TO CODE</button>
</div>

<script>
    // ── VS Code API bridge ──────────────────────────────────────────
    var vscode = acquireVsCodeApi();

    // ── Constants ───────────────────────────────────────────────────
    var PHASES = [
        { name: 'Inhale',  dur: 4, css: 'phase-inhale', color: '#4EC9B0', ring: '#4EC9B0' },
        { name: 'Hold',    dur: 7, css: 'phase-hold',   color: '#64B5F6', ring: '#64B5F6' },
        { name: 'Exhale',  dur: 8, css: 'phase-exhale', color: '#B388FF', ring: '#B388FF' }
    ];
    var TOTAL_CYCLES    = 3;
    var CYCLE_DURATION  = 4 + 7 + 8;                   // 19 seconds
    var RING_CIRC       = 2 * Math.PI * 130;            // ≈ 816.81

    // ── Mutable state ───────────────────────────────────────────────
    var cycle     = 0;
    var phaseIdx  = 0;
    var remaining = 0;
    var tickTimer = null;

    // ── DOM refs ────────────────────────────────────────────────────
    var introScreen    = document.getElementById('introScreen');
    var exerciseScreen = document.getElementById('exerciseScreen');
    var completeScreen = document.getElementById('completeScreen');
    var breathOrb      = document.getElementById('breathOrb');
    var phaseText      = document.getElementById('phaseText');
    var timerText      = document.getElementById('timerText');
    var cycleText      = document.getElementById('cycleText');
    var ringFg         = document.getElementById('ringFg');

    // ── Particles ───────────────────────────────────────────────────
    (function () {
        var box = document.getElementById('particles');
        var anims = ['drift-up', 'drift-side'];
        for (var i = 0; i < 22; i++) {
            var p = document.createElement('div');
            p.className = 'particle';
            var size = Math.random() * 4 + 2;
            p.style.width  = size + 'px';
            p.style.height = size + 'px';
            p.style.left   = (Math.random() * 100) + 'vw';
            p.style.top    = (Math.random() * 100) + 'vh';
            p.style.opacity = (Math.random() * 0.15 + 0.03).toFixed(2);
            var anim = anims[i % 2];
            var dur  = (Math.random() * 5 + 5).toFixed(1);
            var del  = (Math.random() * 8).toFixed(1);
            p.style.animation = anim + ' ' + dur + 's ' + del + 's ease-in-out infinite alternate';
            box.appendChild(p);
        }
    })();

    // ── Button wiring ───────────────────────────────────────────────
    document.getElementById('startBtn').addEventListener('click', beginExercise);
    document.getElementById('skipBtn').addEventListener('click',  function () { vscode.postMessage({ command: 'close' }); });
    document.getElementById('doneBtn').addEventListener('click',  function () { vscode.postMessage({ command: 'complete' }); });

    // ── Screen transitions ──────────────────────────────────────────
    function showScreen(el) {
        introScreen.classList.remove('active');
        exerciseScreen.classList.remove('active');
        completeScreen.classList.remove('active');
        setTimeout(function () { el.classList.add('active'); }, 120);
    }

    // ── Exercise entry point ────────────────────────────────────────
    function beginExercise() {
        showScreen(exerciseScreen);
        cycle    = 0;
        phaseIdx = 0;

        phaseText.textContent = 'GET READY';
        phaseText.style.color = 'rgba(255,255,255,0.5)';
        timerText.textContent = '';
        cycleText.textContent = 'CYCLE 1 OF ' + TOTAL_CYCLES;
        updateRing();

        // Brief lead-in before first inhale
        setTimeout(runPhase, 1600);
    }

    // ── Phase runner (recursive) ────────────────────────────────────
    function runPhase() {
        // Check if all cycles are done
        if (cycle >= TOTAL_CYCLES) {
            finishExercise();
            return;
        }

        // Advance cycle when all 3 phases are done
        if (phaseIdx >= PHASES.length) {
            cycle++;
            phaseIdx = 0;
            if (cycle >= TOTAL_CYCLES) {
                finishExercise();
                return;
            }
            cycleText.textContent = 'CYCLE ' + (cycle + 1) + ' OF ' + TOTAL_CYCLES;
        }

        var phase = PHASES[phaseIdx];
        remaining = phase.dur;

        // ── Update visuals ──
        phaseText.textContent = phase.name;
        phaseText.style.color = phase.color;
        timerText.textContent = remaining;
        ringFg.style.stroke   = phase.ring;

        // Remove old phase classes, apply new one
        breathOrb.classList.remove('phase-inhale', 'phase-hold', 'phase-exhale', 'hold-glow');
        breathOrb.classList.add(phase.css);

        if (phase.name === 'Inhale') {
            breathOrb.style.transitionDuration = phase.dur + 's';
            breathOrb.classList.add('expanded');
        } else if (phase.name === 'Hold') {
            breathOrb.style.transitionDuration = '0.3s';
            breathOrb.classList.add('expanded', 'hold-glow');
        } else {
            // Exhale
            breathOrb.style.transitionDuration = phase.dur + 's';
            breathOrb.classList.remove('expanded', 'hold-glow');
        }

        // ── Tick every second ──
        tickTimer = setInterval(function () {
            remaining--;
            updateRing();
            if (remaining <= 0) {
                clearInterval(tickTimer);
                tickTimer = null;
                phaseIdx++;
                runPhase();
            } else {
                timerText.textContent = remaining;
            }
        }, 1000);
    }

    // ── Progress ring update ────────────────────────────────────────
    function updateRing() {
        var totalSec = TOTAL_CYCLES * CYCLE_DURATION;
        var elapsed  = cycle * CYCLE_DURATION;
        for (var i = 0; i < phaseIdx && i < PHASES.length; i++) {
            elapsed += PHASES[i].dur;
        }
        if (phaseIdx < PHASES.length) {
            elapsed += (PHASES[phaseIdx].dur - remaining);
        }
        var frac = Math.min(elapsed / totalSec, 1);
        ringFg.style.strokeDashoffset = (RING_CIRC * (1 - frac)).toFixed(2);
    }

    // ── Completion ──────────────────────────────────────────────────
    function finishExercise() {
        // Fill the ring fully
        ringFg.style.strokeDashoffset = '0';
        timerText.textContent = '';
        phaseText.textContent = '';

        // Reset orb to resting state
        breathOrb.classList.remove('expanded', 'hold-glow', 'phase-inhale', 'phase-hold', 'phase-exhale');
        breathOrb.style.transitionDuration = '1.5s';

        setTimeout(function () { showScreen(completeScreen); }, 600);
    }
</script>
</body>
</html>`;
}
