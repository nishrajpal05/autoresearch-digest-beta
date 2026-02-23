import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PaperCard from "../components/PaperCard";

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://autoresearch-digest-beta.onrender.com/papers/bookmarks/${user.id}`
      );
      const data = await res.json();
      setBookmarks(data.papers || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSimplify = async (paperId) => {
    try {
      const res = await fetch(
        `https://autoresearch-digest-beta.onrender.com/papers/${paperId}/simplify`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data.detail || `Simplify failed (${res.status})`
        };
      }

      if (data.success && data.simplified) {
        setBookmarks(prev => prev.map(p => 
          p.db_id === paperId ? { ...p, simplified: data.simplified } : p
        ));
        return { success: true };
      }
      return { success: false, error: "No simplified output returned." };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Network error while simplifying. Please try again." };
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
          Loading bookmarks...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Bookmarks</h1>
          <p>Your saved papers ({bookmarks.length})</p>
        </div>

        {bookmarks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
              No bookmarks yet. Start saving papers from your feed!
            </p>
          </div>
        ) : (
          <div className="papers-grid">
            {bookmarks.map((paper, i) => (
              <PaperCard 
                key={i} 
                paper={paper} 
                onSimplify={handleSimplify}
                userId={user.id}
                isBookmarked={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookmarks;
