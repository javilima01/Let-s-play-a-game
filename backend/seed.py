import asyncio
from app.database import get_db


data = {
    "descriptions": [
        {"gameId": "demo-001", "title": "Feliz Cumpleaños!!", "description": "…"},
    ],
    "messages": [
        {"text": "🚀 Sabías que: Mateo es capaz de levantar 100kg en press banca"},
        {"text": "✨ Sabías que: El 21 de Julio, Marcela y Alejandro empezaron a salir"},
        {"text": "📢 Cuidado que Javier está tenso!"},
        {"text": "🎉 Feliz Cumpleaños!!!"},
    ],
    "players": [
        {"id": 1, "name": "Alex", "photo": "/assets/milo.png", "stats": {"strength": 74, "agility": 61, "intelligence": 49}},
        {"id": 2, "name": "Sam", "photo": "/assets/milo.png", "stats": {"strength": 55, "agility": 83, "intelligence": 70}},
        {"id": "me", "name": "You", "photo": "/assets/me.png", "stats": {"strength": 68, "agility": 65, "intelligence": 66}},
    ],
    "games": [
        {"gameId": "demo-001", "total": 25},
    ],
    "steps": [
        # step 0 – question
        {
            "gameId": "demo-001", "step": 0, "type": "question",
            "question": "Sample Question 1: What is the answer to life?",
            "timeLimit": 15000,
            "messages": {"correct": "Nice job! 42 is indeed the answer…", "wrong": "Oops – that wasn't it…"},
            "options": [
                {"id": 1, "text": "42", "correct": True},
                {"id": 2, "text": "24", "correct": False},
                {"id": 3, "text": "13", "correct": False},
                {"id": 4, "text": "0", "correct": False},
            ],
        },
        # step 4 – challenge
        {
            "gameId": "demo-001", "step": 4, "type": "challenge",
            "challengeId": "demo-001-4",
            "player": {"id": "me", "name": "You", "photo": "/assets/me.png"},
            "opponents": [
                {"id": 1, "name": "Alex", "photo": "/assets/milo.png", "stats": {"wins": 12, "losses": 3, "rating": 1480}},
                {"id": 2, "name": "Sam", "photo": "/assets/milo.png", "stats": {"wins": 22, "losses": 8, "rating": 1585}},
            ],
        },
    ],
}

async def main():
    db = get_db()
    for col, docs in data.items():
        if docs:
            await db[col].delete_many({})
            await db[col].insert_many(docs)
    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(main())