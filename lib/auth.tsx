import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { apiRequest, setAuthErrorHandler } from "@/lib/api";
import { registerPushToken, clearPushToken } from "@/lib/pushNotifications";
import type { AuthUser, MobileLoginResponse } from "@/types";

SplashScreen.preventAutoHideAsync();

const TOKEN_KEY = "goplay_token";
const USER_KEY  = "goplay_user";

interface AuthContextValue {
  user:      AuthUser | null;
  token:     string | null;
  isLoading: boolean;
  login:     (email: string, password: string) => Promise<void>;
  logout:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearPushToken().catch(() => {});
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  // Register 401 handler so any expired token triggers instant logout
  useEffect(() => {
    setAuthErrorHandler(logout);
  }, [logout]);

  // Restore session from SecureStore on app start
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser) as AuthUser);
          void registerPushToken();
        }
      } catch {
        // corrupt storage — start fresh
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await apiRequest<MobileLoginResponse>("/api/auth/mobile-login", {
      method: "POST",
      body:   JSON.stringify({ email, password }),
    });

    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, res.token),
      SecureStore.setItemAsync(USER_KEY,  JSON.stringify(res.user)),
    ]);

    setToken(res.token);
    setUser(res.user);

    // Register for push notifications after login (fire-and-forget)
    void registerPushToken();
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
