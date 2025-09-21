// frontend/src/LoginPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${API_BASE_URL}/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Store token and username
      onLoginSuccess(response.data.access_token, response.data.username);

      // ✅ Fix: redirect to /admin (your dashboard)
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg max-w-sm mx-auto">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">Admin Login</h2>
      <form onSubmit={handleLogin} className="w-full space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-bold text-lg transition-colors"
        >
          Login
        </button>
      </form>
      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
    </div>
  );
};

export default LoginPage;
