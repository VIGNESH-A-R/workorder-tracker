import { createContext, useContext, useEffect, useState } from "react";
import { getToken, setToken, clearToken } from "../../shared/api/client.js";
import { login as apiLogin, getCurrentUser, updateCurrentUser } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(username, password) {
    const { token } = await apiLogin(username, password);
    setToken(token);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  async function updateProfile(data) {
    const updatedUser = await updateCurrentUser(data);
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
