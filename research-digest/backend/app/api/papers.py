from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.paper import Paper
from ..models.bookmark import Bookmark
from ..fetcher import fetch_papers
from ..services.ai__simplify import simplify_abstract

router = APIRouter(prefix="/papers", tags=["papers"])

@router.get("/")
def get_papers(category: str = "cs.AI", limit: int = 10, db: Session = Depends(get_db)):
    arxiv_papers = fetch_papers(category=category, max_results=limit)
    
    result = []
    for p in arxiv_papers:
        existing = db.query(Paper).filter(Paper.arxiv_id == p["id"]).first()
        if not existing:
            new_paper = Paper(
                arxiv_id=p["id"],
                title=p["title"],
                authors=p["authors"],
                summary=p["summary"],
                pdf_url=p["pdf_url"],
                published=p["published"],
                category=p["category"]
            )
            db.add(new_paper)
            db.commit()
            db.refresh(new_paper)
            result.append({**p, "db_id": new_paper.id})
        else:
            result.append({**p, "db_id": existing.id, "simplified": existing.simplified_summary})
    
    return {"success": True, "papers": result}

@router.post("/{paper_id}/simplify")
def simplify_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    if paper.simplified_summary:
        return {"success": True, "simplified": paper.simplified_summary}
    
    result = simplify_abstract(paper.title, paper.summary)
    if result["success"]:
        paper.simplified_summary = result["simplified"]
        db.commit()
        return {"success": True, "simplified": result["simplified"]}
    else:
        raise HTTPException(status_code=500, detail=f"AI simplification failed: {result.get('error', 'Unknown error')}")

@router.post("/{paper_id}/bookmark")
def bookmark_paper(paper_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.paper_id == paper_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"success": True, "bookmarked": False}
    else:
        new_bookmark = Bookmark(user_id=user_id, paper_id=paper_id)
        db.add(new_bookmark)
        db.commit()
        return {"success": True, "bookmarked": True}

@router.get("/bookmarks/{user_id}")
def get_bookmarks(user_id: int, db: Session = Depends(get_db)):
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == user_id).all()
    paper_ids = [b.paper_id for b in bookmarks]
    papers = db.query(Paper).filter(Paper.id.in_(paper_ids)).all()
    
    result = []
    for paper in papers:
        result.append({
            "db_id": paper.id,
            "id": paper.arxiv_id,
            "title": paper.title,
            "authors": paper.authors,
            "summary": paper.summary,
            "simplified": paper.simplified_summary,
            "pdf_url": paper.pdf_url,
            "published": paper.published,
            "category": paper.category
        })
    
    return {"success": True, "papers": result}