import random
from typing import Dict, List, Union
from .schemas import (
    QuestionStep, QuestionMessages, QuestionOption,
    ChallengeStep, PlayerMini, Opponent, PlayerStats
)

ROTATING_MESSAGES: List[str] = [
    "🚀 Sabías que: Mateo es capaz de levantar 100kg en press banca",
    "✨ Sabías que: El 21 de Julio, Marcela y Alejandro empezaron a salir",
    "📢 Cuidado que Javier está tenso!",
    "🎉 Feliz Cumpleaños!!!",
]

PLAYER_POOL: Dict[Union[int, str], Dict[str, int]] = {
    1: dict(strength=74, agility=61, intelligence=49),
    2: dict(strength=55, agility=83, intelligence=70),
    "me": dict(strength=68, agility=65, intelligence=66),
}

def sample_question(step: int) -> QuestionStep:
    return QuestionStep(
        question=f"Sample Question {step + 1}: What is the answer to life?",
        timeLimit=15000,
        messages=QuestionMessages(
            correct="Nice job! 42 is indeed the answer to life, the universe and everything.",
            wrong="Oops – that wasn't it. Remember your Hitchhiker's lore!"
        ),
        options=[
            QuestionOption(id=1, text="42", correct=True),
            QuestionOption(id=2, text="24", correct=False),
            QuestionOption(id=3, text="13", correct=False),
            QuestionOption(id=4, text="0", correct=False),
        ]
    )


def sample_challenge(game_id: str, step: int) -> ChallengeStep:
    opponents = [
        Opponent(
            id=i,
            name=name,
            photo="/assets/milo.png",
            stats=PlayerStats(wins=12+i*2, losses=3+i, rating=1480 + i*50)
        )
        for i, name in enumerate(["Alex", "Sam", "Chris", "Jordan"], start=1)
    ]
    return ChallengeStep(
        stepId=f"{game_id}-{step}",
        player=PlayerMini(id="me", name="You", photo="/assets/me.png"),
        opponents=opponents
    )
