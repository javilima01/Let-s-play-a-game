# app/admin.py  (new file)
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Body, Path, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from .services import GameService
from .schemas import GameMetaResponse, StepResponse  # create small Pydantic models

from .database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])

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

@router.delete("/games/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    game_id: str = Path(..., description="ID of the game to delete"),
    service: GameService = Depends(svc),
):
    deleted = await service.delete_game(game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Game not found")
    
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
    patch: StepResponse = Body(...),
    service: GameService = Depends(svc),
):
    doc = await service.update_step(StepResponse.step_id, patch.model_dump(exclude_none=True))
    if not doc:
        raise HTTPException(404, "Step not found")
    return doc

@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_step(step_id: str, service: GameService = Depends(svc)):
    deleted = await service.delete_step(step_id)
    if not deleted:
        raise HTTPException(404, "Step not found")

@router.put("/games/{game_id}", response_model=GameMetaResponse)
async def update_game(game_id: str, patch: dict = Body(...), service: GameService = Depends(svc)):
    doc = await service.update_game_meta(game_id, patch)
    if not doc:
        raise HTTPException(404, "Game not found")
    return doc
@router.post(
    "/games/{game_id}/steps/{step_id}/verify",
    response_model=dict,  # e.g. {"clue": "…"}
    status_code=status.HTTP_200_OK,
)
async def verify_step_password(
    game_id: str = Path(..., description="ID of the game"),
    step_id: str = Path(..., description="ID of the step"),
    payload: dict = Body(...),  # expects {"password": "..."}
    service: GameService = Depends(svc),
):
    pwd = payload.get("password")
    if not pwd:
        raise HTTPException(400, "Password is required")

    # this method you’ll implement in your GameService
    is_valid = await service.verify_step_password(game_id, step_id, pwd)
    if not is_valid:
        raise HTTPException(401, "Invalid password")

    if payload.get("return_clue", True):
        # fetch the step so we can return its clue
        step = await service.get_step_by_id(game_id, step_id)
        return {"clue": step.clue}
    return {"is_correct": True}

@router.post("/messages", response_model=List[str])
async def set_rotating_messages(
    messages: List[str],
    service: GameService = Depends(svc),
):
    # you’ll need to implement this in your service
    await service.set_rotating_messages(messages)
    return messages