# backend/app/fetcher.py

"""
This file fetches research papers from arXiv.
Think of arXiv like YouTube but for research papers - it's free and public.
"""

import arxiv
from typing import List, Dict

def fetch_papers(category: str = "cs.AI", max_results: int = 10) -> List[Dict]:
    """
    Fetch research papers from arXiv
    
    Args:
        category: Which field? (cs.AI = Artificial Intelligence)
        max_results: How many papers to get?
    
    Returns:
        List of papers (each paper is a dictionary with title, author, etc.)
    """
    
    print(f"🔍 Fetching {max_results} papers from {category}...")
    
    # Search arXiv (like searching Google)
    search = arxiv.Search(
        query=f"cat:{category}",  # cat means "category"
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,  # Newest first
        sort_order=arxiv.SortOrder.Descending
    )
    
    # Store papers here
    papers = []
    
    # Loop through each paper found
    for result in search.results():
        
        # Get author names (just first 3 to keep it short)
        author_names = [author.name for author in result.authors[:3]]
        authors_text = ", ".join(author_names)
        if len(result.authors) > 3:
            authors_text += " et al."  # "et al." means "and others"
        
        # Create a dictionary (like a form) for this paper
        paper = {
            "id": result.entry_id.split("/")[-1],  # Unique ID
            "title": result.title,
            "authors": authors_text,
            "summary": result.summary.replace("\n", " ")[:500] + "...",  # First 500 characters
            "pdf_url": result.pdf_url,  # Link to download PDF
            "published": str(result.published.date()),  # When was it published?
            "category": category
        }
        
        # Add to our list
        papers.append(paper)
    
    print(f"✅ Successfully fetched {len(papers)} papers!")
    return papers


# Test function (only runs if you run this file directly)
if __name__ == "__main__":
    print("Testing paper fetcher...")
    test_papers = fetch_papers(max_results=3)
    
    for i, paper in enumerate(test_papers, 1):
        print(f"\n📄 Paper {i}:")
        print(f"Title: {paper['title']}")
        print(f"Authors: {paper['authors']}")
        print(f"Published: {paper['published']}")