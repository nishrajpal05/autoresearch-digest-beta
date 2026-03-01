const LOCAL_API_URL = "http://localhost:8000";
const RENDER_API_URL = "https://autoresearch-digest-beta.onrender.com";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? LOCAL_API_URL
    : RENDER_API_URL);

export default API_BASE_URL;
