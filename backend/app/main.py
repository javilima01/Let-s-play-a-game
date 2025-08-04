"""FastAPI entry – depends on the `GameService` class rather than free functions."""
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import random

from .database import get_db
from .services import GameService
from .schemas import (
    DescriptionResponse, StartGameResponse, StepResponse,
    PlayerInfoResponse, ConfirmChallengeRequest, ConfirmChallengeResponse,
)
from motor.motor_asyncio import AsyncIOMotorDatabase

# --------------------------------------------------------------
# Dependency wiring
# --------------------------------------------------------------

def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> GameService:
    return GameService(db)

# --------------------------------------------------------------
# App factory
# --------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(title="Quiz Duel API (Mongo + OO)", version="0.3.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ------------------------------------------------------
    # Routes
    # ------------------------------------------------------
    @app.get("/description", response_model=DescriptionResponse)
    async def get_description(svc: GameService = Depends(get_service)):
        doc = await svc.get_description("demo-001")
        if not doc:
            raise HTTPException(status_code=404, detail="Description not found")
        return doc

    @app.post("/start/{game_id}", response_model=StartGameResponse)
    async def start_game(game_id: str, svc: GameService = Depends(get_service)):
        total = await svc.get_total_steps(game_id)
        if total is None:
            raise HTTPException(status_code=404, detail="Game not found")
        return StartGameResponse(gameId=game_id, total=total)

    @app.get("/messages", response_model=List[str])
    async def messages(svc: GameService = Depends(get_service)):
        return await svc.get_rotating_messages()

    @app.get("/step/{game_id}/{step}", response_model=StepResponse)
    async def step(game_id: str, step: int, svc: GameService = Depends(get_service)):
        doc = await svc.get_step(game_id, step)
        if not doc:
            raise HTTPException(status_code=404, detail="Step not found")
        return doc

    @app.get("/player/{player_id}", response_model=PlayerInfoResponse)
    async def player(player_id: str, svc: GameService = Depends(get_service)):
        info = await svc.get_player_info(player_id)
        if not info:
            raise HTTPException(status_code=404, detail="Player not found")
        return info

    @app.post("/challenge/confirm", response_model=ConfirmChallengeResponse)
    async def confirm(payload: ConfirmChallengeRequest = Body(...)):
        # domain service would live elsewhere – left random for demo
        ok = random.random() > 0.15
        return ConfirmChallengeResponse(ok=ok, message="Referee says ✔️" if ok else "Referee says ❌ – pick again")

    return app