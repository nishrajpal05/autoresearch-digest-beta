import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.55-5.16 3.55-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.73-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.32A7.2 7.2 0 0 1 4.94 12c0-.81.14-1.6.37-2.32v-3.1H1.3A12 12 0 0 0 0 12c0 1.93.46 3.76 1.3 5.42l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.3 6.58l4.01 3.1c.94-2.83 3.58-4.93 6.69-4.93Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.17c-3.22.7-3.9-1.39-3.9-1.39-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.71 1.25 3.37.96.1-.75.4-1.26.73-1.55-2.58-.3-5.28-1.3-5.28-5.76 0-1.27.45-2.3 1.2-3.12-.12-.3-.52-1.5.12-3.13 0 0 .98-.31 3.2 1.19a10.95 10.95 0 0 1 5.82 0c2.21-1.5 3.19-1.19 3.19-1.19.64 1.63.24 2.83.12 3.13.75.82 1.2 1.85 1.2 3.12 0 4.48-2.71 5.46-5.3 5.75.41.36.79 1.08.79 2.18v3.23c0 .31.2.66.8.55A11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  );
}

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {

      const res = await fetch("https://autoresearch-digest-beta-1.onrender.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate("/dashboard");
      } else {
        setError(data.detail || "Login failed");
      }

    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `https://autoresearch-digest-beta-1.onrender.com/auth/${provider}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Welcome Back</h2>

        {error && (
          <div style={{
            padding: '12px',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* OAuth buttons */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => handleOAuthLogin('google')}
            className="btn btn-secondary"
            style={{
              width: '100%',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <GitHubIcon />
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-secondary)' }}>
          or
        </div>

        {/* Email login */}
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Login
          </button>

        </form>

        <div className="auth-footer">
          Don't have an account? <a href="#/register">Sign up</a>
        </div>

      </div>
    </div>
  );
}

export default Login;
