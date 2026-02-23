import { useState } from "react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";

function PaperCard({ paper, onSimplify, userId, isBookmarked = false }) {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleSimplify = async () => {
    setLoading(true);
    await onSimplify(paper.db_id);
    setLoading(false);
  };

  const handleBookmark = async () => {
    if (bookmarkLoading) return; // prevent spam clicking

    setBookmarkLoading(true);

    try {
      const res = await fetch(
        `https://autoresearch-digest-beta-1.onrender.com/papers/${paper.db_id}/bookmark?user_id=${userId}`,
        // `http://localhost:8000papers/${paper.db_id}/bookmark?user_id=${userId}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setBookmarked(data.bookmarked);
      }

    } catch (err) {
      console.error(err);
    }

    setBookmarkLoading(false);
  };

  return (
    <div className="paper-card">

      <div className="paper-header">
        <h3 className="paper-title">{paper.title}</h3>
      </div>

      <p className="paper-meta">
        {paper.authors} • {paper.published}
      </p>

      <p className="paper-summary">
        {paper.summary}
      </p>

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
            className={`btn btn-secondary btn-sm bookmark-btn ${bookmarked ? "active" : ""}`}
            disabled={bookmarkLoading}
          >
            {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
            <span>
              {bookmarkLoading ? "Saving..." : (bookmarked ? "Saved" : "Bookmark")}
            </span>
          </button>
        )}

      </div>

    </div>
  );
}

export default PaperCard;
