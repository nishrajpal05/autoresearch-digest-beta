from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.arxiv_fetcher import fetch_papers as fetch_papers_from_arxiv
from app.core.security import verify_token
from app.crud.user import get_user_by_id

router = APIRouter()

@router.get("/")
def get_papers(
    category: str = "AI",
    limit: int = 10,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Get papers - requires authentication"""
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    # Verify token
    payload = verify_token(token)
    user = get_user_by_id(db, payload.get("user_id"))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Fetch papers from arXiv
    papers = fetch_papers_from_arxiv(category, limit)
    return {"papers": papers, "user": user.username}