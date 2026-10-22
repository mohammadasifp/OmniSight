from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.inspections import router as inspections_router
from app.db.database import initialize_database


BASE_DIR = Path(__file__).resolve().parents[1]
SCREENSHOT_DIR = BASE_DIR / "artifacts" / "screenshots"


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="OmniSight API",
    description="AI-powered UI inspection and self-healing platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inspections_router)

app.mount(
    "/screenshots",
    StaticFiles(directory=str(SCREENSHOT_DIR)),
    name="screenshots",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "OmniSight",
        "version": "0.1.0",
    }
