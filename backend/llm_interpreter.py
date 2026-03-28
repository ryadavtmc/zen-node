# =============================================================================
# ZenNode Backend — LLM Interpreter (Layer B)
#
# When the developer's cognitive load score hits the Red Zone (≥ 80),
# this module calls an LLM to generate a short, supportive, context-aware
# intervention message.
#
# Design principles:
#   - ONLY called in Red Zone (score ≥ THRESHOLD_LLM_TRIGGER)
#   - Uses OpenAI-compatible API (works with Groq, OpenAI, Ollama, Together)
#   - NEVER sends source code — only behavioral metadata
#   - Responses are short (1–2 sentences), warm, non-judgmental
#   - Graceful degradation: if LLM fails, returns None (deterministic Layer A still works)
#   - Cooldown to avoid hammering the API every 30s during sustained overload
#
# Grounded in CBT (Cognitive Behavioral Therapy) reframing principles:
#   Instead of "you're failing" → "this is complex, let's simplify"
# =============================================================================

from __future__ import annotations

import os
import time
import asyncio
from typing import Optional

from openai import AsyncOpenAI

from models import BehavioralSnapshot, CognitiveReport


# ── Cooldown ─────────────────────────────────────────────────────────────────
# Don't call the LLM more than once per 3 minutes during sustained overload.
LLM_COOLDOWN_SECONDS = 180


# ── System Prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are ZenNode, a compassionate mental health companion embedded inside a developer's code editor. Your role is to gently support developers when their cognitive load is critically high.

CONTEXT: You will receive behavioral metadata from the developer's coding session — things like tab-switching frequency, error correction rate, undo frequency, idle time, and paste patterns. You NEVER see their actual source code.

YOUR TASK: Generate a short, warm, supportive message (1–2 sentences max) that:
1. Acknowledges what you observe without judgment (e.g., "You've been switching between files a lot")
2. Offers a gentle, actionable suggestion (e.g., "Try focusing on just one file for the next few minutes")
3. Uses a calm, friendly, slightly informal tone — like a caring colleague, not a therapist

RULES:
- NEVER be condescending, preachy, or clinical
- NEVER say "take a break" directly — instead suggest specific micro-actions
- NEVER reference specific code, files, or technical problems (you can't see them)
- Keep it under 30 words
- Use one emoji at most
- Vary your responses — don't repeat the same message pattern
- Ground suggestions in one of: breathing, simplifying, slowing down, or celebrating small wins

EXAMPLES OF GOOD RESPONSES:
- "You've been correcting a lot of code — that's mentally taxing. Try re-reading the last function slowly before editing more. 🧘"
- "Heavy context-switching detected. What if you close all tabs except the one that matters most right now?"
- "Your brain's been working overtime. A 60-second breathing pause could reset your focus. Want to try?"
- "Lots of undo actions — you might be second-guessing yourself. Trust your instincts on this one. 💪"
- "You've been pasting and editing heavily. Consider writing the next 10 lines from scratch — it might flow easier."
"""


# =============================================================================
# LLM Interpreter Class
# =============================================================================

class LLMInterpreter:
    """
    Generates supportive intervention messages using an LLM when the
    developer's cognitive load enters the Red Zone.

    Usage:
        interpreter = LLMInterpreter()
        if interpreter.is_available:
            msg = await interpreter.interpret(snapshot, report)
    """

    def __init__(self) -> None:
        self._api_key: str = os.getenv("LLM_API_KEY", "")
        self._model: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
        self._base_url: str = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
        self._enabled: bool = os.getenv("LLM_ENABLED", "false").lower() == "true"
        self._last_call_time: float = 0.0
        self._last_intervention: Optional[str] = None
        self._client: Optional[AsyncOpenAI] = None

        if self._enabled and self._api_key:
            self._client = AsyncOpenAI(
                api_key=self._api_key,
                base_url=self._base_url,
            )
            print(f"   🤖 LLM Interpreter active: model={self._model}, provider={self._base_url}")
        else:
            reason = "disabled" if not self._enabled else "no API key"
            print(f"   🤖 LLM Interpreter inactive ({reason}). Layer A only.")

    # ── Properties ───────────────────────────────────────────────────────────

    @property
    def is_available(self) -> bool:
        """Whether the LLM interpreter is configured and enabled."""
        return self._client is not None and self._enabled

    @property
    def is_on_cooldown(self) -> bool:
        """Whether we're within the cooldown window since last LLM call."""
        return (time.time() - self._last_call_time) < LLM_COOLDOWN_SECONDS

    @property
    def last_intervention(self) -> Optional[str]:
        """The most recent intervention message (for reuse during cooldown)."""
        return self._last_intervention

    # ── Main API ─────────────────────────────────────────────────────────────

    async def interpret(
        self,
        snapshot: BehavioralSnapshot,
        report: CognitiveReport,
    ) -> Optional[str]:
        """
        Generate a supportive intervention message based on behavioral data.

        Returns:
            A short supportive message string, or None if:
            - LLM is not available
            - We're on cooldown (returns cached last_intervention instead)
            - The API call fails
        """
        if not self.is_available:
            return None

        # During cooldown, return the cached message (still helpful, avoids API spam)
        if self.is_on_cooldown:
            return self._last_intervention

        # Build the behavioral context for the LLM
        user_message = self._build_context(snapshot, report)

        try:
            response = await asyncio.wait_for(
                self._call_llm(user_message),
                timeout=10.0,  # 10s hard timeout
            )

            if response:
                self._last_call_time = time.time()
                self._last_intervention = response
                return response
            else:
                return None

        except asyncio.TimeoutError:
            print("[ZenNode LLM] ⚠️ LLM call timed out (10s). Skipping intervention.")
            return None
        except Exception as e:
            print(f"[ZenNode LLM] ⚠️ LLM call failed: {e}")
            return None

    # ── Private: LLM Call ────────────────────────────────────────────────────

    async def _call_llm(self, user_message: str) -> Optional[str]:
        """Make the actual API call to the LLM."""
        if not self._client:
            return None

        completion = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            max_tokens=100,       # Short responses only
            temperature=0.8,      # Some creativity in messages
            top_p=0.9,
        )

        choice = completion.choices[0] if completion.choices else None
        if choice and choice.message and choice.message.content:
            return choice.message.content.strip()
        return None

    # ── Private: Context Builder ─────────────────────────────────────────────

    @staticmethod
    def _build_context(
        snapshot: BehavioralSnapshot,
        report: CognitiveReport,
    ) -> str:
        """
        Build a concise behavioral context string for the LLM.
        NEVER includes source code — only metadata about behavior.
        """
        duration_sec = snapshot.duration_ms / 1000
        m = report.metrics

        # Identify the top 2 stress drivers
        metric_scores = {
            "context-switching": m.switch_rate,
            "error correction (backspacing)": m.error_rate,
            "undo actions (decision reversal)": m.undo_rate,
            "idle time (disengagement)": m.idle_ratio,
            "copy-paste without editing": m.paste_ratio,
        }
        sorted_metrics = sorted(metric_scores.items(), key=lambda x: x[1], reverse=True)
        top_drivers = [f"{name} ({score:.0f}/100)" for name, score in sorted_metrics[:2] if score > 30]

        context_parts = [
            f"Cognitive load score: {report.score:.0f}/100 (state: {report.state.value})",
            f"Time window: {duration_sec:.0f} seconds",
            f"Keystrokes: {snapshot.keystrokes}, Backspaces: {snapshot.backspaces}",
            f"Tab switches: {snapshot.tab_switches}, Undos: {snapshot.undos}",
            f"Idle time: {snapshot.idle_ms / 1000:.0f}s out of {duration_sec:.0f}s",
            f"Pasted chars: {snapshot.pasted_chars} out of {snapshot.total_chars} total chars",
        ]

        if top_drivers:
            context_parts.append(f"Top stress drivers: {', '.join(top_drivers)}")

        return "\n".join(context_parts)

    # ── Reset ────────────────────────────────────────────────────────────────

    def reset(self) -> None:
        """Reset cooldown and cached intervention on session reset."""
        self._last_call_time = 0.0
        self._last_intervention = None

