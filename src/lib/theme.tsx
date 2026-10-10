import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('finpulse_theme_mode') as ThemeMode;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved;
      }
    } catch {
      // ignore
    }
    // Default to 'dark' mode (Dark Executive High-Contrast Mode) for leadership console
    return 'dark';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (theme === 'light') return false;
    return true; // Default to Dark Executive
  });

  useEffect(() => {
    let activeDark = true;
    if (theme === 'light') {
      activeDark = false;
    } else {
      activeDark = true;
    }

    setIsDark(activeDark);

    const root = document.documentElement;
    if (activeDark) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    }

    try {
      localStorage.setItem('finpulse_theme_mode', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
