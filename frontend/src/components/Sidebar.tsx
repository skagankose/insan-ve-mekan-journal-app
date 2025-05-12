import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();

  // Always show the sidebar, but with different content based on auth status
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{t('navigation')}</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {/* Admin navigation items */}
          {isAuthenticated && user && user.role === 'admin' && (
            <li className="sidebar-menu-item">
              <Link to="/" className="sidebar-link">
                <i className="sidebar-icon">📚</i>
                <span>{t('journals')}</span>
              </Link>
            </li>
          )}
          
          {isAuthenticated && user && user.role === 'admin' && (
            <li className="sidebar-menu-item">
              <Link to="/admin" className="sidebar-link">
                <i className="sidebar-icon">⚙️</i>
                <span>Admin</span>
              </Link>
            </li>
          )}
          
          {isAuthenticated && user && (user.role === 'editor' || user.role === 'admin') && (
            <li className="sidebar-menu-item">
              <Link to="/editor" className="sidebar-link">
                <i className="sidebar-icon">✏️</i>
                <span>{t('editor') || 'Editor'}</span>
              </Link>
            </li>
          )}
          
          {isAuthenticated && user && (user.role === 'editor' || user.role === 'admin') && (
            <li className="sidebar-menu-item">
              <Link to="/editor/journals" className="sidebar-link">
                <i className="sidebar-icon">📓</i>
                <span>{t('editorJournals') || 'My Journals'}</span>
              </Link>
            </li>
          )}
          
          {/* Show New Entry link only for authenticated users */}
          {isAuthenticated && (
            <li className="sidebar-menu-item">
              <Link to="/entries/new" className="sidebar-link">
                <i className="sidebar-icon">✏️</i>
                <span>{t('newEntry')}</span>
              </Link>
            </li>
          )}
          
          {/* Always show Previous Issues link */}
          <li className="sidebar-menu-item">
            <Link to="/archive" className="sidebar-link">
              <i className="sidebar-icon">🗄️</i> 
              <span>{t('previousIssues')}</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <p className="sidebar-footer-text">
        <span style={{ whiteSpace: 'nowrap' }}>
                            {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
                        </span>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar; 