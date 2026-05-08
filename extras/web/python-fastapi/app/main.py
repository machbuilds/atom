"""FastAPI entry point.

Run locally:  uvicorn app.main:app --reload
Run in Docker: container CMD invokes uvicorn directly (see Dockerfile).
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings load from env at startup. See .env.example for the contract."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    log_level: str = "info"


settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield


app = FastAPI(title="app", lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    """Container healthcheck contract — must return 200 when ready."""
    return {"status": "ok", "env": settings.app_env}


@app.get("/")
async def root() -> dict[str, str]:
    return {"hello": "world"}
