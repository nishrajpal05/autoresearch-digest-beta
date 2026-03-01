import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API_BASE_URL from "../config/api";

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

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
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
            style={{ width: '100%', marginBottom: '12px' }}
          >
            🔵 Continue with Google
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            ⚫ Continue with GitHub
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
          Don't have an account? <a href="/register">Sign up</a>
        </div>

      </div>
    </div>
  );
}

export default Login;
