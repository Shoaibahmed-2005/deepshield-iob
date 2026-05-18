from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine
import models

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

from routes import auth, transactions, vidlive

app = FastAPI(
    title="VID-LIVE API",
    description="Indian Overseas Bank — VID-LIVE deepfake-resilient authentication backend",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow any localhost port so Vite's auto-port-bump (5173 → 5174 etc.) never
# breaks the preflight.  In production replace this regex with the real domain.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(vidlive.router)


@app.get("/")
def root():
    return {
        "service": "VID-LIVE API",
        "bank": "Indian Overseas Bank",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
