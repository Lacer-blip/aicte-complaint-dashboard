
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import router as api_router


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="AICTE Complaint Monitoring Dashboard",
    description="Prototype API for unified institution complaint monitoring.",
    version="0.1.0",
)

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)

app.include_router(api_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "AICTE Complaint Monitoring API is running",
    }


@app.get("/")
def home():
    return FileResponse(STATIC_DIR / "index.html")
