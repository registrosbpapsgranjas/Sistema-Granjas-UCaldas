// src/hooks/useAuth.ts
import { createContext, useContext, useState, useEffect } from "react";
import {
  isAuthenticated as checkTokenAuth,
  getUserData,
  logout as apiLogout,
  getToken
} from "../api/auth";

export interface User {
  id: number;
  nombre: string;
  rol: string;
  email: string;
  rol_id: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  token: string | null;
}

// Crear el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}

// Función para crear el valor del contexto (sin JSX)
export function useAuthValue(): AuthContextType {
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
    await apiLogout();
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