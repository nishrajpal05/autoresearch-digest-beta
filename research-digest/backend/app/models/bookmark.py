from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func
from ..db.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "paper_id", name="uq_bookmarks_user_paper"),
        Index("ix_bookmarks_user_id", "user_id"),
        Index("ix_bookmarks_paper_id", "paper_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    paper_id = Column(Integer, ForeignKey("papers.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
