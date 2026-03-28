# =============================================================================
# ZenNode Backend — Thresholds & Tunable Constants
#
# All scoring parameters live here so they're easy to find and adjust.
# During the hackathon, tweak these to make the demo feel right.
# =============================================================================


# ── Scoring Weights ──────────────────────────────────────────────────────────
# Must sum to 1.0. These determine how much each metric contributes to the
# final cognitive load score (0–100).

WEIGHT_SWITCH_RATE = 0.25   # Tab/context switching — strongest overload signal
WEIGHT_ERROR_RATE  = 0.20   # Backspace ratio — indicates struggle / friction
WEIGHT_UNDO_RATE   = 0.25   # Undo frequency — decision fatigue signal
WEIGHT_IDLE_RATIO  = 0.15   # Idle time ratio — disengagement / exhaustion
WEIGHT_PASTE_RATIO = 0.15   # Paste-without-edit — AI dump behavior


# ── Normalization Caps ───────────────────────────────────────────────────────
# Raw metric values are normalized to 0–100 using these caps.
# A raw value at or above the cap = normalized score of 100.
# Tweak these based on what feels "extreme" in real usage.

# SwitchRate: tab switches per minute
# Normal: 2-4/min, High: 8-10/min, Extreme: 15+/min
SWITCH_RATE_CAP = 15.0  # switches/minute → 100

# ErrorRate: backspaces / total keystrokes (as percentage)
# Normal: 5-10%, High: 20-30%, Extreme: 50%+
ERROR_RATE_CAP = 50.0  # percent → 100

# UndoRate: undos per minute
# Normal: 0-1/min, High: 3-5/min, Extreme: 10+/min
UNDO_RATE_CAP = 10.0  # undos/minute → 100

# IdleRatio: idle time / total time (as percentage)
# Normal: 10-20%, High: 40-50%, Extreme: 80%+
IDLE_RATIO_CAP = 80.0  # percent → 100

# PasteRatio: pasted chars / total chars (as percentage)
# Normal: 5-15%, High: 40-60%, Extreme: 90%+
PASTE_RATIO_CAP = 90.0  # percent → 100


# ── State Classification Thresholds ─────────────────────────────────────────
# These define the boundaries between cognitive states based on the final score.

THRESHOLD_FLOW_MAX     = 30   # 0–30: Flow (green)
THRESHOLD_FRICTION_MAX = 60   # 31–60: Friction (yellow)
THRESHOLD_FATIGUE_MAX  = 80   # 61–80: Fatigue (orange)
# 81–100: Overload (red)

# Theme shift triggers at this score
THRESHOLD_THEME_SHIFT = 80

# LLM intervention triggers at this score
THRESHOLD_LLM_TRIGGER = 1  # TEMP: testing


# ── Minimum Activity Threshold ──────────────────────────────────────────────
# If total keystrokes are below this, the user probably stepped away.
# Return a neutral "flow" state instead of calculating on near-zero data.
MIN_KEYSTROKES_FOR_SCORING = 3


# ── Smoothing ────────────────────────────────────────────────────────────────
# Exponential moving average alpha for score smoothing across snapshots.
# Higher = more reactive, Lower = more stable.
# 1.0 = no smoothing (raw score), 0.3 = heavy smoothing
EMA_ALPHA = 0.6


