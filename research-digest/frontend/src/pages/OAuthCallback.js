import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const completeOAuthLogin = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=' + error);
        return;
      }

      if (!token || !userId) {
        navigate('/login?error=Missing OAuth callback data');
        return;
      }

      try {
        const response = await fetch("https://autoresearch-digest-beta-1.onrender.com/auth/me", {
        // const response = await fetch("http://localhost:8000auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to load user profile");
        }

        const user = await response.json();
        login(token, user);
      } catch (err) {
        login(token, { id: userId });
      }

      navigate('/dashboard');
    };

    completeOAuthLogin();
  }, [searchParams, login, navigate]);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Completing login...</p>
    </div>
  );
}

export default OAuthCallback;
