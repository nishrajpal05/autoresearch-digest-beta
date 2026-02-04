from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.db.base import Base

class SavedPaper(Base):
    __tablename__ = "saved_papers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    paper_id = Column(String)  # arXiv ID
    title = Column(String)
    saved_at = Column(DateTime, default=datetime.utcnow)