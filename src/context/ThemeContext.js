import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT, DARK } from "../theme";

const STORAGE_KEY = "@theme_mode";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  // "system" | "light" | "dark"
  const [mode, setMode] = useState("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val === "light" || val === "dark") setMode(val);
      })
      .finally(() => setLoaded(true));
  }, []);

  const resolvedMode =
    mode === "system" ? (systemScheme === "light" ? "light" : "dark") : mode;

  const colors = resolvedMode === "light" ? LIGHT : DARK;
  const isDark = resolvedMode === "dark";

  const setThemeMode = async (newMode) => {
    setMode(newMode);
    await AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
