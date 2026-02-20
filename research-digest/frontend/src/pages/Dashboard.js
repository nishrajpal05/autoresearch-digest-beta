import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PaperCard from "../components/PaperCard";

function Dashboard() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("cs.AI");
  const { user } = useContext(AuthContext);
  const displayName = user?.full_name || user?.email?.split('@')[0] || "there";
  const API_BASE = "https://autoresearch-digest-beta-1.onrender.com";

  const categories = [
    { id: "cs.AI", label: "Artificial Intelligence" },
    { id: "cs.LG", label: "Machine Learning" },
    { id: "cs.CV", label: "Computer Vision" },
    { id: "cs.CL", label: "NLP" },
    { id: "cs.RO", label: "Robotics" },
    { id: "cs.CR", label: "Cryptography" }
  ];

  useEffect(() => {
    fetchPapers();
  }, [category]);

  const fetchPapers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/papers/?category=${category}&limit=10`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch papers (${res.status})`);
      }
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Could not load papers. Check backend deploy/CORS and try again.");
    }
    setLoading(false);
  };

  const handleSimplify = async (paperId) => {
    try {
    const res = await fetch(
      `${API_BASE}/papers/${paperId}/simplify`,
      { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setPapers(prev => prev.map(p => 
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
          Loading papers...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {displayName}</h1>
          <p>Discover the latest research in your field</p>
        </div>

        <div className="category-filter">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: "16px", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div className="papers-grid">
          {papers.map((paper, i) => (
        <PaperCard 
            key={i} 
            paper={paper} 
            onSimplify={handleSimplify}
            userId={user?.id}
        />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
