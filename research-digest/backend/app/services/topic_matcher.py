"""
Matches newly fetched papers against all active topic watches.
Pure string matching — no API calls, runs on every paper fetch.
"""
import re
from typing import List, Set
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.topic_watch import TopicWatch, TopicAlert
from app.models.paper import Paper


STOPWORDS = {
    "a","an","the","of","in","on","for","with","and","or","to",
    "via","from","by","as","at","is","are","be","using","based",
    "towards","toward","learning","deep","neural","new","novel",
    "this","that","we","our","their","which","when","where","how"
}


def extract_keywords(text: str) -> List[str]:
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    cleaned = [normalize_word(w) for w in words if w not in STOPWORDS]
    # Deduplicate while preserving order
    return list(dict.fromkeys([w for w in cleaned if w and w not in STOPWORDS]))


def normalize_word(word: str) -> str:
    """
    Lightweight normalization for plural/suffix variants.
    """
    w = word.strip().lower()
    if len(w) > 4 and w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 4 and w.endswith("es"):
        return w[:-2]
    if len(w) > 3 and w.endswith("s"):
        return w[:-1]
    return w


def topic_matches_paper(topic_keywords: List[str], paper: Paper) -> bool:
    """
    Returns True if at least 2 topic keywords appear in the paper
    title or summary. Single keyword matches avoid false positives.
    """
    paper_tokens: Set[str] = set(extract_keywords(f"{paper.title} {paper.summary or ''}"))
    keyword_tokens = [normalize_word(k) for k in topic_keywords if normalize_word(k)]
    if not keyword_tokens:
        return False

    matches = sum(1 for kw in keyword_tokens if kw in paper_tokens)
    required = 1 if len(keyword_tokens) <= 2 else 2
    return matches >= required


def match_paper_against_all_watches(db: Session, paper: Paper):
    """
    Called after a new paper is stored.
    Checks all active topic watches and creates alerts for matches.
    """
    watches = db.query(TopicWatch).filter_by(is_active=True).all()
    created_any = False

    for watch in watches:
        # Get keywords — use stored ones or extract from topic name
        if watch.keywords:
            keywords = [k.strip() for k in watch.keywords.split(",") if k.strip()]
        else:
            keywords = extract_keywords(watch.topic)
            # Store extracted keywords for future use
            watch.keywords = ",".join(keywords)

        if not keywords:
            continue

        if topic_matches_paper(keywords, paper):
            # Avoid duplicate alerts
            existing = db.query(TopicAlert).filter(
                and_(
                    TopicAlert.user_id == watch.user_id,
                    TopicAlert.topic_watch_id == watch.id,
                    TopicAlert.paper_id == paper.id,
                )
            ).first()

            if not existing:
                alert = TopicAlert(
                    user_id=watch.user_id,
                    topic_watch_id=watch.id,
                    paper_id=paper.id,
                )
                db.add(alert)
                created_any = True

    return created_any


def auto_suggest_keywords(topic: str) -> List[str]:
    """Extract and return keywords for a topic string."""
    return extract_keywords(topic)
