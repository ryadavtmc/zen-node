# =============================================================================
# ZenNode Cloud — LLM Interpreter
#
# Generates supportive CBT-grounded intervention messages when a developer's
# cognitive load hits the Red Zone (score ≥ 80).
#
# Privacy: receives only behavioral metrics — never source code.
# Cooldown: 3 minutes per user (keyed by anonymous_id in memory).
# =============================================================================

from __future__ import annotations

import asyncio
import time
from typing import Optional

from openai import AsyncOpenAI

from config import LLM_API_KEY, LLM_MODEL, LLM_BASE_URL, LLM_ENABLED

LLM_COOLDOWN_SECONDS = 180

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

# Per-user cooldown: anonymous_id → last call timestamp
_cooldowns: dict[str, float] = {}

# Shared async client (lazy init)
_client: Optional[AsyncOpenAI] = None


def _get_client() -> Optional[AsyncOpenAI]:
    global _client
    if not LLM_ENABLED or not LLM_API_KEY:
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
    return _client


def is_available() -> bool:
    return LLM_ENABLED and bool(LLM_API_KEY)


def is_on_cooldown(anonymous_id: str) -> bool:
    last = _cooldowns.get(anonymous_id, 0.0)
    return (time.time() - last) < LLM_COOLDOWN_SECONDS


async def get_intervention(
    anonymous_id: str,
    score: float,
    state: str,
    switch_rate: float,
    error_rate: float,
    undo_rate: float,
    idle_ratio: float,
    paste_ratio: float,
    keystrokes: int,
    backspaces: int,
    tab_switches: int,
    undos: int,
    idle_seconds: float,
    duration_seconds: float,
    pasted_chars: int,
    total_chars: int,
) -> Optional[str]:
    """
    Generate a supportive intervention message. Returns None if LLM is
    unavailable, on cooldown, or the API call fails.
    """
    client = _get_client()
    if not client:
        return None

    if is_on_cooldown(anonymous_id):
        return None

    metric_scores = {
        "context-switching": switch_rate,
        "error correction (backspacing)": error_rate,
        "undo actions (decision reversal)": undo_rate,
        "idle time (disengagement)": idle_ratio,
        "copy-paste without editing": paste_ratio,
    }
    top_drivers = [
        f"{name} ({val:.0f}/100)"
        for name, val in sorted(metric_scores.items(), key=lambda x: x[1], reverse=True)[:2]
        if val > 30
    ]

    context_lines = [
        f"Cognitive load score: {score:.0f}/100 (state: {state})",
        f"Time window: {duration_seconds:.0f} seconds",
        f"Keystrokes: {keystrokes}, Backspaces: {backspaces}",
        f"Tab switches: {tab_switches}, Undos: {undos}",
        f"Idle time: {idle_seconds:.0f}s out of {duration_seconds:.0f}s",
        f"Pasted chars: {pasted_chars} out of {total_chars} total chars",
    ]
    if top_drivers:
        context_lines.append(f"Top stress drivers: {', '.join(top_drivers)}")

    user_message = "\n".join(context_lines)

    try:
        completion = await asyncio.wait_for(
            client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_message},
                ],
                max_tokens=100,
                temperature=0.8,
                top_p=0.9,
            ),
            timeout=10.0,
        )
        choice = completion.choices[0] if completion.choices else None
        if choice and choice.message and choice.message.content:
            result = choice.message.content.strip()
            _cooldowns[anonymous_id] = time.time()
            return result
        return None

    except asyncio.TimeoutError:
        print(f"[ZenNode LLM] ⚠️ Timed out for user {anonymous_id[:8]}")
        return None
    except Exception as e:
        print(f"[ZenNode LLM] ⚠️ Failed: {e}")
        return None
