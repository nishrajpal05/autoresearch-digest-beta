import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PaperCard from "../components/PaperCard";

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://autoresearch-digest-beta-1.onrender.com/papers/bookmarks/${user.id}`,
        // `http://localhost:8000papers/bookmarks/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` }}
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
        `http://localhost:8000/papers/${paperId}/simplify`,
        { 
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.map(p => 
          p.db_id === paperId ? { ...p, simplified: data.simplified } : p
        ));
      }
    } catch (err) {
      console.error(err);
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
                token={token}
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