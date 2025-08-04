"""DB helpers – keep queries isolated for easier testing."""
from typing import List, Union
from motor.motor_asyncio import AsyncIOMotorDatabase
from .schemas import (
    DescriptionResponse, PlayerInfoResponse, QuestionStep,
    ChallengeStep, StartGameResponse
)
from bson import ObjectId


aSYNC = Union[QuestionStep, ChallengeStep]

def _strip_id(document: dict | None) -> dict | None:
    if not document:
        return None
    document.pop("_id", None)
    return document

# --------------------------------------------------------------
# Description / banner
# --------------------------------------------------------------
async def get_description(db: AsyncIOMotorDatabase, game_id: str) -> DescriptionResponse | None:
    doc = await db.descriptions.find_one({"gameId": game_id})
    doc = _strip_id(doc)
    if doc:
        return DescriptionResponse(**doc)
    return None

async def get_rotating_messages(db: AsyncIOMotorDatabase) -> List[str]:
    cur = db.messages.find({}, {"_id": 0, "text": 1})
    return [doc["text"] async for doc in cur]

# --------------------------------------------------------------
# Players
# --------------------------------------------------------------
async def get_player_info(db: AsyncIOMotorDatabase, player_id: str) -> PlayerInfoResponse | None:
    doc = await db.players.find_one({"id": player_id})
    doc = _strip_id(doc)
    if doc:
        return PlayerInfoResponse(**doc["stats"])
    return None

# --------------------------------------------------------------
# Game & steps
# --------------------------------------------------------------
async def get_game_total_steps(db: AsyncIOMotorDatabase, game_id: str) -> int | None:
    doc = await db.games.find_one({"gameId": game_id}, {"_id": 0, "total": 1})
    if doc:
        return doc["total"]
    return None

async def get_step(db: AsyncIOMotorDatabase, game_id: str, step: int) -> aSYNC | None:
    doc = await db.steps.find_one({"gameId": game_id, "step": step})
    doc = _strip_id(doc)
    if not doc:
        return None
    if doc["type"] == "question":
        return QuestionStep(**doc)
    else:
        return ChallengeStep(**doc)