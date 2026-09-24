import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from '@/lib/secure-storage';

import { API_URL } from '@/constants/api';

const TOKEN_KEY = 'seats_auth_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Au démarrage de l'app : on relit le token sauvegardé et on vérifie qu'il est encore valide
  useEffect(() => {
    (async () => {
      try {
        const tokenSauvegarde = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!tokenSauvegarde) return;

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${tokenSauvegarde}` },
        });
        if (!res.ok) throw new Error('Token invalide ou expiré');

        const json = await res.json();
        setToken(tokenSauvegarde);
        setUser(json.data);
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setChargementInitial(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erreur de connexion');

    await SecureStore.setItemAsync(TOKEN_KEY, json.data.token);
    setToken(json.data.token);
    setUser(json.data.user);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, chargementInitial, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
  return ctx;
}