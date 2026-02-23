from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from ..db.database import Base

class Paper(Base):
    __tablename__ = "papers"
    
    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    authors = Column(String)
    summary = Column(Text)
    simplified_summary = Column(Text, nullable=True)
    pdf_url = Column(String)
    published = Column(String)
    category = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())