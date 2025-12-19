
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Paper(Base):
   
    __tablename__ = "papers"
    
    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    authors = Column(Text)
    abstract = Column(Text)
    summary = Column(Text)  # AI-generated summary
    domain = Column(String, index=True)  # AI, ML, CV, etc.
    difficulty = Column(Integer)  # 1-10 scale
    tags = Column(JSON)  # List of tags
    pdf_url = Column(String)
    published_date = Column(DateTime)
    fetched_date = Column(DateTime, default=datetime.utcnow, index=True)
    view_count = Column(Integer, default=0)  # Track popularity
    
    # Relationships
    explanations = relationship("Explanation", back_populates="paper")
    bookmarks = relationship("Bookmark", back_populates="paper")

class User(Base):
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    bookmarks = relationship("Bookmark", back_populates="user")
    explanation_requests = relationship("Explanation", back_populates="user")

class Bookmark(Base):
   
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    folder = Column(String, default="default")  # Organize bookmarks
    notes = Column(Text)  # User notes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bookmarks")
    paper = relationship("Paper", back_populates="bookmarks")

class Explanation(Base):
   
    __tablename__ = "explanations"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Track who requested
    mode = Column(String, nullable=False)  # 'simple' or 'technical'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    paper = relationship("Paper", back_populates="explanations")
    user = relationship("User", back_populates="explanation_requests")

class Category(Base):
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)  # e.g., 'cs.AI'
    name = Column(String)  # e.g., 'Artificial Intelligence'
    description = Column(Text)
    icon = Column(String)  # Emoji or icon name
    paper_count = Column(Integer, default=0)  # Track papers per category

class Analytics(Base):
   
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)  # 'view', 'bookmark', 'explain', etc.
    user_id = Column(Integer, nullable=True)
    paper_id = Column(Integer, nullable=True)
    metadata = Column(JSON)  # Additional event data
    created_at = Column(DateTime, default=datetime.utcnow, index=True)