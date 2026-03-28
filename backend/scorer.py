# =============================================================================
# ZenNode Backend — Cognitive Load Scorer (Layer A)
#
# This is the deterministic math engine. It takes a BehavioralSnapshot,
# normalizes the raw metrics, computes a weighted cognitive load score (0–100),
# and classifies the developer's cognitive state.
#
# This runs on EVERY snapshot (every 30s). It's fast, pure math, no LLM.
# =============================================================================

from models import BehavioralSnapshot, CognitiveReport, CognitiveState, MetricBreakdown
from thresholds import (
    WEIGHT_SWITCH_RATE, WEIGHT_ERROR_RATE, WEIGHT_UNDO_RATE,
    WEIGHT_IDLE_RATIO, WEIGHT_PASTE_RATIO,
    SWITCH_RATE_CAP, ERROR_RATE_CAP, UNDO_RATE_CAP,
    IDLE_RATIO_CAP, PASTE_RATIO_CAP,
    THRESHOLD_FLOW_MAX, THRESHOLD_FRICTION_MAX, THRESHOLD_FATIGUE_MAX,
    THRESHOLD_THEME_SHIFT, MIN_KEYSTROKES_FOR_SCORING, EMA_ALPHA,
)


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, value))


def _normalize(raw: float, cap: float) -> float:
    """Normalize a raw value to 0–100 scale using the cap as the ceiling."""
    if cap <= 0:
        return 0.0
    return _clamp((raw / cap) * 100.0)


def compute_metrics(snapshot: BehavioralSnapshot) -> MetricBreakdown:
    """
    Convert raw behavioral counts into normalized 0–100 metric scores.

    Each metric represents a different dimension of cognitive stress:
      - switchRate:  context switching intensity
      - errorRate:   error correction intensity
      - undoRate:    decision reversal intensity
      - idleRatio:   disengagement level
      - pasteRatio:  passive code acceptance level
    """
    duration_min = snapshot.duration_ms / 60_000.0
    if duration_min <= 0:
        duration_min = 0.5  # safety floor: assume at least 30s

    # ── SwitchRate: tab switches per minute ──
    raw_switch_rate = snapshot.tab_switches / duration_min
    switch_rate = _normalize(raw_switch_rate, SWITCH_RATE_CAP)

    # ── ErrorRate: backspaces as % of total keystrokes ──
    total_key_actions = snapshot.keystrokes
    if total_key_actions > 0:
        raw_error_rate = (snapshot.backspaces / total_key_actions) * 100.0
    else:
        raw_error_rate = 0.0
    error_rate = _normalize(raw_error_rate, ERROR_RATE_CAP)

    # ── UndoRate: undos per minute ──
    raw_undo_rate = snapshot.undos / duration_min
    undo_rate = _normalize(raw_undo_rate, UNDO_RATE_CAP)

    # ── IdleRatio: idle ms as % of total duration ──
    raw_idle_ratio = (snapshot.idle_ms / snapshot.duration_ms) * 100.0
    idle_ratio = _normalize(raw_idle_ratio, IDLE_RATIO_CAP)

    # ── PasteRatio: pasted chars as % of total chars ──
    if snapshot.total_chars > 0:
        raw_paste_ratio = (snapshot.pasted_chars / snapshot.total_chars) * 100.0
    else:
        raw_paste_ratio = 0.0
    paste_ratio = _normalize(raw_paste_ratio, PASTE_RATIO_CAP)

    return MetricBreakdown(
        switch_rate=round(switch_rate, 1),
        error_rate=round(error_rate, 1),
        undo_rate=round(undo_rate, 1),
        idle_ratio=round(idle_ratio, 1),
        paste_ratio=round(paste_ratio, 1),
    )


def compute_score(metrics: MetricBreakdown) -> float:
    """
    Compute the weighted cognitive load score (0–100).

    S = w1·SwitchRate + w2·ErrorRate + w3·UndoRate + w4·IdleRatio + w5·PasteRatio
    """
    raw_score = (
        WEIGHT_SWITCH_RATE * metrics.switch_rate +
        WEIGHT_ERROR_RATE  * metrics.error_rate +
        WEIGHT_UNDO_RATE   * metrics.undo_rate +
        WEIGHT_IDLE_RATIO  * metrics.idle_ratio +
        WEIGHT_PASTE_RATIO * metrics.paste_ratio
    )
    return _clamp(round(raw_score, 1))


def classify_state(score: float) -> CognitiveState:
    """
    Map a cognitive load score to one of the four states.

      0–30:  Flow      (🟢 green)
      31–60: Friction  (🟡 yellow)
      61–80: Fatigue   (🟠 orange)
      81–100: Overload (🔴 red)
    """
    if score <= THRESHOLD_FLOW_MAX:
        return CognitiveState.FLOW
    elif score <= THRESHOLD_FRICTION_MAX:
        return CognitiveState.FRICTION
    elif score <= THRESHOLD_FATIGUE_MAX:
        return CognitiveState.FATIGUE
    else:
        return CognitiveState.OVERLOAD


def should_shift_theme(score: float) -> bool:
    """Whether the score warrants a warm-amber theme shift."""
    return score >= THRESHOLD_THEME_SHIFT


class CognitiveScorer:
    """
    Stateful scorer that maintains an exponential moving average (EMA)
    across snapshots for smooth, non-jittery score transitions.

    Usage:
        scorer = CognitiveScorer()
        report = scorer.score(snapshot)
    """

    def __init__(self) -> None:
        self._ema_score: float | None = None

    def score(self, snapshot: BehavioralSnapshot) -> CognitiveReport:
        """
        Score a behavioral snapshot and return a full cognitive report.

        If the developer is mostly inactive (< MIN_KEYSTROKES_FOR_SCORING),
        we return a neutral "flow" state instead of scoring on noise.
        """
        # ── Handle low-activity snapshots gracefully ──
        if snapshot.keystrokes < MIN_KEYSTROKES_FOR_SCORING:
            return self._neutral_report()

        # ── Layer A: Compute normalized metrics ──
        metrics = compute_metrics(snapshot)

        # ── Compute raw score ──
        raw_score = compute_score(metrics)

        # ── Apply EMA smoothing ──
        if self._ema_score is None:
            smoothed_score = raw_score
        else:
            smoothed_score = round(
                EMA_ALPHA * raw_score + (1 - EMA_ALPHA) * self._ema_score, 1
            )
        self._ema_score = smoothed_score

        # ── Classify state ──
        state = classify_state(smoothed_score)
        theme_shift = should_shift_theme(smoothed_score)

        return CognitiveReport(
            score=smoothed_score,
            state=state,
            theme_shift=theme_shift,
            intervention=None,  # LLM fills this in later (Feature #9)
            metrics=metrics,
        )

    def reset(self) -> None:
        """Reset the EMA history (e.g., on session reset)."""
        self._ema_score = None

    @property
    def last_score(self) -> float | None:
        """The most recent smoothed score, or None if no snapshots scored yet."""
        return self._ema_score

    def _neutral_report(self) -> CognitiveReport:
        """Return a calm, neutral report for low-activity periods."""
        neutral_metrics = MetricBreakdown(
            switch_rate=0, error_rate=0, undo_rate=0,
            idle_ratio=0, paste_ratio=0,
        )
        # Gently decay the EMA toward 0 during idle periods
        if self._ema_score is not None:
            self._ema_score = round(self._ema_score * 0.8, 1)

        return CognitiveReport(
            score=self._ema_score or 0.0,
            state=classify_state(self._ema_score or 0.0),
            theme_shift=False,
            intervention=None,
            metrics=neutral_metrics,
        )


def reset_scorer(scorer: CognitiveScorer) -> None:
    """Convenience function to reset the scorer from outside."""
    scorer.reset()

def get_last_score(scorer: CognitiveScorer) -> float | None:
    """Convenience function to get the last smoothed score from outside."""
    return scorer.last_score

