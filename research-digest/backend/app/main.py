from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .api import auth, papers

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutoResearch Digest API v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://autoresearch-frontend.onrender.com"
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