# =============================================================================
# ZenNode Backend — Pydantic Models
# Data structures for API request/response, mirroring the TypeScript types.
# =============================================================================

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class CognitiveState(str, Enum):
    """The four cognitive states ZenNode can classify."""
    FLOW = "flow"
    FRICTION = "friction"
    FATIGUE = "fatigue"
    OVERLOAD = "overload"


class BehavioralSnapshot(BaseModel):
    """
    Raw behavioral data received from the VS Code extension.
    Sent every sample interval (default 30s).

    PRIVACY: Contains behavioral metadata ONLY — never source code content.
    """
    keystrokes: int = Field(ge=0, description="Total keystrokes in the sample window")
    backspaces: int = Field(ge=0, description="Number of backspace/delete presses")
    tab_switches: int = Field(ge=0, alias="tabSwitches", description="Number of tab/editor switches")
    undos: int = Field(ge=0, description="Number of undo actions")
    idle_ms: int = Field(ge=0, alias="idleMs", description="Total idle milliseconds")
    pasted_chars: int = Field(ge=0, alias="pastedChars", description="Characters pasted")
    total_chars: int = Field(ge=0, alias="totalChars", description="Total characters produced")
    duration_ms: int = Field(gt=0, alias="durationMs", description="Sample window duration in ms")
    timestamp: str = Field(description="ISO 8601 timestamp of snapshot")

    model_config = {"populate_by_name": True}


class MetricBreakdown(BaseModel):
    """Individual metric scores, each normalized to 0–100."""
    switch_rate: float = Field(ge=0, le=100, alias="switchRate")
    error_rate: float = Field(ge=0, le=100, alias="errorRate")
    undo_rate: float = Field(ge=0, le=100, alias="undoRate")
    idle_ratio: float = Field(ge=0, le=100, alias="idleRatio")
    paste_ratio: float = Field(ge=0, le=100, alias="pasteRatio")

    model_config = {"populate_by_name": True}


class CognitiveReport(BaseModel):
    """
    Response sent back to the VS Code extension after scoring a snapshot.
    Contains the score, state classification, and optional LLM intervention.
    """
    score: float = Field(ge=0, le=100, description="Cognitive load score 0–100")
    state: CognitiveState = Field(description="Classified cognitive state")
    theme_shift: bool = Field(alias="themeShift", description="Whether to shift to warm theme")
    intervention: Optional[str] = Field(
        default=None,
        description="LLM-generated supportive message (null if not in red zone)"
    )
    metrics: MetricBreakdown = Field(description="Breakdown of individual metric scores")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class HealthResponse(BaseModel):
    """Health check endpoint response."""
    status: str = "ok"
    service: str = "zennode-cognitive-engine"
    version: str = "0.1.0"
