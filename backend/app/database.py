"""Async MongoDB connection util (Motor)."""
import os
from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGO_URL = os.getenv(
    "MONGODB_URI",
    "mongodb://root:example@localhost:27017/?authSource=admin",
)
DB_NAME = "quizduel"


@lru_cache
def get_client() -> AsyncIOMotorClient:
    return AsyncIOMotorClient(MONGO_URL)


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[DB_NAME]
