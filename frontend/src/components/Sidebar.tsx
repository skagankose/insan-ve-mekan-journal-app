import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return null; // Don't show sidebar for unauthenticated users
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{t('navigation')}</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <Link to="/" className="sidebar-link">
              <i className="sidebar-icon">📚</i>
              <span>{t('journals')}</span>
            </Link>
          </li>
          <li className="sidebar-menu-item">
            <Link to="/entries/new" className="sidebar-link">
              <i className="sidebar-icon">✏️</i>
              <span>{t('newEntry')}</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <p className="sidebar-footer-text">Journal App</p>
      </div>
    </aside>
  );
};

export default Sidebar; 