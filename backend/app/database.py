"""Async MongoDB connection util (Motor)."""
import os
from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("MONGO_DB", "quizgame")

@lru_cache
def get_client() -> AsyncIOMotorClient:
    return AsyncIOMotorClient(MONGO_URL)


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[DB_NAME]
