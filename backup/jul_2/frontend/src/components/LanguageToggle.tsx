import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-outline language-toggle"
      aria-label={t('language')}
      title={t('language')}
    >
      {language === 'en' ? 'TR' : 'EN'}
    </button>
  );
};

export default LanguageToggle; 