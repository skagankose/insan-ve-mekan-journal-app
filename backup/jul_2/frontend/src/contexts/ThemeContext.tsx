import React, { createContext, useContext, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always use light theme
  useEffect(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 