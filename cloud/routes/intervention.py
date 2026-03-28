# =============================================================================
# ZenNode Cloud — LLM Intervention Route
# POST /api/v1/intervention
#
# Called by the VS Code extension when score ≥ criticalThreshold.
# Returns a short CBT-grounded supportive message. Auth required.
# =============================================================================

from fastapi import APIRouter, Depends

from auth import get_current_user
from llm_interpreter import get_intervention, is_available
from models import User
from schemas import InterventionRequest, InterventionResponse

router = APIRouter(prefix="/api/v1", tags=["Intervention"])


@router.post("/intervention", response_model=InterventionResponse)
async def request_intervention(
    body: InterventionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate a supportive LLM intervention for a developer in the Red Zone.
    Uses the user's anonymous_id for per-user cooldown tracking.
    Returns null intervention if LLM is disabled or on cooldown.
    """
    if not is_available():
        return InterventionResponse(intervention=None)

    message = await get_intervention(
        anonymous_id    = current_user.anonymous_id,
        score           = body.score,
        state           = body.state,
        switch_rate     = body.switch_rate,
        error_rate      = body.error_rate,
        undo_rate       = body.undo_rate,
        idle_ratio      = body.idle_ratio,
        paste_ratio     = body.paste_ratio,
        keystrokes      = body.keystrokes,
        backspaces      = body.backspaces,
        tab_switches    = body.tab_switches,
        undos           = body.undos,
        idle_seconds    = body.idle_seconds,
        duration_seconds= body.duration_seconds,
        pasted_chars    = body.pasted_chars,
        total_chars     = body.total_chars,
    )

    return InterventionResponse(intervention=message)
