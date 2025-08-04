from fastapi import FastAPI
from .main import create_app

app: FastAPI = create_app()