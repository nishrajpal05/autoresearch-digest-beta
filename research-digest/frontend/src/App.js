
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // STATE - variables that React tracks and re-renders when they change
  const [papers, setPapers] = useState([]);  // List of papers
  const [loading, setLoading] = useState(true);  // Are we loading?
  const [error, setError] = useState(null);  // Any errors?
  const [category, setCategory] = useState('cs.AI');  // Current category

  // FETCH PAPERS - runs when component loads or category changes
  useEffect(() => {
    fetchPapers();
  }, [category]);  // Run again when category changes

  // Function to fetch papers from backend
  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call your backend API
      const response = await fetch(
        `http://localhost:8000/papers?category=${category}&limit=10`
      );
      
      const data = await response.json();

      if (data.success) {
        setPapers(data.papers);
      } else {
        setError('Failed to fetch papers');
      }

    } catch (err) {
      setError('Cannot connect to backend. Is it running?');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

 

  // Show loading spinner
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading research papers...</p>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="error-container">
        <h2> Oops!</h2>
        <p>{error}</p>
        <button onClick={fetchPapers} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  // Show main app
  return (
    <div className="App">
      
      {/* HEADER */}
      <header className="header">
        <h1>AutoResearch Digest </h1>
        <p>Latest research papers, simplified</p>
      </header>

      {/* CATEGORY FILTERS */}
      <div className="filters">
        <h3>Choose a domain:</h3>
        <div className="filter-buttons">
          <button 
            className={category === 'cs.AI' ? 'active' : ''}
            onClick={() => setCategory('cs.AI')}
          >
             AI
          </button>
          <button 
            className={category === 'cs.LG' ? 'active' : ''}
            onClick={() => setCategory('cs.LG')}
          >
             Machine Learning
          </button>
          <button 
            className={category === 'cs.CV' ? 'active' : ''}
            onClick={() => setCategory('cs.CV')}
          >
             Computer Vision
          </button>
          <button 
            className={category === 'cs.CL' ? 'active' : ''}
            onClick={() => setCategory('cs.CL')}
          >
             NLP
          </button>
          <button 
            className={category === 'cs.RO' ? 'active' : ''}
            onClick={() => setCategory('cs.RO')}
          >
             Robotics
          </button>
        </div>
      </div>

      {/* PAPERS LIST */}
      <main className="papers-container">
        <h2>{papers.length} Papers Found</h2>
        
        {papers.map((paper, index) => (
          <div key={index} className="paper-card">
            
            {/* Paper number badge */}
            <div className="paper-number">#{index + 1}</div>
            
            {/* Title */}
            <h3 className="paper-title">{paper.title}</h3>
            
            {/* Authors */}
            <p className="paper-authors">
               {paper.authors}
            </p>
            
            {/* Summary */}
            <p className="paper-summary">{paper.summary}</p>
            
            {/* Footer */}
            <div className="paper-footer">
              <span className="paper-date">{paper.published}</span>
              <a 
                href={paper.pdf_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="read-btn"
              >
                Read PDF →
              </a>
            </div>

          </div>
        ))}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>Made with ❤️ by Nishmeet Singh Rajpal</p>
      </footer>

    </div>
  );
}

export default App;