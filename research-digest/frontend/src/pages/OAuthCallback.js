import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
    } else if (token && userId) {
      login(token, { id: userId });
      navigate('/dashboard');
    }
  }, []);

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Completing login...</p>
    </div>
  );
}

export default OAuthCallback;