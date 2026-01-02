/**
 * @module lib/theme
 * ThemeProvider component for light and dark mode support.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './theme-context';
import type { Theme } from './theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    return (stored as Theme) || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const applied: Theme = theme;
    root.classList.remove('light', 'dark');
    root.classList.add(applied);
    // persist chosen theme
    localStorage.setItem('theme', theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
}
