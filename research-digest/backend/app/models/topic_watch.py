from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class TopicWatch(Base):
    __tablename__ = "topic_watches"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic      = Column(String, nullable=False)   # e.g. "diffusion models"
    keywords   = Column(String, nullable=True)    # comma-separated, auto-extracted
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class TopicAlert(Base):
    __tablename__ = "topic_alerts"

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_watch_id = Column(Integer, ForeignKey("topic_watches.id"), nullable=False)
    paper_id       = Column(Integer, ForeignKey("papers.id"), nullable=False)
    is_read        = Column(Boolean, default=False)
    created_at     = Column(DateTime, server_default=func.now())