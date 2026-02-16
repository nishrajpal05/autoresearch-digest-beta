import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName
        })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate("/dashboard");
      } else {
        setError(data.detail || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `http://localhost:8000/auth/${provider}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        
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

        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => handleOAuthLogin('google')}
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>🔵</span> Continue with Google
          </button>
          <button 
            onClick={() => handleOAuthLogin('github')}
            className="btn btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>⚫</span> Continue with GitHub
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-secondary)' }}>
          or
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
}

export default Register;