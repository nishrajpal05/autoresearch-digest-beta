import { useState } from "react";

function PaperCard({ paper, onSimplify, token, userId, isBookmarked = false }) {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleSimplify = async () => {
    setLoading(true);
    await onSimplify(paper.db_id);
    setLoading(false);
  };

  const handleBookmark = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/papers/${paper.db_id}/bookmark?user_id=${userId}`,
        { 
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.success) {
        setBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="paper-card">
      <div className="paper-header">
        <h3 className="paper-title">{paper.title}</h3>
      </div>
      
      <p className="paper-meta">{paper.authors} • {paper.published}</p>
      
      <p className="paper-summary">{paper.summary}</p>
      
      {paper.simplified && (
        <div className="simplified-box">
          <h4>Simple Explanation</h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {paper.simplified}
          </p>
        </div>
      )}
      
      <div className="paper-actions">
        <button 
          onClick={handleSimplify}
          className="btn btn-primary btn-sm"
          disabled={loading}
        >
          {loading ? "Simplifying..." : "Explain Simply"}
        </button>
        <a 
          href={paper.pdf_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          Read PDF
        </a>
        {userId && (
          <button 
            onClick={handleBookmark}
            className="btn btn-secondary btn-sm"
          >
            {bookmarked ? " Saved" : " Bookmark"}
          </button>
        )}
      </div>
    </div>
  );
}

export default PaperCard;