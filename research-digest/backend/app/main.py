

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from .fetcher import fetch_papers

# Create the API (like opening a restaurant)
app = FastAPI(
    title="AutoResearch Digest API",
    description="Get research papers in a simple, digestible format",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://autoresearch-frontend.onrender.com",  
        "https://*.onrender.com",  # Allow all Render preview URLs
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    """
    Home page - just to check if API is running
    Like checking if a store is open
    """
    return {
        "message": "Nishmeet's AutoResearch Digest API is running!",
        "status": "healthy",
        "endpoints": {
            "/papers": "Get research papers",
            "/health": "Check if API is working",
            "/docs": "See all available endpoints"
        }
    }


# HEALTH CHECK - http://localhost:8000/health
@app.get("/health")
def health_check():
    """
    Quick health check
    Like asking 'Are you okay?'
    """
    return {
        "status": "healthy",
        "message": "All systems operational! 💚"
    }


# GET PAPERS - http://localhost:8000/papers
@app.get("/papers")
def get_papers(
    category: Optional[str] = "cs.AI",  # Default to AI papers
    limit: Optional[int] = 10  # Default to 10 papers
):
   
    # Validate inputs
    if limit > 50:
        limit = 50  # Don't allow more than 50 (to protect the server)
    
    if limit < 1:
        raise HTTPException(
            status_code=400,  # 400 = Bad Request
            detail="Limit must be at least 1"
        )
    
    try:
        # Fetch papers using our fetcher
        papers = fetch_papers(category=category, max_results=limit)
        
        # Return response
        return {
            "success": True,
            "count": len(papers),
            "category": category,
            "papers": papers
        }
    
    except Exception as e:
        # If something goes wrong, return error
        raise HTTPException(
            status_code=500,  # 500 = Internal Server Error
            detail=f"Error fetching papers: {str(e)}"
        )


# GET SPECIFIC PAPER - http://localhost:8000/papers/2401.12345
@app.get("/papers/{paper_id}")
def get_paper(paper_id: str):
    
    papers = fetch_papers(max_results=50)
    
    for paper in papers:
        if paper["id"] == paper_id:
            return {
                "success": True,
                "paper": paper
            }
    
    # If not found
    raise HTTPException(
        status_code=404,  # 404 = Not Found
        detail=f"Paper with ID {paper_id} not found"
    )


# This runs when you start the server
if __name__ == "__main__":
    import uvicorn
    print(" Starting AutoResearch Digest API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)