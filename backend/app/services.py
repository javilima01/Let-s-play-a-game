"""Object‑oriented wrapper around Mongo collections."""
from typing import List, Union, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from .schemas import (
    DescriptionResponse, PlayerInfoResponse, QuestionStep, ChallengeStep,
)


class GameService:
    """Each request gets its own service instance (DB dependency injected)."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    # ----------------------------------------------------------
    # Helpers
    # ----------------------------------------------------------
    @staticmethod
    def _strip_id(doc: dict | None) -> dict | None:
        if doc and "_id" in doc:
            doc.pop("_id")
        return doc

    # ----------------------------------------------------------
    # Description / banners
    # ----------------------------------------------------------
    async def get_description(self, game_id: str) -> DescriptionResponse | None:
        doc = await self.db.descriptions.find_one({"gameId": game_id})
        doc = self._strip_id(doc)
        return DescriptionResponse(**doc) if doc else None

    async def get_rotating_messages(self) -> List[str]:
        cur = self.db.messages.find({}, {"_id": 0, "text": 1})
        return [doc["text"] async for doc in cur]

    # ----------------------------------------------------------
    # Players
    # ----------------------------------------------------------
    async def get_player_info(self, player_id: str) -> PlayerInfoResponse | None:
        doc = await self.db.players.find_one({"id": player_id})
        doc = self._strip_id(doc)
        return PlayerInfoResponse(**doc["stats"]) if doc else None

    # ----------------------------------------------------------
    # Game meta & steps
    # ----------------------------------------------------------
    async def get_total_steps(self, game_id: str) -> int | None:
        doc = await self.db.games.find_one({"gameId": game_id}, {"_id": 0, "total": 1})
        return doc["total"] if doc else None

    async def get_step(self, game_id: str, step: int) -> QuestionStep | ChallengeStep | None:
        doc = await self.db.steps.find_one({"gameId": game_id, "step": step})
        doc = self._strip_id(doc)
        if not doc:
            return None
        if doc["type"] == "question":
            return QuestionStep(**doc)
        return ChallengeStep(**doc)