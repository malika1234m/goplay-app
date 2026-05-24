import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "react-native";
import { LightColors, DarkColors } from "@/constants/colors";

const THEME_KEY = "goplay_theme";

type ColorPalette = typeof LightColors;

interface ThemeContextValue {
  isDark:      boolean;
  toggleTheme: () => void;
  colors:      ColorPalette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [isDark, setIsDark] = useState(system === "dark");

  // Load persisted preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((val) => {
      if (val === "dark")  setIsDark(true);
      if (val === "light") setIsDark(false);
      // null = follow system
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? DarkColors : LightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/** Drop-in replacement for `import { Colors } from "@/constants/colors"` */
export function useColors(): ColorPalette {
  return useTheme().colors;
}
