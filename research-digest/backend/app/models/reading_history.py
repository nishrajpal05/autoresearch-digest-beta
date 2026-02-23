from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..db.database import Base

class ReadingHistory(Base):
    __tablename__ = "reading_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    paper_id = Column(Integer, ForeignKey("papers.id"))
    read_at = Column(DateTime(timezone=True), server_default=func.now())