<p align="center">
  <strong>The first IDE layer that listens to your brain, not just your keyboard.</strong><br>
  Real-time cognitive load monitoring for VS Code — protecting developer mental health with behavioral science and AI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square&logo=visual-studio-code" alt="VS Code Extension">
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi" alt="FastAPI Backend (Optional)">
  <img src="https://img.shields.io/badge/LLM-Groq%20%7C%20OpenAI-blueviolet?style=flat-square" alt="LLM Powered">
  <img src="https://img.shields.io/badge/Team%20Sync-Cloud%20Optional-orange?style=flat-square" alt="Team Cloud Sync">
  <img src="https://img.shields.io/badge/🔒%20Privacy-100%25%20Local-20c997?style=flat-square" alt="Privacy First">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Hackathon-Mental%20Health%20🧠💚-ff69b4?style=flat-square" alt="Mental Health Hackathon">
</p>

---

> *"We spend billions building tools that monitor the health of servers, databases, and APIs. ZenNode asks a simple question: what if we monitored the health of the developer too? Not with surveys. Not with annual check-ins. But in real-time, inside the tool they use 8 hours a day, using the behavioral signals their brain is already broadcasting. Because the most expensive bug in production isn't a null pointer — it's a burned-out developer who stopped caring enough to catch it."*

---

## 🔒 Privacy Is the Foundation

> **ZenNode was designed privacy-first from day one — not as a checkbox, but as a core principle.**

Mental health tooling only works if developers *trust* it. The moment an employee suspects their IDE is reporting their struggle to a manager, they'll hide the struggle. ZenNode is architected so that trust is not a matter of policy — it's guaranteed by the code itself.

| Guarantee | How It's Enforced |
|---|---|
| **Scoring runs 100% locally** | The TypeScript scorer (`src/scorer.ts`) runs inside the extension process — no data leaves your machine for cognitive scoring |
| **Counts only, never content** | `traceCollector.ts` records *how many* keystrokes, never *what* you typed. File names, variable names, and source code are never accessed |
| **LLM sees metadata, not code** | If Layer B (optional backend) is enabled, the AI receives only anonymized behavioral numbers: e.g., `"tabSwitches: 18, undos: 12"` — never source code |
| **Team sync is opt-in and anonymized** | Cloud sync only activates after you choose to connect. Only aggregated session summaries are shared, identified by a random `anonymous_id` — never your name or email |
| **No telemetry, ever** | ZenNode has no analytics, no crash reporting, no phone-home. It cannot phone home because it has no such code |
| **Local session storage** | Sessions are stored in VS Code's global storage and optionally `backend/zennode.db` on your own disk — fully under your control, never uploaded without consent |
| **You can audit it** | The entire codebase is open source. Every privacy claim above can be verified line-by-line |

**The rule of thumb:** If ZenNode can't do its job knowing only *counts* and *timing*, it doesn't ask for more.

---

## 🔥 The Problem

Software developers are in the middle of a **mental health epidemic** — and their tools are blind to it.

- **58% of developers** report burnout symptoms (Haystack Analytics 2025)
- **73% feel mentally exhausted** by end of day — up from 42% pre-AI era
- **42% who left tech** in 2025 cited mental health as the primary reason
- The WHO now classifies **occupational burnout as a medical syndrome** (ICD-11)

In 2026, AI-assisted coding made developers 10x faster at *producing* code — but the human brain still reviews at the same speed. The bottleneck shifted from writing to **sustaining the mental energy** to review, verify, and reason about a flood of AI-generated code.

**The result?** A new, insidious "silent burnout" — output stays high while the developer's mental health quietly crumbles. Nobody notices because lines of code keep shipping. By the time someone does notice, it's already a crisis.

**Your IDE knows if your code has a bug. It has no idea if *you* are about to break.**

### Why Current Solutions Fail

| Solution | Why It Fails |
|---|---|
| Pomodoro timers | Arbitrary intervals — interrupts flow state as often as it helps |
| Screen time trackers | Measures hours, not cognitive load. 2h of flow ≠ 2h of context-switching |
| Break reminder plugins | Fixed-interval popups. Developers disable them within a week |
| Wellness apps | Disconnected from coding context. "Meditate for 10 min" during a P0 doesn't help |

**The gap:** No tool sits where the developer actually lives — **inside the IDE** — and measures the cognitive cost of what they're doing **in real-time**.

---

## 💡 What ZenNode Does

ZenNode is a VS Code extension that monitors your **behavioral biomarkers** — typing patterns, tab-switching frequency, undo rates, idle gaps, paste-without-edit patterns — and detects when your brain is struggling, *before you realize it yourself*.

All cognitive scoring runs **locally in TypeScript** — no server required. The Python backend and cloud sync are optional layers you can add for LLM-powered interventions and team health insights.

### The Four Cognitive States

| State | Score | Zen Bar | What It Means |
|---|---|---|---|
| **🟢 Flow** | 0 – 30 | Green | Deep focus, everything clicking. ZenNode stays invisible. |
| **🟡 Friction** | 31 – 60 | Yellow | Frequent edits, high undo rate. Working hard but managing. |
| **🟠 Fatigue** | 61 – 80 | Orange | Long idles, slowed typing. Brain is tiring. Gentle nudges begin. |
| **🔴 Overload** | 81 – 100 | Red | Rapid tab-cycling, pasting AI blocks without review. Full intervention. |

---

## ✨ Features

### 🔍 Behavioral Trace Collector
Silently tracks 6 behavioral signals every 5 seconds — keystrokes, backspaces, tab switches, undo actions, idle time, and paste events. **Privacy-first:** counts events only, never records what you type.

### 🧮 Local Cognitive Scorer (Layer A)
Pure TypeScript weighted formula with EMA smoothing (α=0.6) produces a 0–100 score, computed entirely inside the extension. No network call required. Needs *sustained* bad signals to reach overload — no jittery false alarms.

### 🎨 Zen Bar (Status Bar)
Always-visible status bar showing your current state with emoji + score. Rich markdown tooltip reveals per-metric breakdown with visual bar charts. Click to open the dashboard.

### 🌅 Warm Amber Theme Shift
At score ≥ 80, your editor's colors subtly shift to warm amber tones — 30+ VS Code tokens overridden. Clinically inspired: warm light reduces cortisol and signals the nervous system to down-regulate. Hysteresis prevents toggling (ON at 80, OFF below 60).

### 🫁 Guided Breathing Exercise
Animated webview panel with the **4-7-8 breathing pattern** (Inhale 4s → Hold 7s → Exhale 8s × 3 cycles). Features a pulsing orb, SVG progress ring, ambient particles, and three screens (intro → exercise → completion). Clinically proven to reduce acute anxiety within 60 seconds.

### 💾 Session Persistence
Auto-saves cognitive sessions to VS Code's global storage as JSON. Survives editor restarts — EMA score is restored so monitoring resumes seamlessly. Completed sessions are archived with full timeline and state-duration breakdown.

### 📈 Live Dashboard
Rich webview with score gauge, per-metric bars, session timeline chart, state time distribution, and AI insight banner. Opens side-by-side with your editor. Updates every 5 seconds.

### 🔔 3-Tier Notification System
- **Fatigue nudges** — gentle focus tips at orange zone (5-min cooldown)
- **Overload interventions** — supportive messages at red zone (3-min cooldown)
- **Recovery celebrations** — positive reinforcement when you return to flow 🎉

### 🤖 LLM-Powered Interventions (Layer B — Optional)
When you hit the red zone, an AI (Groq/OpenAI-compatible) generates a **context-aware, CBT-based message** — like a caring colleague, not a therapist. ≤30 words, actionable, never preachy. Requires the optional Python backend. The LLM sees behavioral metadata only, **never your source code**.

### 👥 Team Health Sync (Optional)
Connect to your team's ZenNode cloud to share **anonymized** session summaries. See if your team's collective cognitive load is trending up — with full privacy (never raw behavioral data, never source code). Opt-in only: the connection wizard appears after 3 completed sessions.

---

## 🏗️ Architecture

ZenNode is designed in three independent layers. You can use just Layer A — the extension works completely offline.

```
┌─────────────────────────────────────────────────────────────────┐
│                VS Code Extension (TypeScript)                    │
│                                                                  │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Trace         │  │   Zen Bar    │  │   Theme Shifter     │  │
│  │  Collector     │  │  🟢🟡🟠🔴    │  │   Normal → Amber    │  │
│  └──────┬────────┘  └──────▲───────┘  └──────────▲──────────┘  │
│         │                  │                      │              │
│  ┌──────▼────────┐  ┌──────┴───────┐  ┌──────────┴──────────┐  │
│  │  scorer.ts    │  │  dashboard.ts │  │ breathingExercise.ts│  │
│  │  (Layer A —   │  │  (Webview)   │  │   (Webview)         │  │
│  │  local math)  │  └──────────────┘  └─────────────────────┘  │
│  └──────┬────────┘                                              │
│         │               ┌──────────────┐  ┌───────────────────┐ │
│  ┌──────▼────────┐       │ sessionStore │  │  connectWizard.ts │ │
│  │ backendClient │       │    .ts       │  │  (Team opt-in     │ │
│  │ (optional)    │       │  (JSON/disk) │  │   wizard)         │ │
│  └──────┬────────┘       └──────────────┘  └─────────┬─────────┘ │
└─────────┼──────────────────────────────────────────── │ ──────────┘
          │  HTTP POST (optional)                        │
          ▼                                              ▼
┌──────────────────────────────┐   ┌─────────────────────────────┐
│  Python Backend (FastAPI     │   │  Cloud API (FastAPI          │
│  :8420) — OPTIONAL           │   │  :8421) — OPTIONAL           │
│                              │   │                              │
│  scorer.py  (mirrors Layer A)│   │  auth.py (signup/login)      │
│  llm_interpreter.py (Layer B)│   │  sessions sync               │
│  session.py (SQLite)         │   │  team health aggregation     │
│  database.py (zennode.db)    │   │  privacy-preserving only     │
│  cloud_sync.py               │   │                              │
└──────────────────────────────┘   └─────────────────────────────┘
```

**Three-layer design:**
- **Layer A** — deterministic TypeScript math, runs inside the extension, always on, zero latency
- **Layer B** — optional Python backend + LLM for deep interpretation at score ≥ 80
- **Layer C** — optional cloud for team health visibility (anonymized, privacy-first)

---

## 🚀 Quick Start

### Prerequisites

- **VS Code** ≥ 1.85.0
- **Node.js** ≥ 18
- **Python** ≥ 3.10 *(only if using the optional backend)*

### 1. Clone & Install

```bash
git clone https://github.com/your-org/zen-node.git
cd zen-node

# Install extension dependencies
npm install
```

### 2. Launch the Extension

Press **F5** in VS Code to open the Extension Development Host.

You should see the Zen Bar appear in your status bar: **🧠 ZenNode: Flow (0) 🟢**

> The extension works fully without the Python backend — cognitive scoring runs locally in TypeScript.

### 3. Verify

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and try:
- `ZenNode: Show Cognitive Dashboard` — opens the live dashboard
- `ZenNode: Breathing Exercise` — launches the guided breathing panel
- `ZenNode: Reset Session` — clears and archives the current session
- `ZenNode: Toggle Tracking` — pause/resume monitoring

---

## 🖥️ Running the Optional Python Backend

The Python backend adds LLM-powered interventions (Layer B). The extension works without it.

### Step 1 — Navigate to the backend directory

```bash
cd zen-node/backend
```

### Step 2 — Create and activate the virtual environment

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

Installs: `fastapi`, `uvicorn`, `pydantic`, `openai`, `httpx`, `python-dotenv`.

### Step 4 — Configure LLM (required for Layer B)

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
LLM_API_KEY=gsk_your_groq_api_key_here
LLM_MODEL=llama-3.3-70b-versatile
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_ENABLED=true
```

| Provider | `LLM_BASE_URL` | Notes |
|---|---|---|
| **Groq** | `https://api.groq.com/openai/v1` | Free tier available, very fast |
| **OpenAI** | `https://api.openai.com/v1` | Use `gpt-4o-mini` for low cost |
| **Ollama** (local) | `http://localhost:11434/v1` | Fully offline, no API key needed |
| **Together AI** | `https://api.together.xyz/v1` | Many open models |

### Step 5 — Start the server

```bash
uvicorn main:app --host 127.0.0.1 --port 8420 --reload
```

You should see:
```
🧠 ZenNode Cognitive Engine starting on port 8420...
INFO:     Uvicorn running on http://127.0.0.1:8420 (Press CTRL+C to quit)
```

### Step 6 — Enable backend in VS Code settings

Set `zennode.backendUrl` to `http://127.0.0.1:8420` (default) and ensure the extension is pointed at the running server.

### Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `Address already in use` | Port 8420 is taken | `lsof -i :8420` then `kill <PID>` |
| `ModuleNotFoundError` | venv not activated | Run `source .venv/bin/activate` then `pip install -r requirements.txt` |
| LLM inactive | `.env` missing or `LLM_ENABLED=false` | Copy `.env.example` to `.env` and fill in your key |
| LLM calls timing out | Bad API key | Check your key in `.env`, or set `LLM_ENABLED=false` |

---

## 📦 Packaging the Extension

```bash
# Install vsce
npm install -g @vscode/vsce

# Compile TypeScript first
npm run compile

# Package
vsce package
# → zennode-0.1.0.vsix
```

### Install the `.vsix` locally

```bash
code --install-extension zennode-0.1.0.vsix
```

Or via VS Code UI: Extensions panel → `···` menu → **Install from VSIX...**

---

## 🔢 Scoring Algorithm

The cognitive load score **S** is a weighted sum of 5 normalized behavioral metrics:

```
S = 0.25·SwitchRate + 0.20·ErrorRate + 0.25·UndoRate + 0.15·IdleRatio + 0.15·PasteRatio
```

| Metric | Definition | Weight | Why |
|---|---|---|---|
| **SwitchRate** | Tab switches / min (normalized 0–100) | 0.25 | Strongest signal of context-switching overload |
| **ErrorRate** | Backspaces / total keystrokes × 100 | 0.20 | Indicates struggle and friction |
| **UndoRate** | Undos / min (normalized 0–100) | 0.25 | Directly correlates with decision fatigue |
| **IdleRatio** | Idle seconds / total seconds × 100 | 0.15 | Signals disengagement or exhaustion |
| **PasteRatio** | Pasted chars / total chars × 100 | 0.15 | Flags "AI dump without review" behavior |

Smoothed with an **Exponential Moving Average** (α = 0.6) to prevent jitter. Score gently decays toward 0 when you step away (keystrokes < 3).

The algorithm runs identically in TypeScript (`src/scorer.ts`) and Python (`backend/scorer.py`) for consistency.

---

## ⚙️ Configuration

All settings are under `zennode.*` in VS Code settings:

| Setting | Default | Description |
|---|---|---|
| `zennode.enabled` | `true` | Enable/disable cognitive load monitoring |
| `zennode.backendUrl` | `http://127.0.0.1:8420` | URL of the optional FastAPI backend |
| `zennode.sampleIntervalMs` | `5000` | How often (ms) to compute and send behavioral snapshots |
| `zennode.enableThemeShift` | `true` | Auto-shift colors to warm amber at high load |
| `zennode.enableLLM` | `false` | Enable LLM-powered interventions (requires backend) |
| `zennode.warningThreshold` | `50` | Score that triggers yellow warning |
| `zennode.criticalThreshold` | `80` | Score that triggers red alert + theme shift |
| `zennode.showNotifications` | `true` | Show supportive notification messages |

---

## 📁 Project Structure

```
zen-node/
├── package.json              ← Extension manifest (6 commands, 8 settings)
├── tsconfig.json             ← TypeScript config (ES2022, strict)
├── assets/
│   └── icon.png              ← Extension icon
│
├── src/                      ← VS Code Extension (TypeScript)
│   ├── extension.ts          ← Activation, lifecycle, main loop (5s interval)
│   ├── types.ts              ← Shared interfaces (BehavioralSnapshot, CognitiveReport, etc.)
│   ├── traceCollector.ts     ← Behavioral signal tracking (counts only, privacy-first)
│   ├── scorer.ts             ← Local TypeScript cognitive scorer (Layer A)
│   ├── sessionStore.ts       ← Session persistence to VS Code global storage (JSON)
│   ├── zenBar.ts             ← Status bar (🟢🟡🟠🔴 + tooltip)
│   ├── themeShifter.ts       ← Warm amber color overlay (30+ token overrides)
│   ├── dashboard.ts          ← Live metrics webview (gauge, timeline, summary)
│   ├── breathingExercise.ts  ← Guided 4-7-8 breathing webview
│   ├── cloudSync.ts          ← Optional team sync (anonymized sessions, JWT auth)
│   └── connectWizard.ts      ← Team connection wizard (opt-in, after 3 sessions)
│
├── backend/                  ← Python Cognitive Engine (FastAPI :8420) — OPTIONAL
│   ├── main.py               ← FastAPI app + routes
│   ├── scorer.py             ← Python mirror of Layer A scoring algorithm
│   ├── llm_interpreter.py    ← LLM integration (Layer B, Groq/OpenAI/Ollama)
│   ├── models.py             ← Pydantic models (mirrors TypeScript types)
│   ├── thresholds.py         ← Tunable constants (weights, caps, thresholds)
│   ├── session.py            ← SQLite-backed session tracker
│   ├── database.py           ← SQLite connection + schema management (zennode.db)
│   ├── cloud_sync.py         ← Backend side of team cloud sync
│   ├── requirements.txt      ← Python dependencies
│   └── .env.example          ← LLM config template
│
├── cloud/                    ← Team Cloud API (FastAPI) — OPTIONAL, separate service
│   ├── main.py               ← Cloud FastAPI app
│   ├── auth.py               ← Signup, login, token management
│   ├── database.py           ← Cloud DB (zennode_cloud.db)
│   ├── models.py             ← Cloud data models
│   ├── schemas.py            ← API schemas
│   ├── routes/               ← Endpoint handlers
│   └── requirements.txt      ← Cloud service dependencies
│
└── .vscode/
    └── launch.json           ← Debug configs (Extension / Backend / compound F5)
```

---

## 🔌 API Endpoints

The optional Python backend exposes:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/snapshot` | Submit behavioral snapshot → receive cognitive report |
| `POST` | `/api/v1/reset` | Reset session (archives current, clears EMA) |
| `GET` | `/api/v1/status` | Current score + state without new data |
| `GET` | `/api/v1/session/timeline?last_n=N` | Session timeline entries |
| `GET` | `/api/v1/session/summary` | Aggregated session stats |
| `GET` | `/api/v1/session/history` | Past archived sessions |
| `POST` | `/api/v1/cloud/connect` | Connect to team cloud |
| `POST` | `/api/v1/cloud/sync` | Push anonymized session to cloud |

Interactive docs: `http://127.0.0.1:8420/docs` (Swagger) · `http://127.0.0.1:8420/redoc` (ReDoc)

---

## 🧬 The Science Behind ZenNode

| Feature | Principle | Evidence |
|---|---|---|
| 🌅 Warm color shift | **Chromotherapy** | Warm tones reduce cortisol and eye strain, signaling the nervous system to down-regulate |
| 🫁 Breathing exercise | **4-7-8 Breathing** | Activates the parasympathetic nervous system; clinically proven to reduce acute anxiety within 60 seconds |
| 🤖 LLM messages | **Cognitive Reframing (CBT)** | Instead of "you're failing," the AI reframes: "this is complex, let's simplify" — core CBT technique |
| 🟢 Flow protection | **Csikszentmihalyi's Flow Theory** | Flow is the optimal psychological state; ZenNode is invisible during flow to avoid disrupting it |
| 📈 Dashboard | **Psychoeducation** | Understanding your own patterns is the #1 predictor of successful mental health management |
| 🔔 Gentle nudges | **Motivational Interviewing** | Non-judgmental nudges outperform forceful interventions in behavioral change literature |

---

## 🎬 Demo Script (For Judges)

1. **Start** — Open VS Code, point to the green Zen Bar: *"I'm in flow. ZenNode is invisible."*
2. **Stress it** — Rapidly switch tabs, mash undo, paste large AI blocks without reading
3. **Watch the transition** — Bar goes 🟢 → 🟡 → 🟠 → 🔴, theme warms to amber
4. **Notification appears** — *"You seem overwhelmed. Want a breathing pause?"*
5. **Click "Breathe"** — Guided 4-7-8 breathing animation fills the screen
6. **Calm down** — Bar recovers to 🟢, normal theme restores automatically
7. **Open Dashboard** — Timeline shows the stress spike and recovery arc
8. **Key message** — *"In 2026, your IDE catches bugs in your code. ZenNode catches the cracks in your mental health — before they become breakdowns."*

---

## 🔒 Privacy

See the [Privacy Is the Foundation](#-privacy-is-the-foundation) section above for the full breakdown. Short version:

- ✅ Cognitive scoring runs **100% locally** — no server required, no data leaves your machine
- ✅ **Counts only** — keystrokes, tab switches, undo frequency. Never what you typed or what files you edited
- ✅ **LLM sees behavioral numbers only** — never source code
- ✅ **Team sync is opt-in and anonymized** — random anonymous_id, no names or emails
- ✅ **No telemetry** — zero analytics, zero phone-home
- ✅ **Fully auditable** — open source, every claim verifiable in the code

---

## 🗺️ Roadmap

### Phase 1: "The Vitals" ← **Complete** ✅
Local cognitive scoring, Zen Bar, theme shift, breathing exercise, dashboard, session persistence, notifications, optional LLM backend, optional team cloud sync.

### Phase 2: "The Intelligence Layer"
- Connect extension live to backend LLM for real-time interventions
- Contextual summaries when stuck 10+ min
- AI suggestion throttling (tell Copilot to slow down when fatigued)
- Weekly flow reports with best-hours analysis

### Phase 3: "The Ecosystem"
- Biometric sync (Apple Watch / Garmin HRV)
- Team health dashboard (privacy-preserving aggregates)
- Neurodiversity profiles (ADHD mode, Dyslexia mode)

---

## 🛠️ Development

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-recompile)
npm run watch

# Launch extension in debug mode
# Press F5 in VS Code (uses .vscode/launch.json)

# Start optional backend
cd backend && source .venv/bin/activate && uvicorn main:app --port 8420 --reload

# Compound launch (extension + backend simultaneously)
# Use "Full ZenNode (Extension + Backend)" config in .vscode/launch.json
```

---

## 🧪 Testing

### Backend Smoke Test

```bash
# Health check
curl http://127.0.0.1:8420/health
# → {"status":"ok","service":"zennode-cognitive-engine","version":"0.1.0"}

# Send a calm snapshot (expect flow)
curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
  -H "Content-Type: application/json" \
  -d '{"keystrokes":200,"backspaces":10,"tabSwitches":2,"undos":0,"idleMs":1000,"pastedChars":0,"totalChars":200,"durationMs":30000}'
# → score < 30, state = "flow"

# Send 3x stress snapshots (expect overload by 3rd)
for i in 1 2 3; do
  curl -s -X POST http://127.0.0.1:8420/api/v1/snapshot \
    -H "Content-Type: application/json" \
    -d '{"keystrokes":80,"backspaces":60,"tabSwitches":25,"undos":15,"idleMs":12000,"pastedChars":300,"totalChars":350,"durationMs":30000}' | python -m json.tool
done
# → score > 80, state = "overload", themeShift = true
```

### Extension E2E (Manual)

1. Press **F5** → Extension Host launches
2. Verify Zen Bar shows 🟢 Flow
3. Rapidly switch tabs + mash undo → watch bar go 🟡 → 🟠 → 🔴
4. Confirm theme shifts to amber at overload
5. Check notification appears with "🫁 Breathe" button
6. Open Dashboard via Command Palette → verify gauge + timeline
7. Reset session → confirm bar returns to 🟢, theme reverts

---

## 📄 License

MIT — Built with 🧠💚 for the Mental Health Hackathon 2026.

---

<p align="center">
  <strong>In 2026, your IDE catches bugs in your code.<br>ZenNode catches the cracks in your mental health — before they become breakdowns.</strong>
</p>
