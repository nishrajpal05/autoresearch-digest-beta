from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, get_db
from app.fetcher import fetch_papers
from app.models.bookmark import Bookmark
from app.models.paper import Paper
from app.models.user import User
from app.services.intelligence import enrich_paper, enrich_paper_metadata, get_ai_provider_error
from app.services.usage import FREE_LIMITS, can_enrich, get_usage_today, increment_usage

router = APIRouter()


def _background_enrich_paper(paper_id: int) -> None:
    """
    Pro-only background enrichment. Uses a fresh DB session after response.
    """
    db = SessionLocal()
    try:
        paper = db.query(Paper).filter_by(id=paper_id).first()
        if not paper:
            return
        if paper.simplified_summary is not None and paper.practitioner_verdict is not None:
            return
        enrich_paper(db, paper, force=False)
    except Exception as e:
        db.rollback()
        print(f"[Papers] background enrich error for {paper_id}: {e}")
    finally:
        db.close()


def _parse_published(value) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None


def paper_to_dict(paper: Paper, user_id: Optional[int] = None, db: Session = None) -> dict:
    is_bookmarked = False
    if user_id and db:
        bm = db.query(Bookmark).filter_by(user_id=user_id, paper_id=paper.id).first()
        is_bookmarked = bm is not None

    return {
        "id": paper.id,
        "arxiv_id": paper.arxiv_id,
        "title": paper.title,
        "authors": paper.authors if isinstance(paper.authors, list) else [],
        "summary": paper.summary,
        "simplified_summary": paper.simplified_summary,
        "practitioner_verdict": paper.practitioner_verdict,
        "impact_tags": paper.impact_tags if isinstance(paper.impact_tags, list) else [],
        "novelty_score": paper.novelty_score,
        "trend_signal": paper.trend_signal,
        "trend_delta": paper.trend_delta,
        "reading_time_minutes": paper.reading_time_minutes,
        "pdf_url": paper.pdf_url,
        "published": paper.published.isoformat() if paper.published else None,
        "category": paper.category,
        "is_bookmarked": is_bookmarked,
    }


@router.get("/papers")
async def get_papers(
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: str = Query("recent", pattern="^(recent|novelty|trending)$"),
    user_id: Optional[int] = Query(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    if category:
        try:
            raw_papers = fetch_papers(category=category, max_results=30)
            for p in raw_papers:
                existing = db.query(Paper).filter_by(arxiv_id=p["id"]).first()
                if not existing:
                    new_paper = Paper(
                        arxiv_id=p["id"],
                        title=p["title"],
                        authors=[a.strip() for a in p["authors"].replace(" et al.", "").split(",")],
                        summary=p["summary"],
                        pdf_url=p["pdf_url"],
                        published=_parse_published(p.get("published")),
                        category=p["category"],
                    )
                    db.add(new_paper)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Papers] arXiv fetch error: {e}")

    query = db.query(Paper)
    if category:
        query = query.filter(Paper.category == category)

    if sort == "novelty":
        query = query.order_by(desc(Paper.novelty_score))
    elif sort == "trending":
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        query = query.filter(Paper.published >= three_days_ago).order_by(desc(Paper.novelty_score))
    else:
        query = query.order_by(desc(Paper.published))

    total = query.count()
    papers = query.offset(offset).limit(limit).all()

    user = db.query(User).filter_by(id=user_id).first() if user_id else None
    is_premium = bool(user and user.is_premium)
    free_limit = FREE_LIMITS["enrich_paper"]
    used_today = get_usage_today(db, user_id, "enrich_paper") if user_id else 0
    remaining_today = max(free_limit - used_today, 0)

    changed = False
    for paper in papers:
        before = (paper.novelty_score, paper.trend_signal, paper.reading_time_minutes)
        enrich_paper_metadata(db, paper, force=False)
        after = (paper.novelty_score, paper.trend_signal, paper.reading_time_minutes)
        if before != after:
            changed = True

    if changed:
        db.commit()
        for paper in papers:
            db.refresh(paper)

    if is_premium and background_tasks is not None:
        for paper in papers:
            if paper.simplified_summary is None or paper.practitioner_verdict is None:
                background_tasks.add_task(_background_enrich_paper, paper.id)

    return {
        "papers": [paper_to_dict(p, user_id=user_id, db=db) for p in papers],
        "total": total,
        "offset": offset,
        "access": {
            "is_premium": is_premium,
            "free_daily_limit": free_limit,
            "used_today": used_today,
            "remaining_today": remaining_today,
        },
    }


@router.get("/papers/stats")
async def get_category_stats(db: Session = Depends(get_db)):
    categories = ["cs.AI", "cs.LG", "cs.CV", "cs.CL", "cs.RO", "cs.CR"]
    stats = []
    for cat in categories:
        week_ago = datetime.utcnow() - timedelta(days=7)
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)

        recent = db.query(func.count(Paper.id)).filter(
            Paper.category == cat,
            Paper.published >= week_ago,
        ).scalar() or 0

        prior = db.query(func.count(Paper.id)).filter(
            Paper.category == cat,
            Paper.published >= two_weeks_ago,
            Paper.published < week_ago,
        ).scalar() or 0

        delta = 0 if prior == 0 else round(((recent - prior) / prior) * 100)
        stats.append(
            {
                "category": cat,
                "recent_count": recent,
                "trend_delta": delta,
                "signal": "heating" if delta >= 20 else "cooling" if delta <= -20 else "steady",
            }
        )

    return {"stats": stats}


@router.post("/papers/{paper_id}/bookmark")
async def toggle_bookmark(paper_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = db.query(Bookmark).filter_by(user_id=user_id, paper_id=paper_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}

    bm = Bookmark(user_id=user_id, paper_id=paper_id)
    db.add(bm)
    db.commit()
    return {"bookmarked": True}


@router.get("/papers/bookmarks/{user_id}")
async def get_bookmarks(user_id: int, db: Session = Depends(get_db)):
    bookmarks = db.query(Bookmark).filter_by(user_id=user_id).all()
    paper_ids = [b.paper_id for b in bookmarks]
    papers = db.query(Paper).filter(Paper.id.in_(paper_ids)).all()
    return {"papers": [paper_to_dict(p, user_id=user_id, db=db) for p in papers]}


@router.post("/papers/{paper_id}/enrich")
async def enrich_paper_endpoint(
    paper_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    paper = db.query(Paper).filter_by(id=paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Always fill free metrics first.
    enrich_paper_metadata(db, paper, force=False)
    db.commit()
    db.refresh(paper)

    # Global cache hit: no API cost and no usage charge.
    if paper.simplified_summary is not None and paper.practitioner_verdict is not None:
        return {
            "paper": paper_to_dict(paper, user_id=user_id, db=db),
            "from_cache": True,
            "usage": {
                "used": get_usage_today(db, user_id, "enrich_paper"),
                "limit": FREE_LIMITS["enrich_paper"],
            },
        }

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    is_premium = bool(getattr(user, "is_premium", False))
    allowed, used, limit = can_enrich(db, user_id, is_premium)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "daily_limit_reached",
                "message": f"Daily limit reached. You've used {used}/{limit} analyses today.",
                "used": used,
                "limit": limit,
                "is_premium": is_premium,
                "upgrade_required": not is_premium,
            },
        )

    provider_error = get_ai_provider_error()
    if provider_error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "provider_not_configured",
                "message": provider_error,
            },
        )

    paper = enrich_paper(db, paper, force=False)
    if paper.simplified_summary is None or paper.practitioner_verdict is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "ai_unavailable",
                "message": "AI enrichment failed temporarily. Please try again.",
            },
        )

    increment_usage(db, user_id, "enrich_paper")

    return {
        "paper": paper_to_dict(paper, user_id=user_id, db=db),
        "from_cache": False,
        "usage": {"used": used + 1, "limit": limit},
    }


@router.post("/papers/{paper_id}/simplify")
async def simplify_paper(paper_id: int, db: Session = Depends(get_db)):
    """
    Backward-compatible endpoint used by older frontend screens.
    """
    paper = db.query(Paper).filter_by(id=paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    paper = enrich_paper(db, paper, force=False)
    return {
        "success": bool(paper.simplified_summary),
        "simplified": paper.simplified_summary,
    }
