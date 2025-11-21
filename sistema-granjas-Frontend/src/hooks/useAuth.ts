// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import {
  isAuthenticated as checkTokenAuth,
  getUserData,
  logout as apiLogout,
  getToken
} from "../api/auth";

export interface User {
  nombre: string;
  rol: string;
  email: string;
  rol_id: number;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkTokenAuth());
  const [user, setUser] = useState<User | null>(() => getUserData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      setUser(getUserData());
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    await apiLogout(); // Limpia también en backend
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    loading,
    logout,
    token: getToken()
  };
}
