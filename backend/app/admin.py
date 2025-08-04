# app/admin.py  (new file)
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Body, Path, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from .services import GameService
from .schemas import GameMetaResponse, StepPatch, StepResponse  # create small Pydantic models

from .database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

def svc(db: AsyncIOMotorDatabase = Depends(get_db)) -> GameService:
    return GameService(db)

# ─── Games ───────────────────────────────────────────────────
@router.get("/games", response_model=List[GameMetaResponse])
async def list_games(service: GameService = Depends(svc)):
    return await service.list_games()

@router.post("/games", status_code=status.HTTP_201_CREATED)
async def create_game(
    payload: dict = Body({}),   # {title?, description?, total?, ...}
    service: GameService = Depends(svc),
):
    data = await service.create_blank_game(payload)
    return data  # { gameId, title, description }

# ─── Steps ───────────────────────────────────────────────────
@router.get("/steps/{game_id}", response_model=List[StepResponse])
async def steps(game_id: str, service: GameService = Depends(svc)):
    return await service.get_all_steps(game_id)

@router.post("/steps/{game_id}", response_model=StepResponse, status_code=201)
async def add_step(game_id: str, step: StepResponse, service: GameService = Depends(svc)):
    return await service.add_step(game_id, step.model_dump())

@router.put("/steps/order/{game_id}", status_code=204)
async def reorder(game_id: str, order: List[dict], service: GameService = Depends(svc)):
    await service.reorder_steps(game_id, order)

@router.patch("/steps/{step_id}", response_model=StepResponse)
async def patch_step(
    step_id: str,
    patch: StepPatch = Body(...),
    service: GameService = Depends(svc),
):
    doc = await service.update_step(ObjectId(step_id), patch.model_dump(exclude_none=True))
    if not doc:
        raise HTTPException(404, "Step not found")
    return doc

@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_step(step_id: str, service: GameService = Depends(svc)):
    deleted = await service.delete_step(ObjectId(step_id))
    if not deleted:
        raise HTTPException(404, "Step not found")

@router.put("/games/{game_id}", response_model=GameMetaResponse)
async def update_game(game_id: str, patch: dict = Body(...), service: GameService = Depends(svc)):
    doc = await service.update_game_meta(game_id, patch)
    if not doc:
        raise HTTPException(404, "Game not found")
    return doc