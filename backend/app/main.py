"""FastAPI entry – depends on the `GameService` class rather than free functions."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, Depends, HTTPException, Body, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from .admin import router as admin_router
from .database import get_db
from .services import GameService
from .schemas import (
    DescriptionResponse,
    StartGameResponse,
    StepResponse,
    PlayerInfoResponse,
    ConfirmChallengeRequest,
    ConfirmChallengeResponse,
)

# ────────────────────────────────────────────────
# Dependency wiring
# ────────────────────────────────────────────────


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> GameService:
    """Factory so each request gets its own GameService instance."""
    return GameService(db)

# ────────────────────────────────────────────────
# App factory
# ────────────────────────────────────────────────


def create_app() -> FastAPI:
    app = FastAPI(title="Quiz Duel API", version="0.4.0")
    app.include_router(admin_router)      # ← one line
    # CORS for Vite dev server + preview / prod origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ───────────────────────────────────────
    # Meta endpoints
    # ───────────────────────────────────────
    @app.get("/description/{game_id}", response_model=DescriptionResponse)
    async def game_description(game_id: str, svc: GameService = Depends(get_service)):
        doc = await svc.get_description(game_id)
        if not doc:
            raise HTTPException(404, "Description not found")
        return doc

    # @app.post("/games", response_model=CreateGameResponse, status_code=201)
    # async def create_game(svc: GameService = Depends(get_service)):
    #     cfg = await svc.get_game_config()

    #     # 2. Generate banner text — here we just random-pick but you can do anything
    #     title, description = await svc.generate_banner_text()

    #     game_id = uuid.uuid4().hex
    #     await svc.insert_game(
    #         game_id=game_id,
    #         title=title,                    # NEW
    #         description=description,        # NEW
    #         total=cfg.total,
    #         challenge_every=cfg.challenge_every,
    #         created_at=datetime.now(timezone.utc),
    #     )

    #     # Also save banner into its own collection so other endpoints can reuse it
    #     await svc.insert_description(game_id, title, description)       # NEW

    #     return {
    #         "gameId": game_id,
    #         "title": title,
    #         "description": description,
    #     }


    @app.get("/messages", response_model=List[str])
    async def rotating_messages(svc: GameService = Depends(get_service)):
        return await svc.get_rotating_messages()

    # ───────────────────────────────────────
    # Gameplay endpoints
    # ───────────────────────────────────────
    @app.post("/start/{game_id}", response_model=StartGameResponse)
    async def start_game(game_id: str, svc: GameService = Depends(get_service)):
        meta = await svc.get_game_meta(game_id)
        if not meta:
            raise HTTPException(404, "Game not found")

        # NEW: ask the DB which steps are challenges
        challenge_steps = await svc.get_challenge_steps(game_id)

        await svc.mark_game_started(game_id)

        return StartGameResponse(
            gameId=game_id,
            total=meta.total,
            challengeSteps=challenge_steps,
            # challengeEvery left here only so the front-end won’t break
            challengeEvery=getattr(meta, "challenge_every", None),
        )

    @app.get("/step/{game_id}/{step}", response_model=StepResponse)
    async def step(game_id: str, step: int, svc: GameService = Depends(get_service)):
        doc = await svc.get_step(game_id, step)
        if not doc:
            raise HTTPException(404, "Step not found")
        return doc

    @app.get("/player/{player_id}", response_model=PlayerInfoResponse)
    async def player(player_id: str, svc: GameService = Depends(get_service)):
        info = await svc.get_player_info(player_id)
        if not info:
            raise HTTPException(404, "Player not found")
        return info

    @app.post(
        "/challenge/confirm",
        response_model=ConfirmChallengeResponse,
        status_code=status.HTTP_200_OK,
    )
    async def confirm_challenge(
        payload: ConfirmChallengeRequest = Body(...),
        svc: GameService = Depends(get_service),
    ):
        ok, msg = await svc.confirm_challenge(
            payload.gameId, payload.step, payload.opponentId
        )
        return ConfirmChallengeResponse(ok=ok, message=msg)

    return app
