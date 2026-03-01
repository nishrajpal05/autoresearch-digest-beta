from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.models.topic_watch import TopicWatch, TopicAlert
from app.models.paper import Paper
from app.models.user import User
from app.services.topic_matcher import auto_suggest_keywords

router = APIRouter()

FREE_TOPIC_LIMIT = 3
PRO_TOPIC_LIMIT  = 999


#Schemas 

class CreateTopicRequest(BaseModel):
    topic: str
    user_id: int


#Topic Watch Endpoints 

@router.get("/topics")
async def get_topics(user_id: int, db: Session = Depends(get_db)):
    watches = db.query(TopicWatch).filter_by(
        user_id=user_id, is_active=True
    ).order_by(desc(TopicWatch.created_at)).all()

    result = []
    for w in watches:
        # Count unread alerts for this topic
        unread = db.query(TopicAlert).filter_by(
            user_id=user_id,
            topic_watch_id=w.id,
            is_read=False
        ).count()

        total = db.query(TopicAlert).filter_by(
            user_id=user_id,
            topic_watch_id=w.id,
        ).count()

        result.append({
            "id": w.id,
            "topic": w.topic,
            "keywords": w.keywords.split(",") if w.keywords else [],
            "unread_count": unread,
            "total_matches": total,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        })

    return {"topics": result}


@router.post("/topics")
async def create_topic(req: CreateTopicRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    is_premium = getattr(user, 'is_premium', False)
    limit = PRO_TOPIC_LIMIT if is_premium else FREE_TOPIC_LIMIT
    current_count = db.query(TopicWatch).filter_by(
        user_id=req.user_id, is_active=True
    ).count()

    if current_count >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Topic limit reached ({current_count}/{limit}). Upgrade to Pro for unlimited topics.",
                "limit": limit,
                "used": current_count,
                "upgrade_required": not is_premium
            }
        )

    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    # Check for duplicate
    existing = db.query(TopicWatch).filter_by(
        user_id=req.user_id, topic=topic, is_active=True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You're already watching this topic")

    keywords = auto_suggest_keywords(topic)

    watch = TopicWatch(
        user_id=req.user_id,
        topic=topic,
        keywords=",".join(keywords),
    )
    db.add(watch)
    db.commit()
    db.refresh(watch)

    return {
        "id": watch.id,
        "topic": watch.topic,
        "keywords": keywords,
        "message": f"Now watching '{topic}'"
    }


@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: int, user_id: int, db: Session = Depends(get_db)):
    watch = db.query(TopicWatch).filter_by(id=topic_id, user_id=user_id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Topic not found")

    watch.is_active = False
    db.commit()
    return {"message": "Topic removed"}


# alert endpoints

@router.get("/alerts")
async def get_alerts(
    user_id: int,
    unread_only: bool = Query(False),
    limit: int = Query(20),
    db: Session = Depends(get_db)
):
    query = db.query(TopicAlert).filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    alerts = query.order_by(desc(TopicAlert.created_at)).limit(limit).all()

    result = []
    for alert in alerts:
        paper = db.query(Paper).filter_by(id=alert.paper_id).first()
        watch = db.query(TopicWatch).filter_by(id=alert.topic_watch_id).first()
        if not paper or not watch:
            continue
        result.append({
            "id": alert.id,
            "is_read": alert.is_read,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
            "topic": watch.topic,
            "paper": {
                "id": paper.id,
                "title": paper.title,
                "category": paper.category,
                "published": paper.published.isoformat() if paper.published else None,
                "novelty_score": paper.novelty_score,
                "pdf_url": paper.pdf_url,
            }
        })

    unread_count = db.query(TopicAlert).filter_by(
        user_id=user_id, is_read=False
    ).count()

    return {"alerts": result, "unread_count": unread_count}


@router.post("/alerts/read")
async def mark_alerts_read(user_id: int, db: Session = Depends(get_db)):
    db.query(TopicAlert).filter_by(
        user_id=user_id, is_read=False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All alerts marked as read"}


@router.post("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: int, user_id: int, db: Session = Depends(get_db)):
    alert = db.query(TopicAlert).filter_by(id=alert_id, user_id=user_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read"}