import json
import re
import os
from datetime import datetime, timedelta
from typing import Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.paper import Paper

def _get_client() -> Optional[OpenAI]:
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(
        api_key=api_key,
        base_url="https://api.x.ai/v1"
    )


def get_ai_provider_error() -> Optional[str]:
    """
    Returns a human-readable provider configuration error, if any.
    """
    if not os.getenv("XAI_API_KEY"):
        return "AI provider is not configured on server. Missing XAI_API_KEY."
    return None

#trend signal --
def compute_trend_signal(db: Session, category: str) -> dict:

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    recent_count = db.query(func.count(Paper.id)).filter(
        Paper.category == category,
        Paper.published >= week_ago
    ).scalar() or 0

    prior_count = db.query(func.count(Paper.id)).filter(
        Paper.category == category,
        Paper.published >= two_weeks_ago,
        Paper.published < week_ago
    ).scalar() or 0

    if prior_count == 0:
        delta = 0
        signal = "steady"
    else:
        delta = round(((recent_count - prior_count) / prior_count) * 100)
        if delta >= 20:
            signal = "heating"
        elif delta <= -20:
            signal = "cooling"
        else:
            signal = "steady"

    return {"trend_signal": signal, "trend_delta": delta}


#  Novelty Score --

def compute_novelty_score(db: Session, paper: Paper) -> float:
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

   
    recent_titles = db.query(Paper.title).filter(
        Paper.category == paper.category,
        Paper.published >= thirty_days_ago,
        Paper.id != paper.id
    ).limit(100).all()

    if not recent_titles:
        return 75.0  # default if no comparison data

    # Extracting meaningful words from this paper's title we will ignore some words
    stopwords = {"a","an","the","of","in","on","for","with","and","or",
                 "to","via","from","by","as","at","is","are","be","using",
                 "based","towards","toward","learning","deep","neural"}

    def extract_keywords(title: str) -> set:
        words = re.findall(r'\b[a-zA-Z]{4,}\b', title.lower())
        return {w for w in words if w not in stopwords}

    this_keywords = extract_keywords(paper.title)
    if not this_keywords:
        return 50.0

    overlap_scores = []
    for (title,) in recent_titles:
        other_keywords = extract_keywords(title)
        if not other_keywords:
            continue
        overlap = len(this_keywords & other_keywords) / len(this_keywords | other_keywords)
        overlap_scores.append(overlap)

    if not overlap_scores:
        return 75.0

    avg_overlap = sum(overlap_scores) / len(overlap_scores)
    # High overlap tab hoga jab novelty low hoga . phir Invert aur  scale to 0-100.
    novelty = round((1 - avg_overlap) * 100, 1)
    # Clamp bw 10-98
    return max(10.0, min(98.0, novelty))


# ── Reading Time

def estimate_reading_time(summary: str) -> int:
    """Estimating  full paper reading time based on abstract length as proxy."""
    words_in_abstract = len(summary.split())
    estimated_full_words = words_in_abstract * 33
    minutes = round(estimated_full_words / 200)
    return max(5, min(45, minutes))


def enrich_paper_metadata(db: Session, paper: Paper, force: bool = False) -> Paper:
    """
    Compute free intelligence fields only (no LLM/API call).
    """
    if (
        not force
        and paper.novelty_score is not None
        and paper.trend_signal is not None
        and paper.reading_time_minutes is not None
    ):
        return paper

    trend_data = compute_trend_signal(db, paper.category)
    paper.trend_signal = trend_data["trend_signal"]
    paper.trend_delta = trend_data["trend_delta"]
    paper.novelty_score = compute_novelty_score(db, paper)
    paper.reading_time_minutes = estimate_reading_time(paper.summary or "")
    return paper


# ── AI Intelligence (Grok/OpenAI/any)  baad mai dekhange kaunsa wla efficient hai 
def generate_ai_intelligence(paper: Paper, novelty_score: float, trend_signal: str) -> dict:
    client = _get_client()
    if client is None:
        return {
            "simplified_summary": None,
            "practitioner_verdict": None,
            "impact_tags": [],
            "_error": get_ai_provider_error() or "AI provider unavailable.",
        }
 
    trend_context = {
        "heating": "This topic is seeing a surge in research activity right now.",
        "cooling": "Research activity in this area is slowing down.",
        "steady": "This topic has steady, consistent research activity."
    }.get(trend_signal, "")

    novelty_context = (
        "This paper appears highly novel compared to recent work in the field."
        if novelty_score > 70 else
        "This paper builds incrementally on existing work in the field."
        if novelty_score < 40 else
        "This paper represents moderate innovation over recent work."
    )

    prompt = f"""You are a senior research analyst at a top AI lab. Analyze this research paper and return a JSON object.

Paper Title: {paper.title}
Authors: {', '.join(paper.authors) if isinstance(paper.authors, list) else paper.authors}
Abstract: {paper.summary}

Context: {trend_context} {novelty_context}

Return ONLY a valid JSON object with exactly these keys:
{{
  "simplified_summary": "2-3 sentence plain English explanation. No jargon. Assume the reader is a smart engineer who hasn't read the paper.",
  "practitioner_verdict": "1 sentence starting with an action verb. What should someone building AI products today do with this information? Be specific and opinionated.",
  "impact_tags": ["2-4 tags from this list only: #breakthrough, #incremental, #challenges-sota, #industry-ready, #theoretical, #benchmark, #dataset-release, #efficiency-gain, #safety-relevant, #multimodal, #open-source"]
}}

Return ONLY the JSON. No markdown, no explanation."""

    try:
        response = client.chat.completions.create(
            model="grok-beta",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )
        content = response.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        content = re.sub(r'^```(?:json)?\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        result = json.loads(content)
        return {
            "simplified_summary": result.get("simplified_summary", ""),
            "practitioner_verdict": result.get("practitioner_verdict", ""),
            "impact_tags": result.get("impact_tags", []),
            "_error": None,
        }
    except Exception as e:
        print(f"[Intelligence] Grok API error: {e}")
        return {
            "simplified_summary": None,
            "practitioner_verdict": None,
            "impact_tags": [],
            "_error": f"AI provider request failed: {str(e)}",
        }


# ── Enrichment Function

def enrich_paper(db: Session, paper: Paper, force: bool = False) -> Paper:

    already_enriched = (
        paper.novelty_score is not None and
        paper.simplified_summary is not None and
        not force
    )
    if already_enriched:
        return paper

    # Always ensure free intelligence fields first
    paper = enrich_paper_metadata(db, paper, force=force)

    # grok call per paper
    ai_data = generate_ai_intelligence(paper, paper.novelty_score, paper.trend_signal)
    paper.simplified_summary = ai_data["simplified_summary"]
    paper.practitioner_verdict = ai_data["practitioner_verdict"]
    paper.impact_tags = ai_data["impact_tags"]

    db.commit()
    db.refresh(paper)
    return paper
