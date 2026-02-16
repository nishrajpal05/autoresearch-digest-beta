import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Feed() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("cs.AI");
  const [simplifying, setSimplifying] = useState({});
  const { token, user, logout } = useContext(AuthContext);

  useEffect(() => {
    fetchPapers();
  }, [category]);

  const fetchPapers = async () => {
    setLoading(true);
    const res = await fetch(
      `https://autoresearch-digest-beta.onrender.com/papers?category=${category}&limit=10`,
      { headers: { Authorization: `Bearer ${token}` }}
    );
    const data = await res.json();
    setPapers(data.papers || []);
    setLoading(false);
  };

  const simplifyPaper = async (paperId) => {
    setSimplifying(prev => ({ ...prev, [paperId]: true }));
    const res = await fetch(
      `https://autoresearch-digest-beta.onrender.com/papers/${paperId}/simplify`,
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
    setSimplifying(prev => ({ ...prev, [paperId]: false }));
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="App">
      <header className="header">
        <h1>AutoResearch Digest</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <div className="filters">
        <button className={category === "cs.AI" ? "active" : ""} onClick={() => setCategory("cs.AI")}>AI</button>
        <button className={category === "cs.LG" ? "active" : ""} onClick={() => setCategory("cs.LG")}>ML</button>
        <button className={category === "cs.CV" ? "active" : ""} onClick={() => setCategory("cs.CV")}>CV</button>
      </div>

      <main className="papers-container">
        {papers.map((paper, i) => (
          <div key={i} className="paper-card">
            <h3>{paper.title}</h3>
            <p className="authors">{paper.authors}</p>
            <p className="summary">{paper.summary}</p>
            
            {paper.simplified && (
              <div className="simplified">
                <h4>Simple Explanation:</h4>
                <p>{paper.simplified}</p>
              </div>
            )}
            
            <button 
              onClick={() => simplifyPaper(paper.db_id)}
              disabled={simplifying[paper.db_id]}
            >
              {simplifying[paper.db_id] ? "Simplifying..." : "Explain Simply"}
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}

export default Feed;