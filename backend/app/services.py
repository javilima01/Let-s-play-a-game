"""Object-oriented wrapper around Mongo collections."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Union
import uuid

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from .schemas import (
    DescriptionResponse,
    PlayerInfoResponse,
    QuestionStep,
    ChallengeStep,
)

# ─────────────────────────────────────────────────────────────
# Data helpers
# ─────────────────────────────────────────────────────────────
class GameConfig:
    """Plain helper so we don't import Pydantic on the hot path."""
    def __init__(self, total: int) -> None:
        self.total = total


class GameMeta(GameConfig):
    def __init__(self, game_id: str, total: int) -> None:
        super().__init__(total)
        self.game_id = game_id


# ─────────────────────────────────────────────────────────────
# Service
# ─────────────────────────────────────────────────────────────
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

    async def get_description(self, game_id: str) -> DescriptionResponse | None:
        """
        Front-end **won’t** call this on the landing page anymore (createGame
        already gives title/desc), but other parts of the app might.
        """
        doc = await self.db.games.find_one({"gameId": game_id})
        print(doc)
        return DescriptionResponse(gameId=doc.get("gameId"), title=doc.get("title"), description=doc.get("description")) if doc else None

    async def get_rotating_messages(self) -> List[str]:
        cur = self.db.messages.find({}, {"_id": 0, "text": 1})
        return [doc["text"] async for doc in cur]

    # ----------------------------------------------------------
    # Players
    # ----------------------------------------------------------
    async def get_player_info(self, player_id: str) -> PlayerInfoResponse | None:
        # 🔑 cast "1" → 1, leave "me" as str
        key: str | int = int(player_id) if player_id.isdigit() else player_id

        doc = await self.db.players.find_one({"id": key})
        if not doc:
            return None
        doc = self._strip_id(doc)
        # ① If your Pydantic model expects the full object:
        return PlayerInfoResponse(**doc["stats"])
    # ----------------------------------------------------------
    # Game meta & lifecycle
    # ----------------------------------------------------------
    async def get_game_config(self) -> GameConfig:  # NEW
        """
        Reads the canonical defaults from `config` collection.
        """
        cfg = await self.db.config.find_one({"key": "game"}, {"_id": 0}) or {}
        total = int(cfg.get("total", 20))
        return GameConfig(total)

    async def insert_game(
        self,
        game_id: str,
        title: str,
        description: str,
        total: int,
        created_at: datetime,
    ):
        await self.db.games.insert_one(
            {
                "gameId": game_id,
                "title": title,                 # NEW
                "description": description,     # NEW
                "total": total,
                "createdAt": created_at,
                "started": False,
            }
        )

    async def get_game_meta(self, game_id: str) -> GameMeta | None:  # NEW
        doc = await self.db.games.find_one(
            {"gameId": game_id},
            {"_id": 0, "total": 1},
        )
        return (
            GameMeta(game_id, doc["total"]) if doc else None
        )

    async def mark_game_started(self, game_id: str):  # NEW
        await self.db.games.update_one(
            {"gameId": game_id},
            {"$set": {"started": True, "startedAt": datetime.now(timezone.utc)}},
        )

    # ----------------------------------------------------------
    # Steps
    # ----------------------------------------------------------
    async def get_total_steps(self, game_id: str) -> int | None:
        doc = await self.db.games.find_one(
            {"gameId": game_id}, {"_id": 0, "total": 1}
        )
        return doc["total"] if doc else None

    async def get_challenge_steps(self, game_id: str) -> list[int]:
        """
        Return a sorted list of step indexes whose docs are type == 'challenge'.
        """
        cur = self.db.steps.find(
            {"gameId": game_id, "type": "challenge"},
            {"_id": 0, "step": 1},
        )
        return sorted([doc["step"] async for doc in cur])
    
    async def get_step(
        self, game_id: str, step: int
    ) -> QuestionStep | ChallengeStep | None:
        doc = await self.db.steps.find_one({"gameId": game_id, "step": step})
        doc = self._strip_id(doc)
        if not doc:
            return None
        return QuestionStep(**doc) if doc["type"] == "question" else ChallengeStep(**doc)

    async def get_step_by_id(
        self, game_id: str, step_id: str
    ) -> QuestionStep | ChallengeStep | None:
        doc = await self.db.steps.find_one({"gameId": game_id, "stepId": step_id})
        doc = self._strip_id(doc)
        if not doc:
            return None
        return QuestionStep(**doc) if doc["type"] == "question" else ChallengeStep(**doc)
    # ----------------------------------------------------------
    # Challenges
    # ----------------------------------------------------------
    async def confirm_challenge(  # NEW
        self, game_id: str, step: int, opponent_id: str
    ) -> tuple[bool, str]:
        """
        Atomically mark the challenge as confirmed.
        """
        res = await self.db.steps.update_one(
            {"gameId": game_id, "step": step, "type": "challenge"},
            {
                "$set": {
                    "confirmedBy": opponent_id,
                    "confirmedAt": datetime.now(timezone.utc),
                }
            },
        )
        ok = res.matched_count == 1
        msg = "Referee says ✔️" if ok else "Referee says ❌ – pick again"
        return ok, msg
    
    async def list_games(self) -> list[dict]:
        cur = self.db.games.find({}, {"_id": 0})        # project only needed fields
        return [doc async for doc in cur]
    
    # ────────────────────────────────────────────────
    # Admin helpers
    # ────────────────────────────────────────────────
    async def get_all_steps(self, game_id: str) -> list[dict]:
        """
        Return every step for a game sorted by `step`.
        """
        cur = self.db.steps.find({"gameId": game_id}).sort("step", 1)
        return [self._strip_id(doc) async for doc in cur]

    async def add_step(self, game_id: str, step_doc: dict) -> dict:
        """
        Insert a new question/challenge. Caller must provide `step`.
        Returns the inserted document with `_id` as str.
        """
        res = await self.db.steps.insert_one({**step_doc, "gameId": game_id})
        saved = await self.db.steps.find_one({"_id": res.inserted_id})
        saved = self._strip_id(saved)
        saved["_id"] = str(res.inserted_id)          # stringify for React
        return saved

    async def reorder_steps(self, game_id: str, moves: list[dict]) -> None:
        """
        `moves` = [{\"_id\": \"...\", \"step\": 0}, …]
        Performs bulk updates so drag-and-drop feels instant.
        """
        from pymongo import UpdateOne
        ops = [
            UpdateOne({"gameId": game_id, "stepId": m["stepId"]},
                      {"$set": {"step": m["step"]}})
            for m in moves
        ]
        if ops:
            await self.db.steps.bulk_write(ops)

    async def create_blank_game(self, payload: dict) -> dict:
        """
        Admin dashboard: create an empty game shell and a matching description.
        """
        cfg = await self.get_game_config()
        game_id = uuid.uuid4().hex
        title = payload.get("title") or "Untitled game"
        desc  = payload.get("description") or "Añade preguntas para empezar."

        await self.insert_game(
            game_id=game_id,
            title=title,
            description=desc,
            total=payload.get("total", cfg.total),
            created_at=datetime.now(timezone.utc),
        )
        # what the admin dashboard expects:
        return {"gameId": game_id, "title": title, "description": desc}

    async def update_step(self, step_id: str, patch: dict) -> dict | None:
        """
        Partial update (PATCH) of a single step.
        Returns the updated doc with _id stripped, or None if not found.
        """
        doc = await self.db.steps.find_one_and_update(
            {"stepId": step_id},
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )
        return self._strip_id(doc) if doc else None

    async def delete_step(self, step_id: str) -> int:
        """
        Delete one step and renumber the remaining steps of the same game.

        Returns
        -------
        int
            1 if a document was deleted, 0 otherwise.
        """
        # 1) fetch the step so we know its game & position
        doc = await self.db.steps.find_one(
            {"stepId": step_id},
            projection={"gameId": 1, "step": 1},
        )
        if not doc:
            return 0

        game_id = doc["gameId"]
        removed_idx = doc["step"]

        # 2) delete that step
        delete_res = await self.db.steps.delete_one({"stepId": step_id})
        if delete_res.deleted_count == 0:
            return 0

        # 3) shift every later step down by 1
        await self.db.steps.update_many(
            {"gameId": game_id, "step": {"$gt": removed_idx}},
            {"$inc": {"step": -1}},
        )

        return delete_res.deleted_count

    async def update_game_meta(self, game_id: str, patch: dict) -> dict | None:
        """
        PUT /admin/games/{id} – title / description / banner etc.
        """
        doc = await self.db.games.find_one_and_update(
            {"gameId": game_id},
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )
        return self._strip_id(doc) if doc else None

    async def delete_game(self, game_id: str) -> bool:
        """
        Deletes a game and all its related data (description + steps).

        Returns
        -------
        bool
            True if the game meta document was found & deleted, False otherwise.
        """
        # 1) remove the game meta
        delete_res = await self.db.games.delete_one({"gameId": game_id})
        if delete_res.deleted_count == 0:
            return False

        # 2) remove any description/banner entry
        await self.db.descriptions.delete_many({"gameId": game_id})

        # 3) remove all steps belonging to this game
        await self.db.steps.delete_many({"gameId": game_id})

        return True
    

    async def verify_step_password(self, game_id: str, step_id: str, pwd: str) -> bool:
        # Fetch the step document from Mongo
        doc = await self.db.games.find_one({"gameId": game_id})
        if not doc:
            return False
        # e.g. plain‐text compare, or hashed compare:
        return doc.get("password") == pwd
    
    async def set_rotating_messages(
        self,
        messages: List[str]
    ) -> List[str]:
        # Remove all existing docs…
        await self.db.messages.delete_many({})
        if messages:
            docs = [{"text": text} for text in messages]
            await self.db.messages.insert_many(docs)
        return messages
