// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase/config';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  // ⚠️ !loading evita el parpadeo al recargar con sesión activa
  if (loading) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#111113',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <svg width="28" height="28" viewBox="0 0 100 100" style={{ opacity: 0.4 }}>
        <text y=".9em" fontSize="90">⬡</text>
      </svg>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#4a7fa8',
            animation: 'pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

return (
  <AuthContext.Provider value={{ user, loading, login, logout, register }}>
    {children}
  </AuthContext.Provider>
);
};
