from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from app.db.database import Base

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    authors = Column(JSON)  # list of author names
    summary = Column(Text)
    simplified_summary = Column(Text, nullable=True)
    practitioner_verdict = Column(Text, nullable=True)     
    impact_tags = Column(JSON, nullable=True)              
    novelty_score = Column(Float, nullable=True)           
    trend_signal = Column(String, nullable=True)           
    trend_delta = Column(Integer, nullable=True)            
    reading_time_minutes = Column(Integer, nullable=True)  
    pdf_url = Column(String)
    published = Column(DateTime)
    category = Column(String, index=True)