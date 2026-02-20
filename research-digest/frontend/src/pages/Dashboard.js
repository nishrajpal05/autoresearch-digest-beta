import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PaperCard from "../components/PaperCard";

function Dashboard() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("cs.AI");
  const { token, user } = useContext(AuthContext);
  const displayName = user?.full_name || user?.email?.split('@')[0] || "there";

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
    try {
    //   const res = await fetch(
    //     `https://autoresearch-digest-beta.onrender.com/papers?category=${category}&limit=10`,
    const res = await fetch(
  `https://autoresearch-digest-beta-1.onrender.com//papers?category=${category}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSimplify = async (paperId) => {
    try {
    //   const res = await fetch(
    //     `https://autoresearch-digest-beta.onrender.com/papers/${paperId}/simplify`,
    const res = await fetch(
  `https://autoresearch-digest-beta-1.onrender.com//papers/${paperId}/simplify`,
        { 
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
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

        <div className="papers-grid">
          {papers.map((paper, i) => (
        <PaperCard 
            key={i} 
            paper={paper} 
            onSimplify={handleSimplify}
            token={token}
            userId={user?.id}
        />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
