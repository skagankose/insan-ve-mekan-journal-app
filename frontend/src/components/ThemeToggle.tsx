import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}
      title={theme === 'light' ? t('switchToDark') : t('switchToLight')}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle; 