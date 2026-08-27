import { createContext, useContext, useEffect, useState } from "react";
import * as api from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!api.getToken()) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      } catch {
        api.clearToken();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(username, password) {
    const { token } = await api.login(username, password);
    api.setToken(token);
    const currentUser = await api.getCurrentUser();
    setUser(currentUser);
  }

  function logout() {
    api.clearToken();
    setUser(null);
  }

  async function updateProfile(data) {
    const updatedUser = await api.updateCurrentUser(data);
    setUser(updatedUser);
    return updatedUser;
  }

  const value = { user, loading, isAuthenticated: Boolean(user), login, logout, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
