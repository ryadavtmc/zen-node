// ============================================================================
// ZenNode — Session Store
//
// Persists cognitive session data to a JSON file in VS Code's global storage.
// No native dependencies — pure Node.js fs module.
//
// Stores:
//   • Current session timeline (timestamp, score, state)
//   • Session history (archived summaries)
//   • App settings (EMA, cloud credentials key)
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { CognitiveReport, CognitiveState } from './types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface TimelineEntry {
    timestamp: string;
    score: number;
    state: CognitiveState;
    themeShift: boolean;
}

export interface SessionSummary {
    sessionId: string;
    startedAt: string;
    endedAt: string;
    avgScore: number;
    maxScore: number;
    minScore: number;
    snapshotCount: number;
    overloadCount: number;
    flowSeconds: number;
    frictionSeconds: number;
    fatigueSeconds: number;
    overloadSeconds: number;
    syncedToCloud: boolean;
}

interface StoredData {
    currentSession: {
        sessionId: string;
        startedAt: string;
        timeline: TimelineEntry[];
        lastEmaScore: number | null;
        lastEntryTime: string | null;
        lastState: CognitiveState;
        stateDurations: Record<CognitiveState, number>;
        overloadCount: number;
        themeShifts: number;
    };
    history: SessionSummary[];
}

// ── Store ──────────────────────────────────────────────────────────────────

export class SessionStore {
    private _filePath: string;
    private _data: StoredData;

    constructor(storagePath: string) {
        this._filePath = path.join(storagePath, 'sessions.json');
        this._data = this._load();
    }

    // ── Read API ────────────────────────────────────────────────────────────

    get snapshotCount(): number {
        return this._data.currentSession.timeline.length;
    }

    get savedEmaScore(): number | null {
        return this._data.currentSession.lastEmaScore;
    }

    getTimeline(lastN?: number): TimelineEntry[] {
        const t = this._data.currentSession.timeline;
        return lastN ? t.slice(-lastN) : [...t];
    }

    getSummary() {
        const session = this._data.currentSession;
        const { timeline, stateDurations, overloadCount, themeShifts, startedAt } = session;

        // Include elapsed time in the current in-progress state (not yet flushed to stateDurations)
        const elapsedNow = session.lastEntryTime
            ? (Date.now() - new Date(session.lastEntryTime).getTime()) / 1000
            : 0;
        const durations = { ...stateDurations };
        durations[session.lastState] += elapsedNow;

        if (timeline.length === 0) {
            return {
                sessionId: session.sessionId,
                startedAt,
                snapshotCount: 0,
                avgScore: 0, maxScore: 0, minScore: 0,
                overloadCount: 0, themeShifts: 0,
                flowSeconds: Math.round(durations.flow),
                frictionSeconds: Math.round(durations.friction),
                fatigueSeconds: Math.round(durations.fatigue),
                overloadSeconds: Math.round(durations.overload),
            };
        }

        const scores = timeline.map(e => e.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        return {
            sessionId:       session.sessionId,
            startedAt,
            snapshotCount:   timeline.length,
            avgScore:        Math.round(avg * 10) / 10,
            maxScore:        Math.max(...scores),
            minScore:        Math.min(...scores),
            overloadCount,
            themeShifts,
            flowSeconds:     Math.round(durations.flow),
            frictionSeconds: Math.round(durations.friction),
            fatigueSeconds:  Math.round(durations.fatigue),
            overloadSeconds: Math.round(durations.overload),
        };
    }

    getHistory(): SessionSummary[] {
        return [...this._data.history].reverse();
    }

    get completedSessionCount(): number {
        return this._data.history.length;
    }

    // ── Write API ───────────────────────────────────────────────────────────

    record(report: CognitiveReport, emaScore: number | null): void {
        const now = new Date().toISOString();
        const session = this._data.currentSession;

        // Accumulate state duration since last entry
        if (session.lastEntryTime) {
            const elapsed = (Date.now() - new Date(session.lastEntryTime).getTime()) / 1000;
            session.stateDurations[session.lastState] += elapsed;
        }

        session.timeline.push({
            timestamp: now,
            score:     report.score,
            state:     report.state,
            themeShift: report.themeShift,
        });

        if (report.state === 'overload') {
            session.overloadCount += 1;
        }
        if (report.themeShift) {
            session.themeShifts += 1;
        }

        session.lastEmaScore  = emaScore;
        session.lastEntryTime = now;
        session.lastState     = report.state;

        this._save();
    }

    /**
     * Archive the current session and start a fresh one.
     * Returns the summary of the session that was just ended.
     */
    reset(): SessionSummary | null {
        const summary = this.getSummary();

        if (summary.snapshotCount > 0) {
            const archived: SessionSummary = {
                ...summary,
                endedAt: new Date().toISOString(),
                syncedToCloud: false,
            };
            this._data.history.push(archived);
        }

        this._data.currentSession = this._newSession();
        this._save();

        return summary.snapshotCount > 0 ? this._data.history[this._data.history.length - 1] : null;
    }

    /** Mark sessions as synced after cloud upload. */
    markSynced(sessionIds: string[]): void {
        const ids = new Set(sessionIds);
        for (const s of this._data.history) {
            if (ids.has(s.sessionId)) {
                s.syncedToCloud = true;
            }
        }
        this._save();
    }

    getUnsynced(): SessionSummary[] {
        return this._data.history.filter(s => !s.syncedToCloud && s.snapshotCount > 0);
    }

    // ── Persistence ─────────────────────────────────────────────────────────

    private _load(): StoredData {
        try {
            if (fs.existsSync(this._filePath)) {
                const raw = fs.readFileSync(this._filePath, 'utf8');
                return JSON.parse(raw) as StoredData;
            }
        } catch {
            // Corrupt file — start fresh
        }
        return { currentSession: this._newSession(), history: [] };
    }

    private _save(): void {
        try {
            const dir = path.dirname(this._filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this._filePath, JSON.stringify(this._data, null, 2), 'utf8');
        } catch (e) {
            console.error('[ZenNode] Failed to save session data:', e);
        }
    }

    private _newSession() {
        const now = new Date();
        const ms  = now.getTime();
        const pad = (n: number, l = 2) => String(n).padStart(l, '0');
        const sessionId = `zen-${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}-${String(ms).slice(-3)}`;

        return {
            sessionId,
            startedAt:    now.toISOString(),
            timeline:     [] as TimelineEntry[],
            lastEmaScore: null as number | null,
            lastEntryTime: null as string | null,
            lastState:    'flow' as CognitiveState,
            stateDurations: { flow: 0, friction: 0, fatigue: 0, overload: 0 },
            overloadCount: 0,
            themeShifts:   0,
        };
    }
}
