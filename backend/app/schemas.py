from typing import List, Optional, Union
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
    type: str = Field("question", const=True)
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
    type: str = Field("challenge", const=True)
    step: int
    challengeId: str
    player: PlayerMini
    opponents: List[Opponent]


StepResponse = Union[QuestionStep, ChallengeStep]

# ---------------- Game meta ----------------
class StartGameResponse(BaseModel):
    total: int
    gameId: str


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