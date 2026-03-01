from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.usage import DailyUsage

FREE_LIMITS = {
    "enrich_paper": 3,   # 3 manual paper analyses per day
}

PRO_LIMITS = {
    "enrich_paper": 999, # effectively unlimited
}

def get_today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")

def get_usage_today(db: Session, user_id: int, action: str) -> int:
    record = db.query(DailyUsage).filter(
        and_(
            DailyUsage.user_id == user_id,
            DailyUsage.action == action,
            DailyUsage.date == get_today()
        )
    ).first()
    return record.count if record else 0

def increment_usage(db: Session, user_id: int, action: str):
    today = get_today()
    record = db.query(DailyUsage).filter(
        and_(
            DailyUsage.user_id == user_id,
            DailyUsage.action == action,
            DailyUsage.date == today
        )
    ).first()
    if record:
        record.count += 1
    else:
        record = DailyUsage(user_id=user_id, action=action, date=today, count=1)
        db.add(record)
    db.commit()

def can_enrich(db: Session, user_id: int, is_premium: bool) -> tuple[bool, int, int]:
    """
    Returns (allowed, used_today, limit)
    """
    limits = PRO_LIMITS if is_premium else FREE_LIMITS
    limit = limits.get("enrich_paper", 0)
    used = get_usage_today(db, user_id, "enrich_paper")
    return used < limit, used, limit