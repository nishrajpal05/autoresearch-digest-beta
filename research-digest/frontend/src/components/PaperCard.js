import { useState } from "react";

function PaperCard({ paper, onSimplify, token }) {
  const [loading, setLoading] = useState(false);

  const handleSimplify = async () => {
    setLoading(true);
    await onSimplify(paper.db_id);
    setLoading(false);
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
      </div>
    </div>
  );
}

export default PaperCard;