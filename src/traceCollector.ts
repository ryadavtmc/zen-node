// ============================================================================
// ZenNode — Trace Collector
// Captures behavioral signals from the developer's VS Code session.
//
// What we track (behavioral metadata ONLY — never code content):
//   • Keystrokes (total count, not which keys)
//   • Backspaces / deletes (error correction signal)
//   • Tab / editor switches (context-switching signal)
//   • Undo actions (decision fatigue signal)
//   • Idle time (disengagement signal)
//   • Paste events with character count (AI-dump signal)
//   • Total characters produced
//
// PRIVACY: We count events. We NEVER record what was typed or pasted.
// ============================================================================

import * as vscode from 'vscode';
import { BehavioralSnapshot } from './types';

/**
 * TraceCollector listens to VS Code editor events and accumulates
 * behavioral counters within a rolling sample window.
 *
 * Usage:
 *   const collector = new TraceCollector();
 *   collector.start();
 *   // ... later ...
 *   const snapshot = collector.flush();  // returns data & resets counters
 *   collector.dispose();
 */
export class TraceCollector implements vscode.Disposable {

    // ── Counters (reset every flush) ──────────────────────────────────
    private _keystrokes = 0;
    private _backspaces = 0;
    private _tabSwitches = 0;
    private _undos = 0;
    private _pastedChars = 0;
    private _totalChars = 0;

    // ── Idle tracking ─────────────────────────────────────────────────
    private _lastActivityTime: number = Date.now();
    private _idleMs = 0;
    private _idleCheckInterval: ReturnType<typeof setInterval> | null = null;

    /** Milliseconds of no input before we start counting "idle" time */
    private static readonly IDLE_THRESHOLD_MS = 3000;

    /** How often we check for idle accumulation */
    private static readonly IDLE_CHECK_INTERVAL_MS = 1000;

    // ── Window timing ─────────────────────────────────────────────────
    private _windowStartTime: number = Date.now();

    // ── VS Code disposables ───────────────────────────────────────────
    private _disposables: vscode.Disposable[] = [];
    private _isRunning = false;

    // ── Event emitter for external listeners ──────────────────────────
    private _onSnapshot = new vscode.EventEmitter<BehavioralSnapshot>();
    public readonly onSnapshot = this._onSnapshot.event;

    constructor() {
        // Nothing here — call start() to begin tracking
    }

    // ====================================================================
    // Lifecycle
    // ====================================================================

    /**
     * Start listening to VS Code events and accumulating traces.
     */
    public start(): void {
        if (this._isRunning) {
            return;
        }
        this._isRunning = true;
        this._windowStartTime = Date.now();
        this._lastActivityTime = Date.now();

        // ── 1. Track text document changes (keystrokes, backspaces, pastes) ──
        this._disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                this._onDocumentChange(e);
            })
        );

        // ── 2. Track tab / editor switches ──
        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                this._onTabSwitch();
            })
        );

        // ── 3. Idle time accumulation via polling ──
        this._idleCheckInterval = setInterval(() => {
            this._checkIdle();
        }, TraceCollector.IDLE_CHECK_INTERVAL_MS);

        // ── 5. Track selection changes as activity (cursor movement = not idle) ──
        this._disposables.push(
            vscode.window.onDidChangeTextEditorSelection(() => {
                this._recordActivity();
            })
        );
    }

    /**
     * Stop all tracking and clean up listeners.
     */
    public stop(): void {
        this._isRunning = false;
        this._disposeListeners();
    }

    /**
     * Returns the accumulated snapshot and resets all counters for the next window.
     * This is called every sampleIntervalMs (default 30s) by the extension loop.
     */
    public flush(): BehavioralSnapshot {
        const now = Date.now();

        // Final idle check before flush
        this._checkIdle();

        const snapshot: BehavioralSnapshot = {
            keystrokes: this._keystrokes,
            backspaces: this._backspaces,
            tabSwitches: this._tabSwitches,
            undos: this._undos,
            idleMs: this._idleMs,
            pastedChars: this._pastedChars,
            totalChars: this._totalChars,
            durationMs: now - this._windowStartTime,
            timestamp: new Date(now).toISOString(),
        };

        // Reset for next window
        this._resetCounters();
        this._windowStartTime = now;

        // Fire event for any external listeners
        this._onSnapshot.fire(snapshot);

        return snapshot;
    }

    /**
     * Reset all counters without returning a snapshot.
     * Used when resetting the session.
     */
    public reset(): void {
        this._resetCounters();
        this._windowStartTime = Date.now();
        this._lastActivityTime = Date.now();
    }

    /**
     * Whether the collector is currently tracking.
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * Clean up everything.
     */
    public dispose(): void {
        this.stop();
        this._onSnapshot.dispose();
    }

    // ====================================================================
    // Event Handlers
    // ====================================================================

    /**
     * Handle text document changes.
     * We analyze the change to classify it as typing, deleting, or pasting.
     *
     * PRIVACY: We only look at change lengths, NEVER the actual text content.
     */
    private _onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
        // Ignore non-user schemes (output panels, git, etc.)
        if (e.document.uri.scheme !== 'file' && e.document.uri.scheme !== 'untitled') {
            return;
        }

        this._recordActivity();

        // Detect undo via the document change reason (VS Code 1.65+)
        if (e.reason === vscode.TextDocumentChangeReason.Undo) {
            this._undos += 1;
            this._keystrokes += 1;
            return; // don't double-count as backspace/insertion
        }

        for (const change of e.contentChanges) {
            const insertedLen = change.text.length;
            const deletedLen = change.rangeLength;

            if (deletedLen > 0 && insertedLen === 0) {
                // ── Pure deletion (backspace / delete key) ──
                this._backspaces += deletedLen;
                this._keystrokes += 1; // count as one keystroke action
            } else if (insertedLen > 0 && deletedLen === 0) {
                // ── Pure insertion ──
                if (this._isPasteEvent(insertedLen)) {
                    // Large insertion = likely paste (Ctrl+V / Cmd+V)
                    this._pastedChars += insertedLen;
                    this._totalChars += insertedLen;
                    this._keystrokes += 1; // paste = 1 keystroke action
                } else {
                    // Normal typing (single char or autocomplete acceptance)
                    this._totalChars += insertedLen;
                    this._keystrokes += insertedLen;
                }
            } else if (insertedLen > 0 && deletedLen > 0) {
                // ── Replacement (e.g., overwrite selection, autocomplete) ──
                this._backspaces += deletedLen;
                if (this._isPasteEvent(insertedLen)) {
                    this._pastedChars += insertedLen;
                }
                this._totalChars += insertedLen;
                this._keystrokes += 1;
            }
        }
    }

    /**
     * Handle editor tab switch.
     * Each switch increments the context-switching counter.
     */
    private _onTabSwitch(): void {
        this._recordActivity();
        this._tabSwitches += 1;
    }

    // ====================================================================
    // Idle Tracking
    // ====================================================================

    /**
     * Record that user activity just happened (resets idle timer).
     */
    private _recordActivity(): void {
        this._lastActivityTime = Date.now();
    }

    /**
     * Check if the user has been idle and accumulate idle time.
     * Called every IDLE_CHECK_INTERVAL_MS.
     */
    private _checkIdle(): void {
        const now = Date.now();
        const timeSinceActivity = now - this._lastActivityTime;

        if (timeSinceActivity >= TraceCollector.IDLE_THRESHOLD_MS) {
            // User is idle — accumulate the check interval as idle time
            // (but only the amount since threshold, on first detection)
            this._idleMs += TraceCollector.IDLE_CHECK_INTERVAL_MS;
        }
    }

    // ====================================================================
    // Helpers
    // ====================================================================

    /**
     * Heuristic: if more than 5 characters are inserted in a single change event,
     * it's likely a paste or autocomplete acceptance, not manual typing.
     * Threshold is intentionally low to catch AI snippet pastes.
     */
    private _isPasteEvent(insertedLength: number): boolean {
        return insertedLength > 5;
    }

    /**
     * Reset all counters to zero for a fresh window.
     */
    private _resetCounters(): void {
        this._keystrokes = 0;
        this._backspaces = 0;
        this._tabSwitches = 0;
        this._undos = 0;
        this._idleMs = 0;
        this._pastedChars = 0;
        this._totalChars = 0;
    }

    /**
     * Dispose all VS Code event listeners and stop the idle timer.
     */
    private _disposeListeners(): void {
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];

        if (this._idleCheckInterval) {
            clearInterval(this._idleCheckInterval);
            this._idleCheckInterval = null;
        }
    }
}
