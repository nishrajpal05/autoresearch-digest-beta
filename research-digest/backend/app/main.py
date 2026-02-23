from dotenv import load_dotenv
from pathlib import Path
import os
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware # noqa: E402
from starlette.middleware.sessions import SessionMiddleware # noqa: E402
from .db.database import engine, Base # noqa: E402
from .api import auth, papers  # noqa: E402

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutoResearch Digest API v2", version="2.0.0")

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "dev-secret-key")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://autoresearch-frontend.onrender.com",
        "https://autoresearch-digest-beta-1.onrender.com",
        "https://autoresearch-digest-beta-2.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(papers.router)

@app.get("/")
def home():
    return {
        "message": "AutoResearch Digest API v2",
        "status": "healthy",
        "version": "2.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("Starting AutoResearch Digest API v2...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
