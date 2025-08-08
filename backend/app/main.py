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
            "*"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ───────────────────────────────────────
    # Meta endpoints
    # ───────────────────────────────────────
    @app.get("/api/description/{game_id}", response_model=DescriptionResponse)
    async def game_description(game_id: str, svc: GameService = Depends(get_service)):
        doc = await svc.get_description(game_id)
        if not doc:
            raise HTTPException(404, "Description not found")
        return doc

    @app.get("/api/messages", response_model=List[str])
    async def rotating_messages(svc: GameService = Depends(get_service)):
        return await svc.get_rotating_messages()

    # ───────────────────────────────────────
    # Gameplay endpoints
    # ───────────────────────────────────────
    @app.post("/api/start/{game_id}", response_model=StartGameResponse)
    async def start_game(game_id: str, svc: GameService = Depends(get_service)):
        # NEW: ask the DB which steps are challenges
        challenge_steps = await svc.get_challenge_steps(game_id)

        await svc.mark_game_started(game_id)

        return StartGameResponse(
            gameId=game_id,
            total=len(challenge_steps),
            challengeSteps=challenge_steps,
        )

    @app.get("/api/step/{game_id}/{step}", response_model=StepResponse)
    async def step(game_id: str, step: int, svc: GameService = Depends(get_service)):
        doc = await svc.get_step(game_id, step)
        if not doc:
            raise HTTPException(404, "Step not found")
        return doc

    @app.get("/api/player/{player_id}", response_model=PlayerInfoResponse)
    async def player(player_id: str, svc: GameService = Depends(get_service)):
        info = await svc.get_player_info(player_id)
        if not info:
            raise HTTPException(404, "Player not found")
        return info

    @app.post(
        "/api/challenge/confirm",
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
