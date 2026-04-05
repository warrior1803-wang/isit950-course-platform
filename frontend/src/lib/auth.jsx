import { createContext, useContext, useState, useEffect } from 'react';
import api from './axios';
import { MOCK_USERS } from '../mock/users';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Sprint 2 — resolve mock tokens locally without hitting the backend.
    // Token format: "mock-token-{role}-{id}"
    // TODO Sprint 3: remove this block and rely solely on the API call below.
    if (token.startsWith('mock-token-')) {
      const cached = localStorage.getItem('auth_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      } else {
        // Fallback: try to match against the static mock user list
        const parts = token.split('-'); // ['mock','token',role,id]
        const id = Number(parts[parts.length - 1]);
        setUser(MOCK_USERS.find(u => u.id === id) ?? null);
      }
      setLoading(false);
      return;
    }

    // Sprint 3 — real API validation
    api
      .get('/auth/me')
      .then(res => setUser(res.data.user ?? res.data))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function login(newToken, userData) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
