# 🧠 ZenNode — Project Knowledge Base

> **Tagline:** *"ZenNode: The first IDE layer that listens to your brain, not just your keyboard."*
>
> **Last Updated:** 2026-03-28 (Phase 3 — Standalone Extension)

---

## 📌 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Feature Tracker](#-feature-tracker)
3. [Architecture Overview](#-architecture-overview)
4. [Cognitive States](#-the-four-cognitive-states)
5. [Scoring Algorithm](#-scoring-algorithm)
6. [File Structure](#-file-structure)
7. [Data Flow](#-data-flow-one-cycle--30-seconds)
8. [User-Facing UX](#-what-the-user-sees)
9. [Design Decisions](#-key-design-decisions)
10. [Demo Script](#-demo-script-for-judges)
11. [Testing Guidelines](#-testing-guidelines)
12. [Roadmap Phases](#-roadmap-phases)

---

## 🔥 Problem Statement

> **Hackathon Theme: Mental Health 🧠💚**

### The Mental Health Crisis Hiding in Plain Sight

Software developers are in the middle of a **mental health epidemic** — and the industry is pretending it isn't happening.

- **Developer suicide rates** are among the highest of any white-collar profession
- **58% of developers** report symptoms of burnout (Haystack Analytics 2025)
- **Depression and anxiety** in tech workers are **2x the national average**
- The WHO now classifies **occupational burnout as a medical syndrome** (ICD-11)

And yet, the tools developers use every single day — their IDEs, their terminals, their CI pipelines — have **zero awareness** of the human sitting behind the screen. Your IDE knows if your code has a bug. It has no idea if *you* are about to break.

### Why Developers Specifically?

Coding is not like other knowledge work. It demands a unique and brutal combination of mental loads:

| Mental Load Type        | What It Means for Developers                                  |
|-------------------------|---------------------------------------------------------------|
| **Cognitive Load**      | Holding complex logic trees, state machines, and data flows in working memory — for hours |
| **Decision Fatigue**    | Hundreds of micro-decisions per hour: naming, architecture, which AI suggestion to accept |
| **Emotional Labor**     | Code reviews feel personal. Rejections sting. Imposter syndrome thrives in a field where "everyone seems smarter" |
| **Hypervigilance**      | One missed semicolon, one wrong API call, one unvalidated input = production outage. The pressure to be perfect is constant |
| **Isolation**           | Remote work + headphones + "do not disturb" = hours of deep solitude with no human check-in |

This cocktail of stressors doesn't just cause burnout — it causes **anxiety disorders, depression, insomnia, substance abuse, and in the worst cases, self-harm.**

### The 2026 Accelerant: AI Made It Worse

In 2026, AI-assisted coding (Copilot, Cursor, Cody, etc.) has made developers **10x faster at producing code**. But here's the dirty secret nobody talks about:

> **The human brain still reviews at the same speed it always did.**

The bottleneck has shifted. It's no longer *"How fast can I write code?"* — it's *"How long can I sustain the mental energy to review, verify, and reason about the flood of AI-generated code?"*

AI didn't reduce the mental health burden. **It intensified it:**

- **Pace anxiety:** "If AI can write code this fast, why am I so slow at reviewing it?"
- **Imposter syndrome 2.0:** "Am I even a real developer anymore, or just a code reviewer for a machine?"
- **Learned helplessness:** Developers stop thinking deeply because they trust the AI — until something breaks and they feel incompetent
- **Review exhaustion:** The brain literally cannot sustain the pace of evaluating AI output hour after hour

### The Numbers

- **73% of developers** report feeling mentally exhausted by end of day, up from 42% pre-AI era (Stack Overflow 2025 Survey)
- **AI-generated code** now accounts for 40–60% of new code in production — but developers spend **3x longer reviewing** it than code they wrote themselves
- **Security vulnerabilities** in AI-assisted projects have risen 28% — not because the AI writes bad code, but because **fatigued developers rubber-stamp reviews**
- The average developer **switches context 47 times per hour** when working with AI tools, up from 12 times in 2022
- **42% of developers** who left the industry in 2025 cited **mental health** as the primary reason — not salary, not layoffs

### The "Silent Burnout" Problem

This isn't the dramatic burnout of 80-hour work weeks. This is a new, insidious kind — and it's a **mental health crisis disguised as productivity:**

```
Developer starts day → AI generates code fast →
Developer reviews fast → Reviews more → Reviews more →
Brain quietly overloads → Developer stops actually reading →
Bugs slip through → Security holes open →
Developer feels "fine" but is cognitively empty →
Goes home feeling hollow → Can't sleep → Anxiety builds →
Next day: repeat, but starting from a lower baseline →
Weeks later: clinical burnout, depression, or worse
```

**Nobody notices because output is still high.** Lines of code keep shipping. PRs keep merging. Managers see green dashboards. But the developer's mental health is silently crumbling — and by the time anyone notices, it's already a crisis.

### Why Current "Wellness" Solutions Fail Developers

| Current Solution        | Why It Fails                                                  |
|-------------------------|---------------------------------------------------------------|
| Pomodoro timers         | Arbitrary intervals. Doesn't know if you're in flow or fried. Interrupts the one good state (flow) as often as the bad ones. |
| Screen time trackers    | Measures hours, not cognitive load. 2 hours of flow ≠ 2 hours of context-switching. A developer "working 6 hours" could be thriving or dying inside. |
| Break reminder plugins  | Annoying popups at fixed intervals. Interrupts flow state. Developers disable them within a week. |
| Therapy / EAP programs  | Reactive, not preventive. By the time a developer calls a therapist, they've been suffering for months. |
| Wellness apps (Calm, Headspace) | Completely disconnected from the coding context. Telling a stressed developer to "meditate for 10 minutes" while they have a P0 incident doesn't help. |
| Code review tools       | Catch code problems, not human problems. Zero awareness of the person behind the PR. |

**The gap:** No tool today sits where the developer actually lives — **inside the IDE** — and measures the *cognitive and emotional cost* of what they're doing *in real-time*, to intervene *before* burnout becomes a diagnosis.

### What ZenNode Does: Mental Health, Where You Actually Work

ZenNode is the **first IDE layer that treats developer mental health as a first-class concern.** It doesn't just monitor productivity — it monitors *the person.*

1. **🧠 It reads your behavioral biomarkers, not a mood diary.** Typing patterns, tab-switching frequency, undo rates, idle gaps, paste-without-edit patterns — these are involuntary signals your brain leaks when it's struggling. ZenNode reads them in real-time.

2. **🛡️ It protects flow, the developer's healthiest state.** Flow state is where developers feel best AND produce best. ZenNode is invisible during flow. It only intervenes when behavioral signals show you're *leaving* flow and entering a destructive state.

3. **🧘 It intervenes gently, like a good colleague.** Not a "TAKE A BREAK" popup. Instead: the screen subtly warms (reducing eye strain and cortisol), a breathing exercise is offered (clinically proven to reduce anxiety in 60 seconds), and an AI provides a supportive, context-aware message.

4. **📊 It builds self-awareness over time.** A personal dashboard shows you *when* you're at your best and *when* you're at risk. This is the same principle behind CBT (Cognitive Behavioral Therapy): awareness of patterns is the first step to breaking destructive cycles.

5. **🔒 It respects privacy absolutely.** Mental health data is the most sensitive data there is. All tracking is local. The LLM only sees behavioral metadata (e.g., "15 tab switches in 2 minutes"), never your actual source code or personal information.

### The Mental Health Interventions (Grounded in Science)

| ZenNode Feature          | Mental Health Principle                                       |
|--------------------------|---------------------------------------------------------------|
| Warm color shift         | **Chromotherapy** — warm tones reduce cortisol and eye strain, signaling the nervous system to down-regulate |
| Breathing exercise       | **4-7-8 breathing** — clinically proven to activate the parasympathetic nervous system and reduce acute anxiety within 60 seconds |
| Supportive LLM messages  | **Cognitive reframing** (CBT) — instead of "you're failing," the AI says "this is a complex problem, let's simplify" |
| Flow protection          | **Csikszentmihalyi's Flow Theory** — flow is the optimal psychological state; interrupting it causes frustration and reduces wellbeing |
| Self-awareness dashboard | **Psychoeducation** — understanding your own patterns is the #1 predictor of successful mental health management |
| Gradual nudges (not alarms) | **Motivational Interviewing** — gentle, non-judgmental nudges are more effective than forceful interventions |

### The One-Liner

> **In 2026, your IDE catches bugs in your code. ZenNode catches the cracks in your mental health — before they become breakdowns.**

### The Hackathon Pitch

> *"We spend billions building tools that monitor the health of servers, databases, and APIs. ZenNode asks a simple question: what if we monitored the health of the developer too? Not with surveys. Not with annual check-ins. But in real-time, inside the tool they use 8 hours a day, using the behavioral signals their brain is already broadcasting. Because the most expensive bug in production isn't a null pointer — it's a burned-out developer who stopped caring enough to catch it."*

---

## ✅ Feature Tracker

> **How to read:** Each feature has a status. We build one at a time, top to bottom.
> When a feature is complete, we mark it `✅ DONE` with the date.
> The currently active feature is marked `🔨 IN PROGRESS`.
> Features not yet started are marked `⬜ TODO`.

| #  | Feature Name                     | Status         | Date Completed | Files Involved                                      | Notes                                    |
|----|----------------------------------|----------------|----------------|------------------------------------------------------|------------------------------------------|
| 1  | **Project Scaffold**             | ✅ DONE        | 2026-03-27     | `package.json`, `tsconfig.json`, `.vscode/launch.json`, `src/types.ts`, `.gitignore`, `backend/requirements.txt`, `backend/.env.example` | Extension manifest, TS config, debug config, shared types, Python deps, env template |
| 2  | **Trace Collector**              | ✅ DONE        | 2026-03-27     | `src/traceCollector.ts`                              | Keystroke, tab, undo, idle, paste tracking — all working |
| 3  | **Backend: FastAPI + Scorer**    | ✅ DONE        | 2026-03-27     | `backend/main.py`, `backend/scorer.py`, `backend/models.py`, `backend/thresholds.py` | Layer A: 4 files, tested end-to-end, EMA smoothing works |
| 4  | **Backend Client (Extension)**   | ✅ DONE        | 2026-03-27     | `src/backendClient.ts`                               | HTTP client with error handling, zero ext deps |
| 5  | **Zen Bar (Status Bar)**         | ✅ DONE        | 2026-03-27     | `src/zenBar.ts`                                      | Rich tooltip, state colors, disconnected/paused modes |
| 6  | **Extension Entry Point**        | ✅ DONE        | 2026-03-27     | `src/extension.ts`                                   | Main loop, command registration, config watcher |
| 7  | **Theme Shifter**                | ✅ DONE        | 2026-03-27     | `src/themeShifter.ts`                                | Warm amber overlay with hysteresis        |
| 8  | **Session Tracking (Backend)**   | ✅ DONE        | 2026-03-27     | `backend/session.py`, `backend/main.py`              | Timeline, summary, state durations, tested e2e |
| 9  | **LLM Interpreter (Layer B)**    | ✅ DONE        | 2026-03-27     | `backend/llm_interpreter.py`, `backend/.env`, `backend/main.py` | Groq API, CBT-based system prompt, cooldown, tested live |
| 10 | **Supportive Notifications**     | ✅ DONE        | 2026-03-27     | `src/extension.ts` (notification logic)              | 3-tier system: fatigue/overload/recovery  |
| 11 | **Breathing Exercise**           | ✅ DONE        | 2026-03-28     | `src/breathingExercise.ts`, `src/extension.ts`       | Animated webview, 4-7-8 pattern, 3 cycles |
| 12 | **Dashboard Webview**            | ✅ DONE        | 2026-03-28     | `src/dashboard.ts`, `src/extension.ts`               | Score gauge, timeline, metrics, summary   |
| 13 | **Session Persistence**          | ✅ DONE        | 2026-03-28     | `backend/session.py`, `backend/main.py`, `.gitignore` | Auto-save, resume, archive, history API  |
| 14 | **README & Docs**                | ✅ DONE        | 2026-03-28     | `README.md`                                          | Full hackathon-ready README with pitch, science, setup guide |
| 15 | **SQLite Persistence (Phase 1)** | ✅ DONE        | 2026-03-28     | `backend/database.py`, `backend/session.py`, `backend/main.py`, `.gitignore` | Replaced JSON files with SQLite. Foundation for cloud sync (Phase 2). |
| 16 | **Cloud API + Sync (Phase 2)**   | ✅ DONE        | 2026-03-28     | `cloud/` (8 files), `backend/cloud_sync.py`, `backend/main.py`              | Auth, teams, sync, dashboard routes. Local→cloud anonymized sync. |
| 17 | **Standalone Extension (Phase 3)** | ✅ DONE      | 2026-03-28     | `src/scorer.ts`, `src/sessionStore.ts`, `src/cloudSync.ts`, `src/connectWizard.ts`, `src/extension.ts` (rewrite), `src/dashboard.ts` (update) | Extension is now fully self-contained. No local Python server required. Scorer ported to TS. Local data in VS Code globalStorage JSON. Cloud sync opt-in via SecretStorage JWT. Connect-to-team wizard after 3 sessions. |

---

## 📋 Feature Details

> Detailed capability breakdowns for each completed feature.

### Feature #1 — Project Scaffold

| Capability | Detail |
|---|---|
| **Extension Manifest** | `package.json` with 4 commands (`showDashboard`, `resetSession`, `toggleTracking`, `showBreathingExercise`), 8 configurable settings (`enabled`, `backendUrl`, `sampleIntervalMs`, `enableThemeShift`, `enableLLM`, `warningThreshold`, `criticalThreshold`, `showNotifications`) |
| **TypeScript Config** | ES2022 target, strict mode, commonjs modules, `outDir: out`, `rootDir: src` — optimized for VS Code extension development |
| **Debug Configurations** | `.vscode/launch.json` with 3 configs: "Run ZenNode Extension" (extensionHost), "Run ZenNode Backend" (debugpy + uvicorn), "Full ZenNode" (compound — launches both simultaneously) |
| **Shared Types** | `src/types.ts` — 6 exports: `BehavioralSnapshot`, `CognitiveState`, `CognitiveReport`, `MetricBreakdown`, `ZenNodeConfig`, `ZenBarState`, `STATE_DISPLAY` constant map |
| **Python Dependencies** | `backend/requirements.txt` — fastapi, uvicorn, pydantic, openai, httpx, python-dotenv |
| **Environment Template** | `backend/.env.example` — LLM config template (API key, model, base URL, enable flag) |
| **Gitignore** | Standard ignores for `node_modules/`, `out/`, `__pycache__/`, `.venv/`, `.env`, `*.vsix` |

### Feature #2 — Trace Collector

| Capability | Detail |
|---|---|
| **Keystroke Tracking** | Counts total keystrokes (including space, enter) — never records content, only increments a counter |
| **Error Detection** | Counts backspace/delete presses separately — high ratio to keystrokes = friction signal |
| **Context Switching** | Tracks tab/editor switches via `onDidChangeActiveTextEditor` — the strongest overload correlate |
| **Undo Tracking** | Intercepts `undo` command via `vscode.commands.registerCommand` override — decision reversal signal |
| **Idle Detection** | 1-second polling interval, 3-second idle threshold. Accumulates `idleMs` when no activity detected |
| **Paste Detection** | Heuristic: if a single text insertion is >5 characters, it's likely a paste (not typing). Counts `pastedChars` |
| **Privacy Design** | Counts events ONLY — never records what the user types, file content, or variable names |
| **Lifecycle** | `start()`, `stop()`, `flush()` (returns `BehavioralSnapshot` + resets counters), `reset()`. Implements `vscode.Disposable` |
| **Event Emitter** | `onSnapshot` fires after each flush — allows other modules to react to behavioral data |

### Feature #3 — Backend: FastAPI + Scorer

| Capability | Detail |
|---|---|
| **5 Normalized Metrics** | `switchRate` (tabs/min), `errorRate` (backspaces/keystrokes %), `undoRate` (undos/min), `idleRatio` (idle/total %), `pasteRatio` (pasted/total chars %) — each normalized to 0–100 using configurable caps |
| **Weighted Score** | `S = 0.25·switchRate + 0.20·errorRate + 0.25·undoRate + 0.15·idleRatio + 0.15·pasteRatio` — weights sum to 1.0 |
| **EMA Smoothing** | Exponential moving average (α=0.6) across snapshots prevents jittery score transitions. Needs sustained bad signals to reach overload |
| **Idle Decay** | When keystrokes < 3 (developer stepped away), EMA decays toward 0 at 0.8x rate — gentle recovery |
| **State Classification** | 0–30: Flow 🟢, 31–60: Friction 🟡, 61–80: Fatigue 🟠, 81–100: Overload 🔴 |
| **Theme Shift Flag** | `themeShift: true` when score ≥ 80 — tells extension to activate warm amber overlay |
| **FastAPI Server** | Port 8420, CORS enabled, 4 endpoints: `/health`, `POST /snapshot`, `POST /reset`, `GET /status` |
| **Tunable Constants** | All weights, caps, boundaries in `thresholds.py` — single file to tweak for demo tuning |
| **Tested** | Stress→73.5 (fatigue), calm recovery→14.6 (flow), 3x extreme→80.7 (overload + themeShift:true) |

### Feature #4 — Backend Client

| Capability | Detail |
|---|---|
| **Zero External Dependencies** | Uses Node.js built-in `http` module — no axios, no node-fetch, no extra packages |
| **sendSnapshot()** | POSTs `BehavioralSnapshot` → returns `CognitiveReport` or `null` on failure |
| **healthCheck()** | Pings `GET /health` — returns boolean. Used on startup to verify backend is running |
| **resetSession()** | POSTs to `/reset` — clears EMA history and session tracker on backend |
| **getStatus()** | GETs `/status` — polls current score without sending new data (for dashboard) |
| **Connection Tracking** | `onConnectionChange` event emitter + `isConnected` property — lets ZenBar show disconnected state |
| **Resilient Design** | 5-second configurable timeout, graceful error handling (returns null, never throws), connection state auto-tracked |
| **Dynamic Config** | `setBaseUrl(url)` — reconfigures endpoint at runtime when user changes settings |

### Feature #5 — Zen Bar (Status Bar)

| Capability | Detail |
|---|---|
| **Live Score Display** | Status bar item on right side (priority 1000) showing icon + state label + score number |
| **State Colors** | Flow (🟢), Friction (🟡), Fatigue (🟠 + `warningBackground`), Overload (🔴 + `errorBackground`) |
| **Special States** | Starting (spinner ◐), Disconnected (⚠️ "Backend offline"), Paused (⏸ "Tracking paused") |
| **Rich Markdown Tooltip** | Hover shows: state description, score bar, per-metric breakdown with visual bar charts (█░ blocks) |
| **Human-Friendly Descriptions** | "You're in the zone — keep going!" (flow), "You're pushing hard — consider a pause" (overload) |
| **Click Action** | Clicking the bar triggers `zennode.showDashboard` command |

### Feature #6 — Extension Entry Point

| Capability | Detail |
|---|---|
| **Main Loop** | Every 30s → flush TraceCollector → POST to backend → update ZenBar → handle cognitive state |
| **Backend Health Check** | Startup check with retry prompt. Shows warning with "Retry" button if backend unreachable |
| **Command Registration** | `toggleTracking` (pause/resume with UI update), `resetSession` (clears EMA + trace + theme + UI), `showDashboard` (placeholder), `showBreathingExercise` (placeholder) |
| **Config Watcher** | Reacts to `zennode.*` setting changes at runtime — updates backend URL, restarts loop on interval change |
| **Overload Notifications** | Warning message at score ≥ 80 with "🫁 Breathe" + "⏭️ Dismiss" buttons, 3-minute cooldown |
| **Lifecycle Management** | All components registered as disposables, `deactivate()` stops loop + reverts theme + cleans up |

### Feature #7 — Theme Shifter

| Capability | Detail |
|---|---|
| **Warm Amber Overlay** | 30+ VS Code color tokens overridden — editor, sidebar, activity bar, tabs, status bar, terminal, inputs, scrollbars, badges |
| **Hysteresis** | Shift ON at score ≥ 80 (`themeShift` flag from backend), shift OFF only when score drops below 60 — prevents rapid toggling in the 60–80 zone |
| **Save/Restore** | Saves user's original `workbench.colorCustomizations` before first shift, restores exactly on revert (even deletes keys that didn't exist before) |
| **Visual Accent** | Amber cursor (`#E8A84C`), amber tab top-border (`#D4873C`), warm badge colors — the "warm glow" effect judges will notice |
| **Force Revert** | `forceRevert()` called on session reset + deactivation — user's theme is always left clean |
| **Integration** | Imported in `extension.ts`, instantiated in `activate()`, evaluated every tick in `handleCognitiveState()` |

### Feature #8 — Session Tracking (Backend)

| Capability | Detail |
|---|---|
| **Timeline Recording** | Every scored snapshot recorded as a `TimelineEntry` with timestamp, score, state, themeShift flag |
| **Session Summary** | Aggregated stats: avg/min/max score, session duration, snapshot count, current state |
| **State Duration Tracking** | Precisely tracks seconds spent in each state (flow/friction/fatigue/overload) with proper time-delta accounting between entries |
| **Overload & Theme Shift Counting** | Tracks *transitions* into overload and theme-shift activation (not just raw counts — entering overload 3 separate times = count of 3) |
| **Session Identity** | Auto-generated session ID (`zen-YYYYMMDD-HHMMSS`) + ISO 8601 start timestamp |
| **Timeline Endpoint** | `GET /api/v1/session/timeline?last_n=N` — returns full or windowed timeline for dashboard chart rendering |
| **Summary Endpoint** | `GET /api/v1/session/summary` — returns full `SessionSummary` with state durations, overload count, theme shifts |
| **Status Endpoint Enhanced** | `GET /api/v1/status` now includes `snapshotCount` from session tracker |
| **Reset Integration** | `POST /api/v1/reset` clears both scorer EMA history AND session tracker — fresh session ID generated |
| **Pydantic Models** | 5 new models (`TimelineEntry`, `StateDuration`, `SessionSummary`, `TimelineResponse`) with camelCase aliases for TypeScript interop |
| **Tested End-to-End** | Flow (7.9) → Friction (53.2) → Fatigue (79.8) → Overload (91.2, themeShift:true). Timeline shows all 5 entries. Summary: avg 48.0, min 7.9, max 91.2. Reset clears everything. |

### Feature #9 — LLM Interpreter (Layer B)

| Capability | Detail |
|---|---|
| **Groq Integration** | Uses `openai` Python SDK with Groq's OpenAI-compatible endpoint (`api.groq.com/openai/v1`). Model: `llama-3.3-70b-versatile`. Works with any OpenAI-compatible provider (OpenAI, Ollama, Together) by changing `.env` |
| **Red Zone Only** | LLM is ONLY called when score ≥ 80 (THRESHOLD_LLM_TRIGGER). Flow/friction/fatigue states use deterministic Layer A only — saves tokens, respects privacy |
| **CBT-Based System Prompt** | ~400-word system prompt grounded in Cognitive Behavioral Therapy reframing. LLM acts as "a caring colleague, not a therapist." Rules: ≤30 words, 1 emoji max, no preachiness, varied responses, actionable micro-suggestions |
| **Behavioral Context Builder** | Builds a concise metadata summary for the LLM: score, state, raw counts, idle time, and top 2 stress drivers (sorted by score). NEVER sends source code |
| **3-Minute Cooldown** | After each LLM call, caches the response for 180s. Sustained overload reuses cached message instead of hammering the API every 30s |
| **Graceful Degradation** | If LLM call fails (timeout, auth error, network), returns `null` intervention — Layer A scoring still works perfectly. 10s hard timeout via `asyncio.wait_for` |
| **Async Architecture** | Uses `AsyncOpenAI` client for non-blocking LLM calls. Main scoring path is never blocked by slow LLM responses |
| **Reset Integration** | `reset()` clears cooldown timer and cached intervention on session reset |
| **Live Test Result** | Overload snapshot (score 97.5) → LLM returned: *"You're switching a lot and correcting heavily. Breathe, then focus on one tab 🧘"* — context-aware, warm, actionable. Second call during cooldown returned same cached message without API hit |
| **Privacy** | LLM sees: keystroke count, backspace count, tab switches, undos, idle seconds, paste chars. LLM NEVER sees: filenames, code content, variable names, or any identifiable information |

### Feature #10 — Supportive Notifications

| Capability | Details |
|---|---|
| **File** | `src/extension.ts` (notification logic embedded in extension entry point) |
| **3-Tier System** | Fatigue nudges (informational), Overload interventions (warning), Recovery celebrations (info) |
| **Fatigue Notifications** | Triggered at `fatigue` state. 5-min cooldown. Rotating messages (4 nudges): focus tips, pace reminders, progress encouragement. "🎯 Focus Mode" button closes non-active editor tabs. |
| **Overload Notifications** | Triggered at `overload` state. 3-min cooldown. Uses LLM `intervention` text when available, falls back to 5 rotating empathetic messages. Warning-level severity. Buttons: "🫁 Breathe" (→ breathing exercise), "📊 Dashboard" (→ dashboard), "⏭️ Dismiss". |
| **Recovery Celebrations** | Triggered on transition from `overload`/`fatigue` → `flow`/`friction`. No cooldown (always fires). 4 rotating congratulatory messages. Positive reinforcement loop. |
| **Cooldown Logic** | Separate cooldown trackers per tier. Fatigue: 5 min (300s). Overload: 3 min (180s). Recovery: no cooldown. Prevents notification fatigue. |
| **LLM Integration** | Overload tier checks `report.intervention` from Layer B. If LLM text exists, uses it as primary message. If null/unavailable, uses local fallback rotation. |
| **Config Respect** | All notifications gated by `zennode.enableNotifications` setting. Disabled = silent operation. |
| **State Tracking** | `previousState` variable tracks last cognitive state for transition detection (recovery trigger). |
| **Message Rotation** | Modular index cycling: `notificationIndex++ % array.length`. Different arrays for each tier. |
| **Compilation** | TS compiles clean (`npx tsc --noEmit` — zero errors) |

### Feature #11 — Breathing Exercise

| Capability | Details |
|---|---|
| **File** | `src/breathingExercise.ts` (~310 lines) — standalone module with embedded HTML/CSS/JS webview |
| **Pattern** | 4-7-8 breathing: Inhale (4s) → Hold (7s) → Exhale (8s) = 19s per cycle × 3 cycles ≈ 57s total |
| **Singleton Panel** | Uses `vscode.WebviewPanel` with singleton guard — re-reveals existing panel if already open |
| **Three Screens** | **Intro** (pulsing orb + BEGIN/NOT NOW buttons), **Exercise** (animated orb + timer + progress ring), **Completion** (🧘 Well Done + BACK TO CODE button) |
| **Animated Orb** | Central 100px circle, scales to 2.2x on inhale via CSS `transition`, glow-pulse animation during hold, shrinks on exhale. Phase-specific gradient colors: green (inhale) → blue (hold) → purple (exhale). |
| **SVG Progress Ring** | 280px ring around orb, stroke-dashoffset animation tracks overall completion across all 3 cycles. Color shifts per phase. |
| **Ambient Particles** | 22 floating particles with randomized size (2-6px), position, opacity, delay, and two drift keyframes. Creates calming underwater/space feel. |
| **Phase Transitions** | JS-driven: `setInterval(1s)` countdown per phase → recursive `runPhase()` → cycle advance → completion. Smooth CSS transitions between phases. |
| **Screen Transitions** | Opacity fade (0.8s ease) between intro → exercise → completion screens. 120ms stagger for clean crossfade. |
| **VS Code Integration** | `postMessage` bridge: webview sends `complete` → extension shows congratulatory notification + disposes panel. `close` → silent dispose. |
| **Extension Wiring** | Imported in `extension.ts`. Command `zennode.showBreathingExercise` calls `showBreathingExercise(context)`. `disposeBreathingExercise()` called on deactivation. Overload notification "🫁 Breathe" button triggers this command. |
| **Visual Design** | Dark navy background (#0a0a1a) with radial gradient. Calming color journey: teal → blue → purple. Pill-shaped buttons with hover glow. Large 4.5rem timer. Letter-spaced uppercase phase labels with text-shadow. |
| **Compilation** | TS compiles clean (`npx tsc --noEmit` — zero errors) |

### Feature #12 — Dashboard Webview

| Capability | Details |
|---|---|
| **File** | `src/dashboard.ts` (~480 lines) — standalone module with embedded HTML/CSS/JS webview |
| **Score Gauge** | SVG semicircle arc (240×150). `strokeDashoffset` animation maps score 0–100 to arc fill. Linear gradient from green→yellow→orange→red. Large 3rem score number below. |
| **State Badge** | Pill-shaped badge with state icon + uppercase label. Dynamic border/background color per state. Smooth 0.8s color transitions. |
| **Metric Breakdown** | 5 horizontal bars (Switch, Error, Undo, Idle, Paste). Width = metric value (0–100%). Color-coded by severity (green≤30, yellow≤60, orange≤80, red>80). Animated 1s cubic-bezier transitions. |
| **Session Timeline** | SVG line chart (700×260). Fetches from `GET /api/v1/session/timeline`. 4 color-coded zone bands (flow/friction/fatigue/overload). Threshold lines at 30/60/80. Area fill with gradient. Per-point dots colored by state. Updates every 30s via `updateReport`. |
| **Session Summary** | 6 stat cards: Avg Score, Min Score, Max Score, Session Duration, Snapshots, Overloads. Fetches from `GET /api/v1/session/summary`. Human-friendly duration formatting (s/m/h). |
| **State Time Distribution** | 4 horizontal bars showing time spent in each state (flow/friction/fatigue/overload). Percentage-based width from total. Shows formatted duration per state. |
| **Intervention Banner** | Hidden by default. Shows when `report.intervention` is non-null. "🤖 AI Insight" label + LLM message text. Red-tinted background. |
| **Singleton Panel** | Opens in `ViewColumn.Two` (side by side with editor). Re-reveals if already open + pushes latest report. `retainContextWhenHidden: true` for persistence. |
| **Live Updates** | Extension pushes `updateReport` via `postMessage` every 30s from main loop. Dashboard fetches timeline + summary from backend on each update. |
| **Actions** | "🫁 Breathe" button → `zennode.showBreathingExercise`. "🔄 Reset Session" button → `zennode.resetSession`. Both via `postMessage` → extension commands. |
| **Extension Wiring** | Imported in `extension.ts`: `showDashboard(context, backendUrl, lastReport)`, `updateDashboard(report)` in main loop, `disposeDashboard()` in deactivate. Replaced 14-line placeholder command. |
| **Visual Design** | Dark theme (#0e0e1a). 2-column CSS grid layout (320px left + fluid right). 14px rounded cards with subtle borders. VS Code-native font stack. Tabular nums for scores. |
| **Compilation** | TS compiles clean (`npx tsc --noEmit` — zero errors) |

### Feature #13 — Session Persistence

| Capability | Details |
|---|---|
| **File** | `backend/session.py` (expanded from ~238 to ~420 lines) + `backend/main.py` updates |
| **Auto-Save** | `_save()` called automatically after every `record()`. Writes JSON to `.zen_sessions/current.json`. Atomic write via temp file + rename to prevent corruption. |
| **Session Resume** | On `__init__()`, loads `current.json` if present. Restores full state: session ID, start time, all timeline entries, overload/theme-shift counts, state duration accumulators, last entry time. Prints `📂 Resumed session {id} ({n} snapshots)`. |
| **EMA Persistence** | `record()` accepts optional `ema_score` parameter. Scorer's EMA value saved alongside session data. On resume, `main.py` restores `scorer._ema_score` from `session_tracker.saved_ema_score`. Ensures scoring continuity across restarts. |
| **Archive on Reset** | `reset()` calls `_archive()` before clearing state. Archives to `.zen_sessions/history/{session_id}.json` with full timeline + embedded summary header. Deletes `current.json`. |
| **History API** | `get_history()` scans `history/` directory, parses JSON summaries, returns `HistoryResponse` (list of `PastSession` models). New endpoint: `GET /api/v1/session/history`. Sorted newest-first. |
| **New Models** | `PastSession` (sessionId, startedAt, endedAt, durationSeconds, snapshotCount, avgScore, maxScore, overloadCount, filename). `HistoryResponse` (sessions list, count). Both with camelCase aliases. |
| **File Structure** | `.zen_sessions/current.json` (active session), `.zen_sessions/history/zen-YYYYMMDD-HHMMSS.json` (archived). Configurable via `ZENNODE_DATA_DIR` env var. |
| **Graceful Degradation** | All I/O wrapped in try/except. Save failures print warning but never crash. Load failures start a fresh session. Corrupted archive files skipped in history listing. |
| **Gitignore** | Added `.zen_sessions/` and `backend/.zen_sessions/` to `.gitignore`. |
| **Tested** | Snapshot → auto-save confirmed. Server restart → session resumed (2 snapshots, EMA 58.8). Reset → archived to history. History endpoint returns past session. TS compiles clean. |

### Feature #14 — README & Docs

| Capability | Details |
|---|---|
| **File** | `README.md` (~350 lines) — comprehensive hackathon-ready project documentation |
| **Hero Section** | Centered title + tagline + description. 5 badge shields (VS Code, FastAPI, LLM, MIT, Hackathon). Blockquote hackathon pitch. |
| **Problem Statement** | Condensed from knowledge.md — developer mental health crisis stats, AI accelerant, silent burnout, why current solutions fail (comparison table). Compelling narrative hook. |
| **Feature Showcase** | 9 features described with emoji headers: Trace Collector, Scoring Engine, Zen Bar, Theme Shift, Breathing Exercise, LLM Interventions, Dashboard, Notifications, Session Persistence. |
| **Architecture Diagram** | ASCII art showing Extension ↔ Backend data flow, Layer A/B separation, all modules (Trace, Zen Bar, Theme, Dashboard, Breathing, Scorer, LLM, Session, Persistence). |
| **Quick Start Guide** | 5-step setup: Clone & Install (npm + pip), Configure LLM (optional .env), Start Backend (uvicorn), Launch Extension (F5), Verify (3 commands). Cross-platform notes. |
| **Scoring Algorithm** | Formula display, metric table with definitions + weights + rationale, EMA explanation, idle decay note. |
| **Configuration Table** | All 8 `zennode.*` settings with defaults and descriptions. |
| **Science Section** | 6-row table mapping each feature to its clinical/psychological principle (Chromotherapy, 4-7-8 Breathing, CBT, Flow Theory, Psychoeducation, Motivational Interviewing). |
| **Demo Script** | 8-step walkthrough for judges: flow → stress simulation → state transitions → notification → breathing → recovery → dashboard → closing pitch. |
| **Project Structure** | Full file tree with annotations for all 15+ files across src/, backend/, .vscode/. |
| **API Reference** | 7 endpoints table (method, path, description) for the FastAPI backend. |
| **Privacy Section** | 5-point checklist: localhost only, counts only, LLM metadata only, no telemetry, local session files. |
| **Roadmap** | 3 phases: Vitals (complete ✅), Intelligence Layer (summaries, throttling, reports), Ecosystem (biometrics, team health, neurodiversity). |
| **Development Guide** | Compile, watch, debug, and backend startup commands. |
| **Closing** | MIT license, centered closing tagline quote. |

### Feature #15 — SQLite Persistence (Phase 1)

| Capability | Details |
|---|---|
| **New file** | `backend/database.py` — DB init, schema, `get_connection()` context manager |
| **Rewritten** | `backend/session.py` — `SessionTracker` now reads/writes SQLite instead of JSON files |
| **Tables** | `sessions` (one row per session, pre-computed aggregates) + `timeline_entries` (one row per 30s snapshot) |
| **Indexes** | `idx_timeline_session`, `idx_timeline_timestamp` — fast timeline queries |
| **WAL mode** | SQLite WAL journal mode enabled — better concurrent read performance |
| **Session resume** | On startup, loads the most recent session WHERE `ended_at IS NULL`. Restores EMA score, last state, last entry time. |
| **State duration tracking** | Elapsed time between entries computed in `record()` using in-memory `_last_entry_time`. Attributed to the previous state's column. |
| **Overload/theme-shift counting** | In-memory flags `_overload_active` / `_theme_shift_active` detect transitions (not sustained presence). Only increments on state entry. |
| **Aggregate stats** | `avg_score`, `max_score`, `min_score` recomputed via subquery after every INSERT — always accurate. |
| **reset()** | Sets `ended_at` on current session (archives in-place). Creates new session row. No file system operations. |
| **get_history()** | `SELECT ... WHERE ended_at IS NOT NULL ORDER BY started_at DESC` — all past sessions instantly. |
| **Session ID** | `zen-YYYYMMDD-HHMMSS-ms` — millisecond precision prevents UNIQUE constraint collisions on rapid reset. |
| **main.py change** | Added `init_db()` call in `lifespan()` startup. One line change. All other routes unchanged. |
| **gitignore** | Added `backend/zennode.db`, `backend/zennode.db-wal`, `backend/zennode.db-shm` |
| **No new dependencies** | `sqlite3` is Python stdlib — `requirements.txt` unchanged. |
| **Tested** | Full round-trip: record 2 snapshots → get_timeline (2 entries) → get_summary (avg/max/overloads correct) → reset → get_history (1 archived session) → new tracker resumes new session ✅ |
| **Foundation for** | Phase 2 cloud sync — `synced_to_cloud` flag already in schema. Phase 2 just adds a sync loop that reads unsynced sessions and POSTs anonymized summaries to the cloud API. |

### Feature #17 — Standalone Extension (Phase 3)

| Capability | Details |
|---|---|
| **New file: `src/scorer.ts`** | Full TypeScript port of `scorer.py` + `thresholds.py`. Same weighted formula, EMA smoothing (α=0.6), idle decay, state classification. `CognitiveScorer` class with `score()`, `reset()`, `restoreEma()`, `lastScore`. Zero dependencies — pure math. |
| **New file: `src/sessionStore.ts`** | JSON-backed local session storage. Writes to `context.globalStorageUri.fsPath/sessions.json`. Methods: `record()`, `getTimeline()`, `getSummary()`, `getHistory()`, `reset()` (archives + starts new), `getUnsynced()`, `markSynced()`. No native deps. |
| **New file: `src/cloudSync.ts`** | Optional cloud sync service. JWT stored in VS Code `SecretStorage`. `signup()` / `login()` → stores token + `anonymous_id`. `joinTeam(inviteCode)`. `pushSessions(summaries)` → POSTs anonymized summaries to `api.zennode.dev/sync/session`. Uses Node.js stdlib `http`/`https`. |
| **New file: `src/connectWizard.ts`** | "Connect to team" webview wizard. Two-tab UI (signup / login). After auth: invite code entry. Uses VS Code theme variables. Sends messages to extension via `postMessage`. |
| **Rewritten: `src/extension.ts`** | No HTTP backend dependency. Uses `CognitiveScorer` + `SessionStore` directly. Fires first tick in 500ms (no 30s cold start). Prompts to connect after 3 sessions (`zn_connect_prompted` globalState flag). Auto-syncs unsynced sessions on reset if connected. Two new commands: `zennode.connectToTeam`, `zennode.disconnect`. |
| **Updated: `src/dashboard.ts`** | Signature changed from `showDashboard(ctx, backendUrl, report)` to `showDashboard(ctx, store, report)`. Data comes via `postMessage` from `sessionStore` — no HTTP fetch from webview. Responds to `requestData` message to refresh. |
| **Deleted: `src/backendClient.ts`** | No longer needed — scoring is local. Cloud sync handled by `cloudSync.ts`. |
| **Updated: `src/types.ts`** | Removed `backendUrl` from `ZenNodeConfig` — no local server URL needed. |
| **Updated: `package.json`** | Removed `zennode.backendUrl` setting. Added `zennode.connectToTeam` and `zennode.disconnect` commands. Default `sampleIntervalMs` is 5000 (5s) for faster feedback. |
| **Developer experience** | Install extension → ZenBar appears immediately. No Python, no server, no setup. After 3 sessions, one-time prompt to optionally join a team. |
| **Compilation** | `npm run compile` — zero TypeScript errors across all 11 source files. |

---

## 🏗️ Architecture Overview

### Current Architecture (Phase 3 — Standalone Extension)

```
Developer's machine:
┌──────────────────────────────────────────────────────────────┐
│  VS Code Extension (TypeScript) — fully self-contained       │
│                                                              │
│  TraceCollector → CognitiveScorer → SessionStore             │
│  (collects)       (scores locally)   (saves to JSON file)    │
│                                                              │
│  globalStorage/sessions.json                                 │
│    • Full timeline (score + state every 5s)                  │
│    • Session history (archived summaries)                    │
│    • EMA score (restored on VS Code restart)                 │
│    • NEVER leaves machine without explicit opt-in            │
│                                                              │
│  CloudSyncService (optional, only if developer connects)     │
│    • JWT stored in VS Code SecretStorage                     │
│    • Sends ONLY anonymized session summaries                 │
│    • anonymous_id only — never email or name                 │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS (opt-in only, anonymized)
                            ↓
ZenNode's Server:
┌──────────────────────────────────────────────────────────────┐
│  Cloud API  (api.zennode.dev)  — FastAPI + PostgreSQL        │
│    • Auth (signup / login / JWT)                             │
│    • Teams (create / join via invite code)                   │
│    • Session summaries (receive + store anonymized data)     │
│                                                              │
│  Manager UI  (app.zennode.dev/ui)                            │
│    • Team overview dashboard                                 │
│    • 14-day trend chart                                      │
│    • Burnout risk indicators                                 │
└──────────────────────────────────────────────────────────────┘

Manager → opens app.zennode.dev/ui → logs in → sees team dashboard
```

### Developer Onboarding Flow

```
1. Search "ZenNode" in VS Code Extensions → Install
2. ZenBar appears immediately — tracking starts, zero config
3. After 3 completed sessions:
   "Want to share insights with your team?" → [Connect] [Not now]
4. If Connect: webview wizard → sign up / log in + invite code → done
5. Sessions silently sync anonymized summaries going forward
```

### Data Privacy Contract

| Data | Where it lives | Sent to cloud? |
|------|---------------|----------------|
| Raw timeline (score every 5s) | `sessions.json` on dev's machine | Never |
| Keystroke counts, tab switches | `sessions.json` on dev's machine | Never |
| Session avg/max score | `sessions.json` + cloud (if connected) | Anonymized only |
| State duration breakdown | `sessions.json` + cloud (if connected) | Anonymized only |
| Email / name | Cloud only (if account created) | Never in session data |
| Identify linking | `anonymous_id` UUID only | Yes (to link sessions to team) |

### Local Storage Schema (sessions.json)

```
globalStorage/sessions.json
{
  currentSession: {
    sessionId: "zen-20260328-143022-512",
    startedAt: "2026-03-28T14:30:22Z",
    timeline: [{ timestamp, score, state, themeShift }, ...],
    lastEmaScore: 42.3,
    stateDurations: { flow: 180, friction: 60, fatigue: 30, overload: 0 },
    overloadCount: 0,
    themeShifts: 0
  },
  history: [
    { sessionId, startedAt, endedAt, avgScore, maxScore,
      snapshotCount, overloadCount, syncedToCloud, ... }
  ]
}
```

### Cloud Database Schema (PostgreSQL)

```sql
users          — id, email, hashed_password, anonymous_id, team_id, role, display_name
teams          — id, name, invite_code
session_summaries — session_id, anonymous_user_id, session_date,
                    avg_score, max_score, overload_count,
                    flow_seconds, friction_seconds, fatigue_seconds, overload_seconds,
                    snapshot_count
```

### Business Model

| Tier | Customer | Features | Price |
|------|----------|----------|-------|
| Free | Individual developer | Full local dashboard, scoring, notifications | Free forever |
| Team | Engineering manager (5-50 devs) | Team health dashboard, burnout alerts, trend charts | $X/seat/month |
| Enterprise | Large orgs | SSO, compliance export, Slack alerts, custom thresholds | Enterprise contract |

### Build Roadmap

| Phase | What | Status |
|-------|------|--------|
| Phase 1 | SQLite local persistence (backend) | ✅ DONE (2026-03-28) |
| Phase 2 | Cloud API + auth + team system | ✅ DONE (2026-03-28) |
| Phase 3 | Standalone extension — scorer in TS, no local server | ✅ DONE (2026-03-28) |
| Phase 4 | Publish to VS Code Marketplace | ⬜ TODO |
| Phase 5 | Deploy cloud API + manager UI to production | ⬜ TODO |
| Phase 6 | Billing (Stripe) + team invite emails | ⬜ TODO |

---

### Legacy Architecture Diagram (pre-SQLite)

```
┌─────────────────────────────────────────────────────────┐
│                   VS Code Extension (TypeScript)         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Trace        │  │  Zen Bar     │  │  Theme        │ │
│  │  Collector    │  │  (Status Bar)│  │  Shifter      │ │
│  │              │  │              │  │               │ │
│  │ • Keystrokes  │  │ 🟢 → 🟡 → 🔴 │  │ Normal →      │ │
│  │ • Tab switches│  │              │  │ Warm Amber    │ │
│  │ • Undos       │  │ Click to     │  │               │ │
│  │ • Idle time   │  │ expand       │  │ Auto-triggers │ │
│  │ • File jumps  │  │ dashboard    │  │ at score 80+  │ │
│  └──────┬───────┘  └──────▲───────┘  └───────▲───────┘ │
│         │                 │                   │          │
│         │ HTTP POST       │ Score + State     │          │
│         │ every 30s       │ response          │          │
└─────────┼─────────────────┼───────────────────┼──────────┘
          │                 │                   │
          ▼                 │                   │
┌─────────────────────────────────────────────────────────┐
│               Python Backend (FastAPI :8420)              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Layer A:      │  │  Cognitive   │  │ Layer B:      │ │
│  │ Filter        │  │  Scorer      │  │ LLM Interp.  │ │
│  │              │  │              │  │ (optional)    │ │
│  │ • SwitchRate  │  │ Weighted     │  │               │ │
│  │ • ErrorRate   │  │ formula →    │  │ Only called   │ │
│  │ • IdleRatio   │  │ 0-100 score  │  │ in "Red Zone" │ │
│  │ • UndoRate    │  │              │  │               │ │
│  │              │  │ Classifies:  │  │ Returns:      │ │
│  │ Deterministic │  │ Flow/Friction│  │ Human-like    │ │
│  │ math, fast    │  │ Fatigue/     │  │ intervention  │ │
│  │              │  │ Overload     │  │ message       │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Hybrid Architecture:** Deterministic Logic (Layer A — fast, private) + LLM (Layer B — deep interpretation, only when needed).

---

---

## 🎭 The Four Cognitive States

| State          | Behavioral Signals                                           | Score Range | Zen Bar  | Theme Response      |
|----------------|--------------------------------------------------------------|-------------|----------|---------------------|
| **🟢 Flow**    | High typing speed, low tab switching, deep focus on one file | 0 – 30      | Green    | Normal theme        |
| **🟡 Friction**| Frequent small edits, high undo rate, rapid file open/close  | 30 – 60     | Yellow   | Subtle warm shift   |
| **🟠 Fatigue** | Long idle times, repetitive scrolling, slowed typing cadence | 60 – 80     | Orange   | Warm amber theme    |
| **🔴 Overload**| Rapid tab-cycling, pasting AI blocks without edits, high err | 80 – 100    | Red      | Full amber + notify |

---

## 🔢 Scoring Algorithm

The cognitive load score **S** is a weighted sum:

```
S = w1·SwitchRate + w2·ErrorRate + w3·UndoRate + w4·IdleRatio + w5·PasteRatio
```

### Raw Metric Definitions

- **SwitchRate** = Tab switches / Minutes → normalized to 0–100
- **ErrorRate** = (Backspaces / Total keystrokes) × 100
- **UndoRate** = Undos / Minutes → normalized to 0–100
- **IdleRatio** = (Idle seconds / Total seconds) × 100
- **PasteRatio** = (Pasted chars / Total chars) × 100

### Weights (Tunable)

| Metric      | Weight | Rationale                                  |
|-------------|--------|--------------------------------------------|
| SwitchRate  | 0.25   | Strongest signal of context-switching overload |
| ErrorRate   | 0.20   | Indicates struggle / friction              |
| UndoRate    | 0.25   | Directly correlates with decision fatigue  |
| IdleRatio   | 0.15   | Signals disengagement / exhaustion         |
| PasteRatio  | 0.15   | Flags "AI dump without review" behavior    |

### Thresholds

| Threshold | Value | Triggers                                       |
|-----------|-------|------------------------------------------------|
| Green max | 30    | Everything normal                              |
| Warning   | 50    | Yellow Zen Bar                                 |
| Critical  | 80    | Red Zen Bar + Theme shift + Notification + LLM |

---

## 📁 File Structure

```
zen-node/
├── 📦 package.json              ← Extension manifest + commands + config
├── 📦 tsconfig.json             ← TypeScript compiler config
├── 📄 knowledge.md              ← THIS FILE — project brain
├── 📄 README.md                 ← Public docs + setup + pitch
│
├── src/                         ← TypeScript Extension (fully standalone)
│   ├── extension.ts             ← Activation, main loop, commands, nudges
│   ├── traceCollector.ts        ← Keystroke, tab, undo, idle, paste tracking
│   ├── scorer.ts                ← Cognitive load scorer (TS port of scorer.py)
│   ├── sessionStore.ts          ← JSON-backed local session persistence
│   ├── cloudSync.ts             ← Optional cloud sync, JWT in SecretStorage
│   ├── connectWizard.ts         ← "Connect to team" webview wizard
│   ├── zenBar.ts                ← Status bar icon (🟢🟡🔴)
│   ├── themeShifter.ts          ← Dynamic warm-amber color overrides
│   ├── dashboard.ts             ← Webview panel with live metrics + timeline
│   ├── breathingExercise.ts     ← Guided 4-7-8 breathing popup
│   └── types.ts                 ← Shared interfaces / types
│
├── backend/                     ← Python backend (LEGACY — kept for reference)
│   ├── main.py                  ← FastAPI app + routes (was used pre-Phase 3)
│   ├── scorer.py                ← Original Python scorer (ported to scorer.ts)
│   ├── session.py               ← Original session tracker (ported to sessionStore.ts)
│   ├── database.py              ← SQLite helpers
│   ├── cloud_sync.py            ← Original cloud sync (ported to cloudSync.ts)
│   ├── llm_interpreter.py       ← LLM integration (future: cloud-side only)
│   ├── models.py                ← Pydantic models
│   ├── thresholds.py            ← Scoring constants (ported to scorer.ts)
│   └── requirements.txt         ← Python deps
│
├── cloud/                       ← ZenNode Cloud API (deployed by ZenNode team)
│   ├── main.py                  ← FastAPI app — auth, teams, sync, dashboard
│   ├── models.py                ← SQLAlchemy ORM: User, Team, SessionSummary
│   ├── auth.py                  ← JWT + bcrypt
│   ├── config.py                ← DATABASE_URL, JWT_SECRET etc from env
│   ├── database.py              ← SQLAlchemy engine + session
│   ├── schemas.py               ← Pydantic request/response models
│   ├── routes/
│   │   ├── auth.py              ← POST /auth/signup, /login, GET /auth/me
│   │   ├── teams.py             ← POST /teams/create, /join, GET /teams/members
│   │   ├── sync.py              ← POST /sync/session (receive anonymized summaries)
│   │   └── dashboard.py         ← GET /dashboard/team, /team/trend
│   ├── static/
│   │   └── dashboard.html       ← Manager web UI (served at GET /ui)
│   └── requirements.txt         ← Python deps (fastapi, sqlalchemy, jose, bcrypt)
│
├── assets/
│   └── icon.png                 ← Extension icon
│
└── .vscode/
    └── launch.json              ← Debug config for extension (F5)
```

---

## 🔄 Data Flow (One Cycle = 5 Seconds)

```
STEP 1 │ TraceCollector accumulates events for 5s (in-memory counters)
       │   keystrokes++, backspaces++, tabSwitches++, idleMs+=...
       │
STEP 2 │ Timer fires → traceCollector.flush() returns BehavioralSnapshot:
       │   { keystrokes:142, backspaces:31, tabSwitches:8, undos:6,
       │     idleMs:4200, pastedChars:380, totalChars:520, durationMs:5000 }
       │
STEP 3 │ scorer.score(snapshot) runs locally in TypeScript:
       │   • Computes 5 normalized metrics (switchRate, errorRate, etc.)
       │   • Applies weighted formula → raw score
       │   • Applies EMA smoothing (α=0.6) → smoothed score
       │   • Classifies state: flow / friction / fatigue / overload
       │
STEP 4 │ sessionStore.record(report) saves to globalStorage/sessions.json
       │
STEP 5 │ zenBar.update(report) → status bar shows new score + state
       │
STEP 6 │ handleCognitiveState(report):
       │   • If score ≥ 80 → theme shift (warm amber)
       │   • If overload state → show supportive notification (3-min cooldown)
       │   • If fatigue state → show nudge (5-min cooldown)
       │   • If recovery (overload→flow) → celebrate
       │
STEP 7 │ (Optional, if connected to team):
       │   On session reset → cloudSync.pushSessions(unsynced)
       │   POSTs anonymized summaries to api.zennode.dev/sync/session
       │   sessionStore.markSynced(ids)
```

---

## 🖥️ What the User Sees

### 1. Zen Bar (Always Visible)

Normal state:
```
... other status items ...    🧠 ZenNode: Flow (23)  🟢
```

Overloaded state:
```
... other status items ...    🧠 ZenNode: Overload (87) 🔴
```

### 2. Theme Shift (Auto at Score 80+)

- **Normal:** User's regular VS Code theme
- **Shifted:** Token colors warm up — blues → ambers, greens → golds, whites → soft creams
- **Reverts** automatically when score drops below 60

### 3. Supportive Notification (Red Zone Only)

```
🧘 "You've been context-switching heavily for 4 minutes.
    Want to take a 30-second breathing pause?"

    [ 🫁 Breathe ]   [ ⏭️ Dismiss ]
```

### 4. Dashboard (On-Demand via Command Palette)

- Live score gauge (0–100 arc)
- Per-metric breakdown bars
- Session timeline graph
- Current cognitive state label

### 5. Breathing Exercise (On Click or Auto-Suggested)

- Animated webview panel
- Inhale / Hold / Exhale cycle (4-7-8 pattern)
- Visual circle animation
- Auto-closes after completion

---

## 🧩 Key Design Decisions

| Decision                  | Choice                                    | Why                                                            |
|---------------------------|-------------------------------------------|----------------------------------------------------------------|
| Scorer location           | **TypeScript in extension**               | No local server needed — install extension → works instantly   |
| Local persistence         | JSON file in VS Code `globalStorageUri`   | No native deps (no SQLite), works on all platforms             |
| Cloud sync trigger        | Opt-in only, after 3 sessions             | Privacy-first — developer always in control                    |
| Auth token storage        | VS Code `SecretStorage`                   | OS-level secure storage, never in plaintext files              |
| Anonymous ID              | UUID generated locally, stored in secrets | Links local sessions to cloud without exposing identity        |
| Cloud data sent           | Anonymized summaries only (avg/max score) | Raw behavioral data never leaves the machine                   |
| Extension signup required | No — anonymous mode is default            | Zero friction adoption; team features are additive             |
| LLM strategy              | Any OpenAI-compatible API (key in .env)   | Flexible — Groq, OpenAI, Ollama, Anthropic etc.                |
| LLM trigger               | Only in Red Zone (score ≥ 80)             | Saves tokens/cost, respects privacy                            |
| Theme shift mechanism     | `workbench.colorCustomizations`           | No custom theme file needed, instant + reversible              |
| Sample rate               | 5-second windows (30s was too slow)       | Faster ZenBar feedback during testing; tunable in settings     |
| Manager UI                | Static HTML served by cloud FastAPI       | No separate frontend build needed for MVP                      |
| Cloud database            | SQLite (dev) / PostgreSQL (prod)          | Swap via `DATABASE_URL` env var — no code changes needed       |

---

## 🎬 Demo Script (For Judges)

1. **Start:** Open VS Code, show green Zen Bar — "I'm in flow"
2. **Simulate stress:** Rapidly switch tabs, mash undo, paste large blocks
3. **Watch:** Bar goes 🟢 → 🟡 → 🔴, theme shifts to warm amber
4. **Notification pops:** "You seem overwhelmed. Want a breathing pause?"
5. **Click breathe:** Guided 30-second breathing animation appears
6. **Calm down:** Bar recovers to 🟢, normal theme restores
7. **Show dashboard:** Timeline showing the stress spike and recovery

---

## 🧪 Testing Guidelines

> How to verify every layer of ZenNode — from backend scoring to full extension E2E.

### 1. Backend Health Check

Confirm the FastAPI server is running and reachable:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8420 &

# Health check
curl http://127.0.0.1:8420/health
# Expected: {"status":"ok","service":"zennode-cognitive-engine"}
```

### 2. Scorer Unit Test (Layer A — Deterministic Math)

Send crafted snapshots via curl and verify the scoring algorithm responds correctly.

**Test: Calm / Flow State**
```bash
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "keystrokes": 200, "backspaces": 10, "tabSwitches": 2,
    "undos": 0, "idleMs": 1000, "pastedChars": 0,
    "totalChars": 200, "durationMs": 30000
  }' | python -m json.tool
# Expected: score < 30, state = "flow", themeShift = false
```

**Test: Friction State**
```bash
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "keystrokes": 150, "backspaces": 60, "tabSwitches": 8,
    "undos": 5, "idleMs": 5000, "pastedChars": 40,
    "totalChars": 150, "durationMs": 30000
  }' | python -m json.tool
# Expected: score 30–60, state = "friction"
```

**Test: Overload State (repeat 3x to push through EMA)**
```bash
for i in 1 2 3; do
  curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
    -H "Content-Type: application/json" \
    -d '{
      "keystrokes": 80, "backspaces": 60, "tabSwitches": 25,
      "undos": 15, "idleMs": 12000, "pastedChars": 300,
      "totalChars": 350, "durationMs": 30000
    }' | python -m json.tool
  echo "---"
done
# Expected: score > 80 by 2nd–3rd iteration, state = "overload", themeShift = true
```

**Test: EMA Recovery (send calm snapshot after overload)**
```bash
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "keystrokes": 200, "backspaces": 5, "tabSwitches": 1,
    "undos": 0, "idleMs": 500, "pastedChars": 0,
    "totalChars": 200, "durationMs": 30000
  }' | python -m json.tool
# Expected: score drops (EMA smoothing), state transitions back toward "flow"
```

**Test: Idle Decay (near-zero keystrokes — developer stepped away)**
```bash
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "keystrokes": 1, "backspaces": 0, "tabSwitches": 0,
    "undos": 0, "idleMs": 29000, "pastedChars": 0,
    "totalChars": 1, "durationMs": 30000
  }' | python -m json.tool
# Expected: EMA decays toward 0 (idle decay factor 0.8x)
```

### 3. Session Tracking Tests

**Test: Timeline accumulation**
```bash
# Send 3 snapshots, then check timeline
curl -s http://127.0.0.1:8420/api/v1/session/timeline | python -m json.tool
# Expected: entries array with 3+ entries, each having timestamp, score, state

curl -s http://127.0.0.1:8420/api/v1/session/timeline?last_n=2 | python -m json.tool
# Expected: only the 2 most recent entries
```

**Test: Session summary**
```bash
curl -s http://127.0.0.1:8420/api/v1/session/summary | python -m json.tool
# Expected: avgScore, minScore, maxScore, snapshotCount, stateDurations, overloadCount
```

**Test: Session persistence (restart survival)**
```bash
# 1. Send a snapshot
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{"keystrokes":100,"backspaces":20,"tabSwitches":5,"undos":3,"idleMs":2000,"pastedChars":0,"totalChars":100,"durationMs":30000}'

# 2. Verify auto-save file exists
ls -la .zen_sessions/current.json
# Expected: file exists with recent timestamp

# 3. Kill and restart the server
lsof -ti :8420 | xargs kill -9
sleep 1
uvicorn main:app --host 127.0.0.1 --port 8420 &
sleep 2

# 4. Check session was resumed
curl -s http://127.0.0.1:8420/api/v1/session/summary | python -m json.tool
# Expected: snapshotCount ≥ 1, data from before restart is preserved
```

**Test: Reset + archive**
```bash
curl -s -X POST http://127.0.0.1:8420/api/v1/reset | python -m json.tool
# Expected: {"status":"ok","message":"Session reset. Score history cleared."}

ls .zen_sessions/history/
# Expected: archived session file (e.g., zen-20260328-141523.json)

curl -s http://127.0.0.1:8420/api/v1/session/history | python -m json.tool
# Expected: sessions array with the archived session
```

### 4. LLM Interpreter Test (Layer B)

> Requires `backend/.env` with a valid `LLM_API_KEY`. Skip if no LLM configured.

```bash
# Push score into Red Zone (3x overload snapshots), then check for intervention
for i in 1 2 3; do
  RESPONSE=$(curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
    -H "Content-Type: application/json" \
    -d '{
      "keystrokes": 80, "backspaces": 60, "tabSwitches": 25,
      "undos": 15, "idleMs": 12000, "pastedChars": 300,
      "totalChars": 350, "durationMs": 30000
    }')
  echo "$RESPONSE" | python -m json.tool
  echo "---"
done
# Expected on 2nd or 3rd call: "intervention" field contains a supportive message
# e.g., "You're switching a lot and correcting heavily. Breathe, then focus on one tab 🧘"

# Cooldown test: send another overload snapshot immediately
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{"keystrokes":80,"backspaces":60,"tabSwitches":25,"undos":15,"idleMs":12000,"pastedChars":300,"totalChars":350,"durationMs":30000}' | python -m json.tool
# Expected: same cached intervention (no new API call — 3-min cooldown)
```

### 5. TypeScript Compilation Check

```bash
# From project root
npx tsc --noEmit
# Expected: zero errors, zero output
```

### 6. Extension E2E Test (Manual — in VS Code)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start backend (`uvicorn main:app --port 8420`) | Terminal shows "ZenNode Cognitive Engine starting" |
| 2 | Press **F5** to launch Extension Host | New VS Code window opens |
| 3 | Check status bar (bottom right) | 🧠 ZenNode: Starting... → 🧠 ZenNode: Flow (0) 🟢 |
| 4 | Type normally for 30+ seconds | Score stays low, bar stays green |
| 5 | Rapidly switch tabs (Cmd+1/2/3), mash Ctrl+Z | Bar transitions: 🟢 → 🟡 → 🟠 |
| 6 | Continue stress for 2–3 cycles | Bar hits 🔴, theme warms to amber |
| 7 | Check notification | Supportive message appears (fatigue or overload tier) |
| 8 | Click "🫁 Breathe" in notification | Breathing exercise webview opens (animated orb) |
| 9 | Complete 3 cycles or close panel | Congratulatory notification shows |
| 10 | Run `ZenNode: Show Cognitive Dashboard` | Dashboard opens in side panel with gauge, timeline, metrics |
| 11 | Wait 30s | Dashboard updates with new data point on timeline |
| 12 | Run `ZenNode: Reset Session` | Bar resets to Flow (0), theme reverts, "Session reset" confirmation |
| 13 | Hover over Zen Bar | Rich tooltip with metric bar chart breakdown |
| 14 | Click Zen Bar | Dashboard opens |
| 15 | Run `ZenNode: Toggle Tracking` | Bar shows ⏸ Paused, no snapshots sent |
| 16 | Toggle again | Tracking resumes |

### 7. API Swagger UI

FastAPI auto-generates interactive API docs:

```
http://127.0.0.1:8420/docs     ← Swagger UI (try endpoints interactively)
http://127.0.0.1:8420/redoc    ← ReDoc (alternative documentation)
```

Use Swagger to manually send snapshots and inspect responses during development.

### 8. Quick Smoke Test Script

Run this to verify the full backend in ~10 seconds:

```bash
#!/bin/bash
# Quick smoke test — run from backend/ directory
BASE="http://127.0.0.1:8420"

echo "=== 1. Health Check ==="
curl -sf $BASE/health && echo " ✅" || echo " ❌"

echo "=== 2. Reset Session ==="
curl -sf -X POST $BASE/api/v1/reset && echo " ✅" || echo " ❌"

echo "=== 3. Calm Snapshot (expect flow) ==="
RESP=$(curl -sf -X POST $BASE/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{"keystrokes":200,"backspaces":10,"tabSwitches":2,"undos":0,"idleMs":1000,"pastedChars":0,"totalChars":200,"durationMs":30000}')
echo $RESP | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Score: {d[\"score\"]}, State: {d[\"state\"]} {\"✅\" if d[\"state\"]==\"flow\" else \"⚠️ expected flow\"}')"

echo "=== 4. Stress Snapshot x3 (expect overload) ==="
for i in 1 2 3; do
  RESP=$(curl -sf -X POST $BASE/api/v1/snapshot \
    -H "Content-Type: application/json" \
    -d '{"keystrokes":80,"backspaces":60,"tabSwitches":25,"undos":15,"idleMs":12000,"pastedChars":300,"totalChars":350,"durationMs":30000}')
  echo $RESP | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  [{sys.argv[1]}] Score: {d[\"score\"]}, State: {d[\"state\"]}, ThemeShift: {d[\"themeShift\"]}')" $i
done

echo "=== 5. Timeline (expect 4 entries) ==="
curl -sf $BASE/api/v1/session/timeline | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Entries: {len(d[\"entries\"])} {\"✅\" if len(d[\"entries\"])>=4 else \"⚠️\"}')"

echo "=== 6. Summary ==="
curl -sf $BASE/api/v1/session/summary | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Avg: {d[\"avgScore\"]}, Max: {d[\"maxScore\"]}, Snapshots: {d[\"snapshotCount\"]}')" 

echo "=== 7. Status ==="
curl -sf $BASE/api/v1/status | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Active: {d[\"active\"]}, LastScore: {d[\"lastScore\"]}')" 

echo "=== ✅ Smoke test complete ==="
```

### 9. Common Issues & Debugging

| Symptom | Cause | Fix |
|---|---|---|
| Zen Bar shows "⚠️ Backend offline" | Backend not running on port 8420 | Start backend: `cd backend && source .venv/bin/activate && uvicorn main:app --port 8420` |
| Score jumps erratically | Only sent 1 snapshot | EMA needs 2–3 snapshots to stabilize. Send multiple snapshots to see smooth transitions |
| Theme doesn't shift at score 80 | `zennode.enableThemeShift` is `false` | Enable in VS Code settings or `settings.json` |
| LLM intervention is `null` | LLM not configured, or score < 80 | Check `backend/.env` has valid `LLM_API_KEY` and `LLM_ENABLED=true`. Score must be ≥ 80 |
| Port 8420 already in use | Previous server didn't shut down | Kill it: `lsof -ti :8420 \| xargs kill -9` |
| `ModuleNotFoundError` in backend | venv not activated or deps missing | `cd backend && source .venv/bin/activate && pip install -r requirements.txt` |
| Dashboard timeline is empty | No snapshots sent yet | Let the extension run for 30+ seconds, or send manual curl snapshots |
| Session not resuming after restart | `current.json` missing or corrupted | Check `.zen_sessions/current.json` exists. If corrupted, delete it to start fresh |
| Breathing exercise won't open | Panel already open (singleton) | Close existing panel first, then re-trigger |
| Notification not showing | Cooldown active or notifications disabled | Fatigue: 5-min cooldown. Overload: 3-min cooldown. Check `zennode.showNotifications` setting |

---

## 🗺️ Roadmap Phases

### Phase 1: "The Vitals" (MVP — Hackathon Weekend) ← WE ARE HERE

- Trace Collector (TS extension → keystrokes, tabs, undos)
- Stress Algorithm (Python scorer → weighted formula)
- Visual Nudge (Theme shift to warm amber at score 80+)
- Zen Bar (Status bar 🟢🟡🔴 with live score)
- LLM Interpreter (API call in Red Zone for smart interventions)
- Dashboard + Breathing Exercise

### Phase 2: "The Intelligence Layer" (3–6 Months)

- Contextual Summaries: LLM summarizes code if dev stuck 10+ min
- AI Suggestion Throttling: Tell Copilot to give simpler snippets when fatigued
- Weekly Flow Report: Dashboard of best hours, flow patterns

### Phase 3: "The Ecosystem" (Long-Term Vision)

- Biometric Sync: Apple Watch / Garmin HRV correlation
- Team Health Privacy Mode: Manager view without individual data
- Neuro-Diversity Profiles: ADHD Mode, Dyslexia Mode, etc.

---

## 📝 Build Log

> Each time we complete a feature, we log it here with what was done.

| Date | Feature # | What Was Built | Key Files Changed |
|------|-----------|---------------|-------------------|
| 2026-03-27 | #1 Project Scaffold | Extension manifest (`package.json`) with 4 commands + 8 settings. TypeScript config (`tsconfig.json`). Debug launch configs for Extension + Backend + compound launcher (`.vscode/launch.json`). Shared types & interfaces (`src/types.ts`) — BehavioralSnapshot, CognitiveReport, MetricBreakdown, ZenBarState, STATE_DISPLAY. Python deps (`backend/requirements.txt`) — FastAPI, uvicorn, pydantic, openai, httpx. Env template (`backend/.env.example`). Gitignore. npm install completed. TS compiles clean. | `package.json`, `tsconfig.json`, `.vscode/launch.json`, `src/types.ts`, `backend/requirements.txt`, `backend/.env.example`, `.gitignore` |
| 2026-03-27 | #2 Trace Collector | `TraceCollector` class (`src/traceCollector.ts`) — 280 lines. Tracks: keystrokes (count only), backspaces/deletes, tab/editor switches, undo actions (command interception), idle time (3s threshold, 1s polling), paste events (>5 char heuristic), total chars produced. Implements `vscode.Disposable`. Has `start()`, `stop()`, `flush()`, `reset()` lifecycle. Fires `onSnapshot` event on flush. Privacy-safe: counts events only, never records content. Idle tracking via `setInterval` polling against last-activity timestamp. Paste detection via insertion-length heuristic. TS compiles clean. | `src/traceCollector.ts` |
| 2026-03-27 | #3 Backend: FastAPI + Scorer | **4 Python files built:** `thresholds.py` — all tunable weights, caps, boundaries in one place. `models.py` — Pydantic models (BehavioralSnapshot, CognitiveReport, MetricBreakdown, HealthResponse) with camelCase aliases for TS interop. `scorer.py` — `compute_metrics()` normalizes 5 raw signals to 0–100, `compute_score()` weighted sum, `classify_state()` maps score→state, `CognitiveScorer` class with EMA smoothing (α=0.6) and idle decay (0.8x). `main.py` — FastAPI app on :8420 with CORS, 4 endpoints: `/health`, `/api/v1/snapshot` (POST), `/api/v1/reset` (POST), `/api/v1/status` (GET). **Tested:** Stress snapshot→73.5 (fatigue), calm→33.4→14.6 (flow recovery), 3x extreme overload→80.7 (overload + themeShift:true). EMA prevents jitter — needs sustained bad signals to hit red zone. Python venv created, all deps installed. | `backend/main.py`, `backend/scorer.py`, `backend/models.py`, `backend/thresholds.py` |
| 2026-03-27 | #4 Backend Client | `BackendClient` class (`src/backendClient.ts`) — ~250 lines. Uses Node.js built-in `http` module (zero external deps). Methods: `sendSnapshot()` POSTs BehavioralSnapshot → returns CognitiveReport or null, `healthCheck()` pings /health, `resetSession()` clears EMA history, `getStatus()` polls current score. Resilient design: configurable timeout (default 5s), graceful error handling (returns null on failure, never crashes), connection state tracking with `onConnectionChange` event emitter so UI can show disconnected state. `setBaseUrl()` for dynamic config changes. Implements `vscode.Disposable`. TS compiles clean. | `src/backendClient.ts` |
| 2026-03-27 | #5 Zen Bar | `ZenBar` class (`src/zenBar.ts`) — ~220 lines. Creates `StatusBarItem` on right side (priority 1000). States: Starting (spinner), Flow (🟢), Friction (🟡), Fatigue (🟠 + warning bg), Overload (🔴 + error bg), Disconnected (⚠️), Paused (⏸). `update(report)` renders icon + label + score. Rich markdown tooltip with bar chart visualization per metric (█░ bars). Background colors use VS Code's `statusBarItem.errorBackground` / `warningBackground` ThemeColors. Click triggers `zennode.showDashboard` command. Human-friendly state descriptions in tooltip (e.g. "You're in the zone" for flow). TS compiles clean. | `src/zenBar.ts` |
| 2026-03-27 | #6 Extension Entry Point | `activate()` and `deactivate()` in `src/extension.ts` — ~280 lines. Wires TraceCollector + BackendClient + ZenBar into a unified lifecycle. Main loop: every 30s → flush trace → POST snapshot to backend → update Zen Bar. Backend health check on startup with retry (every 10s until connected). Commands: `toggleTracking` (pause/resume), `resetSession` (clears EMA + trace + UI), `showDashboard` (placeholder), `showBreathingExercise` (placeholder). `handleCognitiveState()` preps for ThemeShifter + LLM integration (placeholder hooks). Overload notifications with 3-minute cooldown ("Take a moment" + Breathing Exercise + Dismiss buttons). Config watcher reacts to `zennode.*` setting changes (interval, backend URL, notifications toggle). Full `Disposable` cleanup on deactivate. TS compiles clean. | `src/extension.ts` |
| 2026-03-27 | #7 Theme Shifter | `ThemeShifter` class (`src/themeShifter.ts`) — ~210 lines. Warm amber color overlay using VS Code's `workbench.colorCustomizations` API. **Hysteresis logic:** shift ON at score ≥ 80 (`themeShift` flag from backend), shift OFF only when score drops below 60 (prevents rapid toggling in 60–80 zone). Overrides 30+ VS Code color tokens: editor background/foreground, sidebar, activity bar, tabs (with amber top border accent), status bar, panel/terminal, inputs, scrollbars, badges. **Save/restore pattern:** saves user's original color values before first shift, restores exactly on revert (including deleting keys that didn't exist). `forceRevert()` for session reset and deactivation. `dispose()` auto-reverts to leave user's theme clean. Wired into `extension.ts`: imported, instantiated in `activate()`, called from `handleCognitiveState()`, force-reverted on `resetSession` and `deactivate()`. TS compiles clean. | `src/themeShifter.ts`, `src/extension.ts` |
| 2026-03-27 | #8 Session Tracking | `SessionTracker` class (`backend/session.py`) — ~238 lines. 5 Pydantic models: `TimelineEntry`, `StateDuration`, `SessionSummary`, `TimelineResponse` with camelCase aliases. `record(report)` captures every CognitiveReport with timestamp, tracks state duration deltas, counts overload/theme-shift *transitions*. `get_timeline(last_n)` returns full or windowed timeline. `get_summary()` computes avg/min/max score, session duration, state durations (with finalized current-state time), overload count, theme shift count. `reset()` generates fresh session ID + clears all history. Wired into `main.py`: imported, instantiated globally, `record()` called after every `scorer.score()`, 2 new endpoints (`GET /session/timeline`, `GET /session/summary`), `reset()` called alongside scorer reset, `snapshot_count` added to status endpoint. **Tested end-to-end:** 4 snapshots escalating flow→friction→fatigue→overload. Timeline shows all entries with correct timestamps. Summary: avg 48.0, min 7.9, max 91.2, 1 overload event, 1 theme shift. Reset clears to fresh session. | `backend/session.py`, `backend/main.py` |
| 2026-03-27 | #9 LLM Interpreter | `LLMInterpreter` class (`backend/llm_interpreter.py`) — ~210 lines. Uses `openai` AsyncOpenAI SDK with Groq's OpenAI-compatible API (`llama-3.3-70b-versatile`). **System prompt** (~400 words): CBT-based reframing principles, acts as caring colleague, ≤30 word responses, 1 emoji max, varied actionable suggestions (breathing, simplifying, slowing down, celebrating wins). **Context builder:** converts BehavioralSnapshot + CognitiveReport into concise behavioral metadata string with top 2 stress drivers — NEVER sends code. **Cooldown:** 180s between API calls, caches last intervention for reuse during sustained overload. **Graceful degradation:** 10s async timeout, catches all exceptions, returns None on failure (Layer A unaffected). Wired into `main.py`: `load_dotenv()` at startup, LLM called when `score ≥ 80 && is_available`, `reset()` alongside scorer/session on session reset. `.env` configured with Groq API key, model, base URL, enabled flag. `.env.example` updated as template. **Tested live:** Overload snapshot (97.5) → *"You're switching a lot and correcting heavily. Breathe, then focus on one tab 🧘"*. Second call used cached response (cooldown working). | `backend/llm_interpreter.py`, `backend/main.py`, `backend/.env`, `backend/.env.example` |
| 2026-03-27 | #10 Supportive Notifications | Enhanced notification system in `src/extension.ts` — replaced single overload alert with **3-tier system**. **Fatigue tier:** informational notifications at `fatigue` state, 5-min cooldown, 4 rotating nudge messages (focus tips, pace reminders), "🎯 Focus Mode" button that closes non-active editor tabs. **Overload tier:** warning-level notifications at `overload` state, 3-min cooldown, uses LLM `intervention` text when available else falls back to 5 rotating empathetic messages, 3 action buttons ("🫁 Breathe" → breathing exercise, "📊 Dashboard" → dashboard, "⏭️ Dismiss"). **Recovery tier:** celebration notifications when transitioning from overload/fatigue → flow/friction, no cooldown (always fires to reinforce positive behavior), 4 rotating congratulatory messages. `previousState` tracking for transition detection. All gated by `zennode.enableNotifications` config. Modular index cycling for message rotation. TS compiles clean. | `src/extension.ts` |
| 2026-03-28 | #11 Breathing Exercise | `showBreathingExercise()` + `disposeBreathingExercise()` in `src/breathingExercise.ts` — ~310 lines. Animated webview panel with 4-7-8 breathing pattern (Inhale 4s → Hold 7s → Exhale 8s × 3 cycles = ~57s). **Three screens:** Intro (pulsing orb preview, BEGIN + NOT NOW buttons), Exercise (growing/shrinking orb, phase text, countdown timer, SVG progress ring), Completion (🧘 Well Done + BACK TO CODE). **Orb animation:** CSS transition-driven scale (1→2.2x), phase-specific gradients (teal→blue→purple), glow-pulse keyframe during hold. **22 ambient particles** with randomized drift for calming atmosphere. **Singleton panel** — re-reveals if already open. VS Code `postMessage` bridge: `complete` → shows congrats notification + disposes, `close` → silent dispose. Wired into `extension.ts`: replaced placeholder command, added import, `disposeBreathingExercise()` in deactivate. TS compiles clean. | `src/breathingExercise.ts`, `src/extension.ts` |
| 2026-03-28 | #12 Dashboard Webview | `showDashboard()` + `updateDashboard()` + `disposeDashboard()` in `src/dashboard.ts` — ~480 lines. Rich webview panel with 2-column CSS grid layout. **Score gauge:** SVG semicircle arc with strokeDashoffset animation, linear gradient (green→red), large score number + state badge. **Metric breakdown:** 5 animated horizontal bars (Switch, Error, Undo, Idle, Paste) with severity coloring. **Timeline chart:** SVG line chart fetching from `/api/v1/session/timeline`, 4 zone bands (flow/friction/fatigue/overload), threshold lines at 30/60/80, area fill + dot rendering per state. **Session summary:** 6 stat cards (avg/min/max score, duration, snapshots, overloads) from `/api/v1/session/summary`. **State time distribution:** 4 bars showing proportional time in each state. **Intervention banner:** shows LLM text when available. **Actions:** Breathe + Reset Session buttons via postMessage. Singleton panel in ViewColumn.Two with `retainContextWhenHidden`. Live updates via `updateReport` postMessage from main loop. Wired into `extension.ts`: import, replaced 14-line placeholder, `updateDashboard()` in main loop, `disposeDashboard()` in deactivate. TS compiles clean. | `src/dashboard.ts`, `src/extension.ts` |
| 2026-03-28 | #13 Session Persistence | Expanded `SessionTracker` in `backend/session.py` from ~238 to ~420 lines. **Auto-save:** `_save()` writes JSON to `.zen_sessions/current.json` after every `record()` via atomic temp-file+rename. **Resume:** `__init__()` loads existing `current.json` — restores all state (entries, counters, durations, EMA). **EMA persistence:** `record(report, ema_score=X)` stores scorer EMA; `main.py` restores `scorer._ema_score` on startup from `saved_ema_score`. **Archive on reset:** `_archive()` saves full timeline + summary to `history/{session_id}.json`, deletes `current.json`. **History API:** `get_history()` scans archive dir, returns `HistoryResponse` → new `GET /api/v1/session/history` endpoint. **New models:** `PastSession`, `HistoryResponse`. **Graceful degradation:** all I/O try/except, never crashes. **Tested:** auto-save confirmed, server restart resumed session (2 snapshots, EMA 58.8), reset archived, history endpoint returns past session. `.gitignore` updated. | `backend/session.py`, `backend/main.py`, `.gitignore` |
| 2026-03-28 | #14 README & Docs | Comprehensive hackathon-ready `README.md` (~350 lines). **Hero section:** centered title, tagline, 5 badge shields (VS Code, FastAPI, LLM, MIT, Hackathon), blockquote pitch. **Problem statement:** condensed burnout stats, AI accelerant narrative, silent burnout explanation, failing solutions table. **Features:** 9 sections with emoji headers covering all ZenNode capabilities. **Architecture:** ASCII diagram showing Extension ↔ Backend data flow, Layer A/B, all modules. **Quick Start:** 5-step setup guide (clone, configure LLM, start backend, launch extension, verify). **Scoring algorithm:** formula + metric table with weights + EMA explanation. **Configuration:** all 8 `zennode.*` settings table. **Science section:** 6 interventions mapped to clinical principles (CBT, Chromotherapy, 4-7-8, Flow Theory, Psychoeducation, MI). **Demo script:** 8-step judge walkthrough. **Project structure:** annotated file tree. **API reference:** 7 endpoints. **Privacy:** 5-point guarantee. **Roadmap:** 3 phases. **Development guide.** Closing with MIT license + tagline. | `README.md` |

---

*This file is our single source of truth. We revisit it before and after every feature build.*
