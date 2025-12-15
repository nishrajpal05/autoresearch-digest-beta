import arxiv
from typing import List, Dict

def fetch_papers(category: str = "cs.AI", max_results: int = 10) -> List[Dict]:

    
    print(f" Fetching {max_results} papers from {category}...")
    
    # Search arXiv (compatible with arxiv 1.4.8)
    search = arxiv.Search(
        query=f"cat:{category}",
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )
    
    # Store papers here
    papers = []
    
    # Get results (compatible method)
    results = list(search.results())
    
    # Loop through each paper found
    for result in results:
        
        # Get author names (just first 3 to keep it short)
        author_names = [author.name for author in result.authors[:3]]
        authors_text = ", ".join(author_names)
        if len(result.authors) > 3:
            authors_text += " et al."
        
        # Create a dictionary for this paper
        paper = {
            "id": result.entry_id.split("/")[-1],
            "title": result.title,
            "authors": authors_text,
            "summary": result.summary.replace("\n", " ")[:500] + "...",
            "pdf_url": result.pdf_url,
            "published": str(result.published.date()),
            "category": category
        }
        
        papers.append(paper)
    
    print(f" Successfully fetched {len(papers)} papers!")
    return papers


# Test function
if __name__ == "__main__":
    print("Testing paper fetcher...")
    test_papers = fetch_papers(max_results=3)
    
    for i, paper in enumerate(test_papers, 1):
        print(f"\n Paper {i}:")
        print(f"Title: {paper['title']}")
        print(f"Authors: {paper['authors']}")
        print(f"Published: {paper['published']}")