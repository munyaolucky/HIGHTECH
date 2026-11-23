import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type TextScale = 'standard' | 'comfortable' | 'large';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const STORAGE_KEY = 'hitech_portal_theme_v1';
const SCALE_STORAGE_KEY = 'hitech_portal_text_scale_v1';
const MOTION_STORAGE_KEY = 'hitech_portal_reduced_motion_v1';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  const [textScale, setTextScaleState] = useState<TextScale>(() => {
    try {
      const saved = localStorage.getItem(SCALE_STORAGE_KEY);
      if (saved === 'standard' || saved === 'comfortable' || saved === 'large') return saved;
    } catch {
      // ignore storage errors
    }
    return 'standard';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(MOTION_STORAGE_KEY);
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    } catch {
      // ignore storage errors
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-scale-standard', 'text-scale-comfortable', 'text-scale-large');
    root.classList.add(`text-scale-${textScale}`);
    try {
      localStorage.setItem(SCALE_STORAGE_KEY, textScale);
    } catch {
      // ignore storage errors
    }
  }, [textScale]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', reducedMotion);
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, String(reducedMotion));
    } catch {
      // ignore storage errors
    }
  }, [reducedMotion]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  const setTextScale = (scale: TextScale) => setTextScaleState(scale);
  const setReducedMotion = (enabled: boolean) => setReducedMotionState(enabled);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        textScale,
        setTextScale,
        reducedMotion,
        setReducedMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light' as ThemeMode,
      setTheme: () => {},
      toggleTheme: () => {},
      textScale: 'standard' as TextScale,
      setTextScale: () => {},
      reducedMotion: false,
      setReducedMotion: () => {},
    };
  }
  return ctx;
}
