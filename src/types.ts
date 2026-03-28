// ============================================================================
// ZenNode — Shared Types & Interfaces
// All data structures shared between extension modules live here.
// ============================================================================

/**
 * Raw behavioral data collected by the TraceCollector every sample interval.
 * This is the payload sent to the FastAPI backend via HTTP POST.
 *
 * PRIVACY: This contains behavioral metadata ONLY — never source code content.
 */
export interface BehavioralSnapshot {
    /** Total keystrokes (including characters, enter, space) in the sample window */
    keystrokes: number;

    /** Number of backspace/delete presses in the sample window */
    backspaces: number;

    /** Number of tab/editor switches in the sample window */
    tabSwitches: number;

    /** Number of Ctrl+Z / Cmd+Z undo actions in the sample window */
    undos: number;

    /** Total milliseconds of idle time (no input) in the sample window */
    idleMs: number;

    /** Number of characters pasted (Ctrl+V / Cmd+V) in the sample window */
    pastedChars: number;

    /** Total characters typed (non-delete keystrokes) in the sample window */
    totalChars: number;

    /** Duration of this sample window in milliseconds (typically 30000) */
    durationMs: number;

    /** ISO 8601 timestamp when this snapshot was taken */
    timestamp: string;
}

/**
 * The four cognitive states ZenNode can classify.
 * Maps directly to the backend's state classifier.
 */
export type CognitiveState = 'flow' | 'friction' | 'fatigue' | 'overload';

/**
 * Response from the FastAPI backend after processing a BehavioralSnapshot.
 */
export interface CognitiveReport {
    /** Cognitive load score from 0 (calm) to 100 (overloaded) */
    score: number;

    /** Classified cognitive state */
    state: CognitiveState;

    /** Whether the extension should shift to warm-amber theme */
    themeShift: boolean;

    /** LLM-generated supportive intervention message (null if LLM disabled or not in red zone) */
    intervention: string | null;

    /** Breakdown of individual metric scores (0-100 each) */
    metrics: MetricBreakdown;
}

/**
 * Individual metric scores computed by the backend scorer.
 * Each is normalized to 0–100 range.
 */
export interface MetricBreakdown {
    switchRate: number;
    errorRate: number;
    undoRate: number;
    idleRatio: number;
    pasteRatio: number;
}

/**
 * Configuration values read from VS Code settings (zennode.*).
 */
export interface ZenNodeConfig {
    enabled: boolean;
    sampleIntervalMs: number;
    enableThemeShift: boolean;
    enableLLM: boolean;
    warningThreshold: number;
    criticalThreshold: number;
    showNotifications: boolean;
}

/**
 * Zen Bar display state — what the status bar icon should show.
 */
export interface ZenBarState {
    score: number;
    state: CognitiveState;
    icon: string;       // e.g. "🟢", "🟡", "🟠", "🔴"
    label: string;      // e.g. "Flow", "Friction", "Fatigue", "Overload"
    color: string;      // VS Code theme color ID
    tooltip: string;    // Detailed tooltip text
}

/**
 * Maps cognitive state to display properties for the Zen Bar.
 */
export const STATE_DISPLAY: Record<CognitiveState, { icon: string; label: string; color: string }> = {
    flow: { icon: '🟢', label: 'Flow', color: '#4EC9B0' },  // green
    friction: { icon: '🟡', label: 'Friction', color: '#DCDCAA' },  // yellow
    fatigue: { icon: '🟠', label: 'Fatigue', color: '#CE9178' },  // orange
    overload: { icon: '🔴', label: 'Overload', color: '#F44747' },  // red
};
