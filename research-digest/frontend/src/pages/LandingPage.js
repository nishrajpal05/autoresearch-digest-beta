import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            Research Papers, <span className="gradient-text">Simplified</span>
          </h1>
          <p>
            Stay updated with the latest AI research without the jargon. 
            Get plain-English explanations of cutting-edge papers.
          </p>
          <div className="hero-cta">
            <Link to="/register">
              <button className="btn btn-primary">Start Reading Free</button>
            </Link>
            <Link to="/login">
              <button className="btn btn-secondary">Login</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '16px' }}>
            Why AutoResearch?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '48px' }}>
            Designed for curious minds, not just researchers
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>Latest Research</h3>
              <p>Fresh papers from arXiv, curated by category</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Simplification</h3>
              <p>Complex abstracts translated into plain English</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Personal Library</h3>
              <p>Bookmark papers and build your reading list</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Smart Recommendations</h3>
              <p>Personalized feed based on your interests</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Daily Digest</h3>
              <p>Never miss important papers in your field</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Ready</h3>
              <p>Read on the go, anywhere, anytime</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 0', textAlign: 'center', background: 'white' }}>
        <div className="container">
          <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>
            Ready to stay ahead?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Join researchers, students, and curious minds
          </p>
          <Link to="/register">
            <button className="btn btn-primary" style={{ fontSize: '16px', padding: '16px 32px' }}>
              Get Started for Free
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}

export default LandingPage;