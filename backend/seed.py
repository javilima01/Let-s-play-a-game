"""
Seed MongoDB with demo data that matches the per-game banner API.

▶ HOW TO RUN
    # 1. Activate your venv (or just `pip install motor` in the global one)
    python seed.py
or
    poetry run python seed.py

▶ ASSUMPTIONS
    • MongoDB is reachable at mongodb://root:example@localhost:27017
    • A single-node replica set named “rs0” is initialised (see docker-compose.yml)
    • Database name is "quizduel"
"""

import asyncio
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from app.database import MONGO_URL, DB_NAME

# ─── SEED DOCUMENTS ───────────────────────────────────────────────────────────
NOW = datetime.now(timezone.utc)

seed_data = {
    # ── Game-specific banners
    "descriptions": [
        {
            "gameId": "9b59e273f9b54bdabdfa7ddc44d5d4ac",
            "title": "¡Feliz Cumpleaños, Demo-001! 🎂",
            "description": (
                "Responde preguntas, reta a tus amigos y acumula puntos "
                "para celebrar por todo lo alto."
            )
        }
    ],
    # ── Game metadata (includes the banner, so admin panels can show it)
    "games": [
        {
            "gameId": "9b59e273f9b54bdabdfa7ddc44d5d4ac",
            "title": "¡Feliz Cumpleaños, Demo-001! 🎂",  # keep in sync
            "description": (
                "Responde preguntas, reta a tus amigos y acumula puntos "
                "para celebrar por todo lo alto."
            ),
            "total": 25,
            "createdAt": NOW,
            "started": False,
            "password": "felicidades"
        }
    ],
    # ── Optional global defaults for *future* games created via POST /games
    "config": [
        {"key": "game", "total": 25},
    ],
    # ── Rotating ticker messages
    "messages": [
        {"text": "🚀 Sabías que: Mateo levanta 100 kg en press banca"},
        {"text": "✨ Sabías que: El 21 de julio, Marcela y Alejandro empezaron a salir"},
        {"text": "📢 ¡Cuidado, que Javier está tenso!"},
        {"text": "🎉 ¡Feliz Cumpleaños!"},
    ],
    # ── Players
    "players": [
        {
            "id": 1,
            "name": "Alex",
            "photo": "/assets/milo.png",
            "stats": {"strength": 74, "agility": 61, "intelligence": 49},
        },
        {
            "id": 2,
            "name": "Sam",
            "photo": "/assets/milo.png",
            "stats": {"strength": 55, "agility": 83, "intelligence": 70},
        },
        {
            "id": "me",
            "name": "You",
            "photo": "/assets/me.png",
            "stats": {"strength": 68, "agility": 65, "intelligence": 66},
        },
    ],
    # ── Steps for the demo game (step index is 0-based here)
    "steps": [
        # Step 0 – normal question
        {
            "gameId": "9b59e273f9b54bdabdfa7ddc44d5d4ac",
            "stepId": "demo-001-question-0",
            "step": 0,
            "type": "question",
            "question": (
                "¿Cuál es la respuesta a la vida, el universo "
                "y todo lo demás?"
            ),
            "timeLimit": 15_000,
            "messages": {
                "correct": "¡Exacto! 42 siempre es la clave.",
                "wrong": "Ups… inténtalo de nuevo.",
            },
            "options": [
                {"id": 1, "text": "42", "correct": True},
                {"id": 2, "text": "24", "correct": False},
                {"id": 3, "text": "13", "correct": False},
                {"id": 4, "text": "0",  "correct": False},
            ],
        },
        # Step 1 – first challenge
        {
            "gameId": "9b59e273f9b54bdabdfa7ddc44d5d4ac",
            "stepId": "demo-001-challenge-1",
            "step": 1,
            "type": "challenge",
            "clue": "¿A quién desafiarás en esta ronda?",
            "challenge_action": "desafiar",
        },
    ],
}

# ─── SEED SCRIPT ──────────────────────────────────────────────────────────────
async def main() -> None:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    for collection, docs in seed_data.items():
        if not docs:
            continue
        count = await db[collection].count_documents({})
        print(f"🔄  {collection}: clearing {count} old documents…")
        await db[collection].delete_many({})

        print(f"⏳  inserting {len(docs)} new documents…")
        await db[collection].insert_many(docs)

    print("✅  Seed complete.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
