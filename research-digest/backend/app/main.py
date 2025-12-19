import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from .database import get_db, init_db
from .models import Paper, User, Bookmark, Explanation
from .fetcher import fetch_papers


app = FastAPI(
    title="AutoResearch Digest API",
    description="Get research papers in a simple, digestible format",
    version="2.0.0"
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
   
    return {
        "message": "Nishmeet's AutoResearch Digest API is running!",
        "status": "healthy",
        "features": {
            "database": " PostgreSQL",
            "ai_explanations": " Claude API",
            "scheduled_fetching": " APScheduler"
        },
        "endpoints": {
            "/papers": "Get papers (from database)",
            "/papers/{id}": "Get specific paper",
            "/papers/fetch-new": "Fetch new papers from arXiv",
            "/papers/{id}/explain": "Generate AI explanation",
            "/health": "Health check",
            "/docs": "API documentation"
        }
    }


# HEALTH CHECK - http://localhost:8000/health
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Try to query database
        paper_count = db.query(Paper).count()
        return {
            "status": "healthy",
            "database": "connected",
            "papers_in_db": paper_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "error",
            "error": str(e)
        }



@app.get("/papers")
def get_papers(
    domain: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get papers from database
    
    Query params:
        domain: Filter by domain (e.g., 'cs.AI')
        skip: Number of papers to skip (pagination)
        limit: Max papers to return
    """
    try:
        # Build query
        query = db.query(Paper)
        
        # Filter by domain if specified
        if domain:
            query = query.filter(Paper.domain == domain)
        
        # Order by fetch date (newest first)
        query = query.order_by(Paper.fetched_date.desc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        papers = query.offset(skip).limit(limit).all()
        
        # Convert to dict
        papers_list = []
        for paper in papers:
            papers_list.append({
                "id": paper.id,
                "arxiv_id": paper.arxiv_id,
                "title": paper.title,
                "authors": paper.authors,
                "summary": paper.abstract[:500] + "..." if paper.abstract else "",
                "domain": paper.domain,
                "difficulty": paper.difficulty,
                "tags": paper.tags,
                "pdf_url": paper.pdf_url,
                "published": str(paper.published_date.date()) if paper.published_date else None,
                "view_count": paper.view_count
            })
        
        return {
            "success": True,
            "total": total,
            "count": len(papers_list),
            "papers": papers_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# Get specific paper
@app.get("/papers/{paper_id}")
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    """Get a specific paper by ID"""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Increment view count
    paper.view_count += 1
    db.commit()
    
    return {
        "success": True,
        "paper": {
            "id": paper.id,
            "arxiv_id": paper.arxiv_id,
            "title": paper.title,
            "authors": paper.authors,
            "abstract": paper.abstract,
            "summary": paper.summary,
            "domain": paper.domain,
            "difficulty": paper.difficulty,
            "tags": paper.tags,
            "pdf_url": paper.pdf_url,
            "published": str(paper.published_date.date()) if paper.published_date else None,
            "view_count": paper.view_count
        }
    }

# Fetch new papers from arXiv and save to database
@app.post("/papers/fetch-new")
def fetch_new_papers(
    category: str = "cs.AI",
    max_results: int = 10,
    db: Session = Depends(get_db)
):
    """
    Manually fetch new papers from arXiv
    Saves them to database
    """
    try:
        print(f" Fetching {max_results} papers from {category}...")
        
        # Fetch from arXiv
        fetched_papers = fetch_papers(category=category, max_results=max_results)
        
        new_count = 0
        existing_count = 0
        
        for paper_data in fetched_papers:
            # Check if paper already exists
            existing = db.query(Paper).filter(
                Paper.arxiv_id == paper_data['id']
            ).first()
            
            if existing:
                existing_count += 1
                continue
            
            # Create new paper
            new_paper = Paper(
                arxiv_id=paper_data['id'],
                title=paper_data['title'],
                authors=paper_data['authors'],
                abstract=paper_data['summary'],
                domain=category,
                pdf_url=paper_data['pdf_url'],
                published_date=datetime.strptime(paper_data['published'], '%Y-%m-%d'),
                tags=[]  
            )
            
            db.add(new_paper)
            new_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Fetched {len(fetched_papers)} papers",
            "new_papers": new_count,
            "existing_papers": existing_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Get available domains
@app.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    """Get list of all domains with paper counts"""
    try:
        # Get unique domains from papers
        domains = db.query(Paper.domain).distinct().all()
        
        domain_info = []
        for (domain,) in domains:
            count = db.query(Paper).filter(Paper.domain == domain).count()
            domain_info.append({
                "domain": domain,
                "count": count
            })
        
        return {
            "success": True,
            "domains": domain_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Statistics endpoint
@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get database statistics"""
    try:
        total_papers = db.query(Paper).count()
        total_users = db.query(User).count()
        total_bookmarks = db.query(Bookmark).count()
        total_explanations = db.query(Explanation).count()
        
        # Get papers by domain
        domains = db.query(Paper.domain).distinct().all()
        
        return {
            "success": True,
            "total_papers": total_papers,
            "total_users": total_users,
            "total_bookmarks": total_bookmarks,
            "total_explanations": total_explanations,
            "total_domains": len(domains)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# This runs when you start the server
if __name__ == "__main__":
    import uvicorn
    print(" Starting AutoResearch Digest API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)