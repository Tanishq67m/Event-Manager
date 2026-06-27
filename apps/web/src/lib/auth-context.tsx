"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, User, getStoredUser, setStoredUser, setTokens, clearTokens } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await auth.login({ email, password });
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setStoredUser(result.user);
    setUser(result.user);
  }

  async function register(name: string, email: string, password: string, role: string) {
    const result = await auth.register({ name, email, password, role });
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setStoredUser(result.user);
    setUser(result.user);
  }

  function logout() {
    clearTokens();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isOrganizer: user?.role === "ORGANIZER" || user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
