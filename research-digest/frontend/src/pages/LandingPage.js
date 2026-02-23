import { Link } from "react-router-dom";

const featureItems = [
  {
    title: "Latest Research",
    description: "Newly published papers from arXiv organized by category.",
  },
  {
    title: "Clear Summaries",
    description: "Technical abstracts translated into concise plain language.",
  },
  {
    title: "Personal Library",
    description: "Save papers and build a focused reading queue.",
  },
  {
    title: "Smart Feed",
    description: "Recommendations tailored to your interests.",
  },
  {
    title: "Daily Briefing",
    description: "A quick digest of notable papers each day.",
  },
  {
    title: "Cross-Device",
    description: "Read seamlessly across desktop and mobile.",
  },
];

function LandingPage() {
  return (
    <>
      <section className="hero landing-hero">
        <div className="container">
          <p className="hero-kicker">Research intelligence for modern teams</p>
          <h1>
            Research Papers, <span className="gradient-text">Simplified</span>
          </h1>
          <p className="hero-description">
            Follow the latest AI work without spending hours decoding dense papers.
            AutoResearch turns complexity into clear, actionable reading.
          </p>
          <div className="hero-cta">
            <Link to="/register">
              <button className="btn btn-primary">Start Reading Free</button>
            </Link>
            <Link to="/login">
              <button className="btn btn-secondary">Login</button>
            </Link>
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <span>Fresh papers daily</span>
            </div>
            <div className="metric">
              <span>Plain-English summaries</span>
            </div>
            <div className="metric">
              <span>Personalized discovery</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features landing-features">
        <div className="container">
          <div className="section-heading">
            <h2>Why AutoResearch</h2>
            <p>Built for curious minds, product teams, and researchers alike.</p>
          </div>

          <div className="features-grid">
            {featureItems.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-index">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="container">
          <div className="cta-shell">
            <p className="cta-eyebrow">Built for focused research workflows</p>
            <h2>Ready to stay ahead?</h2>
            <p className="cta-subtitle">
              Join researchers, students, and curious readers using AutoResearch
              to turn daily paper discovery into a consistent advantage.
            </p>

            <div className="cta-benefits">
              <span>Daily paper signal</span>
              <span>Clear technical summaries</span>
              <span>Personalized discovery</span>
            </div>

            <div className="cta-actions">
              <Link to="/register">
                <button className="btn btn-primary cta-btn">Get Started for Free</button>
              </Link>
              <Link to="/login">
                <button className="btn btn-secondary cta-btn-secondary">
                  Login to Continue
                </button>
              </Link>
            </div>

            <div className="cta-proof-grid">
              <article className="cta-proof">
                <h3>Daily</h3>
                <p>Fresh paper coverage from top categories.</p>
              </article>
              <article className="cta-proof">
                <h3>Concise</h3>
                <p>Readable breakdowns designed for fast decisions.</p>
              </article>
              <article className="cta-proof">
                <h3>Personal</h3>
                <p>Bookmarks and recommendations adapt to your interests.</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
