import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import SearchBox from './SearchBox';

const Sidebar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();

  // Always show the sidebar, but with different content based on auth status
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{t('navigation')}</h2>
      </div>
      
      {/* Add the SearchBox component */}
      <SearchBox />
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {/* Removed profile button */}
          
          {/* Removed admin dashboard button */}
          
          {isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner') && (
            <li className="sidebar-menu-item">
              <Link to="/editor/journals" className="sidebar-link">
                <i className="sidebar-icon">📓</i>
                <span>{t('editorJournals') || 'Editor Journals'}</span>
              </Link>
            </li>
          )}
          
          {isAuthenticated && user && user.role !== 'editor' && user.role !== 'referee' && (
            <li className="sidebar-menu-item">
              <Link to="/entries/new" className="sidebar-link">
                <i className="sidebar-icon">✏️</i>
                <span>{t('submitPaper')}</span>
              </Link>
            </li>
          )}
          
          {/* Always show Previous Issues link */}
          <li className="sidebar-menu-item">
            <Link to="/archive" className="sidebar-link">
              <i className="sidebar-icon">🗄️</i> 
              <span>{t('publishedIssues')}</span>
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