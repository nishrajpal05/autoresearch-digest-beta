import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">AutoResearch</Link>
          
          <div className="nav-links">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Feed</Link>
                <Link to="/bookmarks" className="nav-link">Bookmarks</Link>
                <Link to="/settings" className="nav-link">Settings</Link>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register">
                  <button className="btn btn-primary">Get Started</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;