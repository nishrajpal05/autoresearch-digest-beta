import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import OAuthCallback from "./pages/OAuthCallback"; 
import "./styles/App.css";

function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
        </Routes>
        <Footer />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;


//https://autoresearch-digest-beta-1.onrender.com/
