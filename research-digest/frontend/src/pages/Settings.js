import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

function Settings() {
  const { user, token, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    preferredCategories: "cs.AI"
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || "",
        email: user.email || "",
        preferredCategories: user.preferred_categories || "cs.AI"
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Settings</h1>
          <p>Manage your account preferences</p>
        </div>

        <div style={{ maxWidth: '600px' }}>
          <div className="auth-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '24px' }}>Profile Information</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  disabled
                  style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Preferred Category</label>
                <select 
                  value={formData.preferredCategories}
                  onChange={(e) => setFormData({...formData, preferredCategories: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '15px'
                  }}
                >
                  <option value="cs.AI">Artificial Intelligence</option>
                  <option value="cs.LG">Machine Learning</option>
                  <option value="cs.CV">Computer Vision</option>
                  <option value="cs.CL">NLP</option>
                  <option value="cs.RO">Robotics</option>
                  <option value="cs.CR">Cryptography</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
              >
                {saved ? "✓ Saved!" : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="auth-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Account</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Member since {new Date().toLocaleDateString()}
            </p>
            <button 
              onClick={logout}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>

          <div className="auth-card" style={{ border: '1px solid var(--danger)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--danger)' }}>
              Danger Zone
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Once you delete your account, there is no going back.
            </p>
            <button 
              className="btn btn-secondary"
              style={{ 
                width: '100%',
                color: 'var(--danger)',
                borderColor: 'var(--danger)'
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;