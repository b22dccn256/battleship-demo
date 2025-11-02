import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import LandingPage from '@/pages/LandingPage';
import Lobby from '@/pages/Lobby';
import Game from '@/pages/Game';
import Leaderboard from '@/pages/Leaderboard';
import History from '@/pages/History';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          token ? <Navigate to="/lobby" /> : <LandingPage onLogin={login} />
        } />
        <Route path="/lobby" element={
          token ? <Lobby token={token} user={user} onLogout={logout} /> : <Navigate to="/" />
        } />
        <Route path="/game/:roomCode" element={
          token ? <Game token={token} user={user} onLogout={logout} /> : <Navigate to="/" />
        } />
        <Route path="/leaderboard" element={
          token ? <Leaderboard token={token} user={user} onLogout={logout} /> : <Navigate to="/" />
        } />
        <Route path="/history" element={
          token ? <History token={token} user={user} onLogout={logout} /> : <Navigate to="/" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;