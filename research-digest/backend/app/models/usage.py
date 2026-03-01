from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    action     = Column(String, nullable=False)  # "enrich_paper"
    date       = Column(String, nullable=False)  # "2026-03-01" — string for easy querying
    count      = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())