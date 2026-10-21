
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.inspections import router as inspections_router
from app.db.database import initialize_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="OmniSight API",
    description="AI-powered UI inspection and self-healing platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(inspections_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "OmniSight",
        "version": "0.1.0",
    }
