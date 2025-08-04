from datetime import datetime
from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

# ---------------- Shared ----------------
class QuestionOption(BaseModel):
    id: int
    text: str
    correct: bool = Field(False, description="Is this the right answer?")


class QuestionMessages(BaseModel):
    correct: str
    wrong: str


# ---------------- Steps ----------------
class QuestionStep(BaseModel):
    type: Literal["question"] = "question"
    step: int
    question: str
    timeLimit: int
    messages: QuestionMessages
    options: List[QuestionOption]


class PlayerMini(BaseModel):
    id: Union[int, str]
    name: str
    photo: str


class PlayerStats(BaseModel):
    wins: int
    losses: int
    rating: int


class Opponent(PlayerMini):
    stats: PlayerStats


class ChallengeStep(BaseModel):
    type: Literal["challenge"] = "challenge"
    step: int
    challengeId: str
    player: PlayerMini
    opponents: List[Opponent]

class GameMetaResponse(BaseModel):
    gameId: str
    title: str | None = None
    description: str | None = None
    total: int
    started: bool | None = None
    createdAt: datetime | None = None

class StepPatch(BaseModel):
    # all fields optional
    question: str | None = None
    timeLimit: int | None = None
    options: list[QuestionOption] | None = None
    player: dict | None = None
    opponents: list[dict] | None = None

StepResponse = Union[QuestionStep, ChallengeStep]

# ---------------- Game meta ----------------
# add `challengeSteps` and make `challengeEvery` optional (or drop it)
class StartGameResponse(BaseModel):
    gameId: str
    total: int
    challengeSteps: List[int]
    challengeEvery: int | None = None   # keep for backward compatibility



class DescriptionResponse(BaseModel):
    gameId: str
    title: str
    description: str


class ConfirmChallengeRequest(BaseModel):
    gameId: str
    step: int
    opponentId: Union[int, str]


class ConfirmChallengeResponse(BaseModel):
    ok: bool
    message: str


class PlayerInfoResponse(BaseModel):
    strength: int
    agility: int
    intelligence: int