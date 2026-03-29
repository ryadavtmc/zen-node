// ============================================================================
// ZenNode — Cognitive Load Scorer (TypeScript port of scorer.py)
//
// Pure math engine. Takes a BehavioralSnapshot, normalizes metrics,
// computes a weighted cognitive load score (0–100), and classifies state.
// Runs entirely inside the VS Code extension — no server needed.
// ============================================================================

import { BehavioralSnapshot, CognitiveReport, CognitiveState, MetricBreakdown } from './types';

// ── Scoring weights (must sum to 1.0) ──────────────────────────────────────
const WEIGHT_SWITCH_RATE = 0.25;
const WEIGHT_ERROR_RATE = 0.20;
const WEIGHT_UNDO_RATE = 0.25;
const WEIGHT_IDLE_RATIO = 0.15;
const WEIGHT_PASTE_RATIO = 0.15;

// ── Normalization caps ─────────────────────────────────────────────────────
const SWITCH_RATE_CAP = 15.0;   // switches/minute → 100
const ERROR_RATE_CAP = 50.0;   // backspace % → 100
const UNDO_RATE_CAP = 10.0;   // undos/minute → 100
const IDLE_RATIO_CAP = 80.0;   // idle % → 100
const PASTE_RATIO_CAP = 90.0;   // paste % → 100

// ── State thresholds ───────────────────────────────────────────────────────
// export const THRESHOLD_FLOW_MAX = 10;  // TEST: lowered from 30
// export const THRESHOLD_FRICTION_MAX = 20;  // TEST: lowered from 60
// export const THRESHOLD_FATIGUE_MAX = 30;  // TEST: lowered from 80
// export const THRESHOLD_THEME_SHIFT = 30;  // TEST: lowered from 80
// export const THRESHOLD_LLM_TRIGGER = 30;  // TEST: lowered from 80

export const THRESHOLD_FLOW_MAX = 30;
export const THRESHOLD_FRICTION_MAX = 60;
export const THRESHOLD_FATIGUE_MAX = 80;
export const THRESHOLD_THEME_SHIFT = 80;
export const THRESHOLD_LLM_TRIGGER = 80;

// ── EMA smoothing ──────────────────────────────────────────────────────────
const EMA_ALPHA = 0.6;
const MIN_KEYSTROKES = 3;

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, lo = 0, hi = 100): number {
    return Math.max(lo, Math.min(hi, value));
}

function normalize(raw: number, cap: number): number {
    if (cap <= 0) { return 0; }
    return clamp((raw / cap) * 100);
}

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

// ── Metric computation ─────────────────────────────────────────────────────

function computeMetrics(snapshot: BehavioralSnapshot): MetricBreakdown {
    const durationMin = Math.max(snapshot.durationMs / 60_000, 0.5);

    const rawSwitchRate = snapshot.tabSwitches / durationMin;
    const switchRate = normalize(rawSwitchRate, SWITCH_RATE_CAP);

    const rawErrorRate = snapshot.keystrokes > 0
        ? (snapshot.backspaces / snapshot.keystrokes) * 100
        : 0;
    const errorRate = normalize(rawErrorRate, ERROR_RATE_CAP);

    const rawUndoRate = snapshot.undos / durationMin;
    const undoRate = normalize(rawUndoRate, UNDO_RATE_CAP);

    const rawIdleRatio = (snapshot.idleMs / snapshot.durationMs) * 100;
    const idleRatio = normalize(rawIdleRatio, IDLE_RATIO_CAP);

    const rawPasteRatio = snapshot.totalChars > 0
        ? (snapshot.pastedChars / snapshot.totalChars) * 100
        : 0;
    const pasteRatio = normalize(rawPasteRatio, PASTE_RATIO_CAP);

    return {
        switchRate: round1(switchRate),
        errorRate: round1(errorRate),
        undoRate: round1(undoRate),
        idleRatio: round1(idleRatio),
        pasteRatio: round1(pasteRatio),
    };
}

function computeScore(metrics: MetricBreakdown): number {
    const raw =
        WEIGHT_SWITCH_RATE * metrics.switchRate +
        WEIGHT_ERROR_RATE * metrics.errorRate +
        WEIGHT_UNDO_RATE * metrics.undoRate +
        WEIGHT_IDLE_RATIO * metrics.idleRatio +
        WEIGHT_PASTE_RATIO * metrics.pasteRatio;
    return clamp(round1(raw));
}

function classifyState(score: number): CognitiveState {
    if (score <= THRESHOLD_FLOW_MAX) { return 'flow'; }
    if (score <= THRESHOLD_FRICTION_MAX) { return 'friction'; }
    if (score <= THRESHOLD_FATIGUE_MAX) { return 'fatigue'; }
    return 'overload';
}

// ── Stateful scorer with EMA ───────────────────────────────────────────────

export class CognitiveScorer {
    private _emaScore: number | null = null;

    score(snapshot: BehavioralSnapshot): CognitiveReport {
        if (snapshot.keystrokes < MIN_KEYSTROKES) {
            return this._neutralReport();
        }

        const metrics = computeMetrics(snapshot);
        const rawScore = computeScore(metrics);

        const smoothed = this._emaScore === null
            ? rawScore
            : round1(EMA_ALPHA * rawScore + (1 - EMA_ALPHA) * this._emaScore);

        this._emaScore = smoothed;

        return {
            score: smoothed,
            state: classifyState(smoothed),
            themeShift: smoothed >= THRESHOLD_THEME_SHIFT,
            intervention: null,
            metrics,
        };
    }

    reset(): void {
        this._emaScore = null;
    }

    get lastScore(): number | null {
        return this._emaScore;
    }

    /** Restore EMA from a persisted value (e.g. after VS Code restart). */
    restoreEma(score: number): void {
        this._emaScore = score;
    }

    private _neutralReport(): CognitiveReport {
        // Gently decay EMA toward 0 during idle periods
        if (this._emaScore !== null) {
            this._emaScore = round1(this._emaScore * 0.8);
        }
        const score = this._emaScore ?? 0;
        return {
            score,
            state: classifyState(score),
            themeShift: false,
            intervention: null,
            metrics: { switchRate: 0, errorRate: 0, undoRate: 0, idleRatio: 0, pasteRatio: 0 },
        };
    }
}
