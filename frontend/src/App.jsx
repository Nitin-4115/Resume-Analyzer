// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import AdminPage from './AdminPage';
import LoginPage from './LoginPage';
import ProtectedRoute from './ProtectedRoute';
import AnalyzerPage from './AnalyzerPage';
import KeywordSearchPage from './KeywordSearchPage';

const API_BASE_URL = 'http://127.0.0.1:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const navigate = useNavigate();

  const handleLoginSuccess = (newToken, newUsername) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    navigate('/login');
  };
  
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  const navLinkStyle = ({ isActive }) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: isActive ? '#ffffff' : '#94a3b8',
    backgroundColor: isActive ? 'rgba(0, 188, 212, 0.3)' : 'transparent',
    transition: 'background-color 0.3s, color 0.3s'
  });

  return (
    <div className="text-white min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">
              AI Resume Analyzer
            </h1>
            <p className="mt-2 text-slate-400">Your intelligent placement assistant.</p>
          </div>
          <nav className="mt-4 md:mt-0 flex gap-2 p-1 bg-black/30 border border-white/20 rounded-lg backdrop-blur-sm items-center">
            <NavLink to="/" style={navLinkStyle}>Analyzer</NavLink>
            <NavLink to="/keyword-search" style={navLinkStyle}>Keyword Search</NavLink>
            <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink>
            {token && <button onClick={handleLogout} className="ml-2 text-sm text-slate-400 hover:text-white px-2 py-1">Logout</button>}
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<AnalyzerPage />} />
            <Route path="/keyword-search" element={<KeywordSearchPage />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute token={token}>
                  <AdminPage username={username} token={token} />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;