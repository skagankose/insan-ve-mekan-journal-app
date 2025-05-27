import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import SearchBox from './SearchBox';

const Sidebar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation(); 

  const isActiveLink = (path: string) => location.pathname === path;

  // Always show the sidebar, but with different content based on auth status
  return (
    <aside className="sidebar" style={{
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(0px)',
        borderRight: '1px solid rgba(20, 184, 166, 0.2)'
    }}>
      <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(20, 184, 166, 0.2)', marginBottom: '0px', marginTop: '16px', paddingLeft: '0px', paddingRight: '0px' }}>
      <SearchBox />
      </div>
      
      {/* Add the SearchBox component */}
      
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {/* Removed profile button */}
          
          {/* Removed admin dashboard button */}
          
          {isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner') && (
            <li className="sidebar-menu-item">
              <Link 
                to="/editor/journals" 
                className={`sidebar-link ${isActiveLink('/editor/journals') ? 'active' : ''}`}
              >
                <i className="sidebar-icon">📓</i>
                <span>{t('editorJournals') || 'Editor Journals'}</span>
              </Link>
            </li>
          )}
          
          {isAuthenticated && user && user.role !== 'editor' && user.role !== 'referee' && (
            <li className="sidebar-menu-item">
              <Link 
                to="/entries/new" 
                className={`sidebar-link ${isActiveLink('/entries/new') ? 'active' : ''}`}
              >
                <i className="sidebar-icon">✏️</i>
                <span>{t('submitPaper')}</span>
              </Link>
            </li>
          )}
          
          {/* Always show Previous Issues link */}
          <li className="sidebar-menu-item">
            <Link 
              to="/archive" 
              className={`sidebar-link ${isActiveLink('/archive') ? 'active' : ''}`}
            >
              <i className="sidebar-icon">🗄️</i> 
              <span>{t('publishedIssues')}</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(20, 184, 166, 0.2)', paddingTop: '16px', marginTop: 'auto' }}>
        <p className="sidebar-footer-text" style={{ color: '#475569' }}>
          <span style={{ whiteSpace: 'nowrap' }}>
          © {new Date().getFullYear()} {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
          </span>
        </p>
      </div>
      <style>
          {`
            .sidebar-link {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                color: #475569; /* Default link color */
                text-decoration: none;
                transition: all 0.3s ease;
                border-radius: 8px;
                margin: 4px 0;
                position: relative;
            }
            .sidebar-link:hover {
                background-color: rgba(20, 184, 166, 0.05); /* Subtle turquoise background */
                color: #0D9488; /* Darker turquoise text */
                padding-left: 20px;
            }
            .sidebar-link:hover::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 70%;
                background-color: #14B8A6; /* Turquoise accent */
                border-radius: 0 4px 4px 0;
            }
            .sidebar-link.active {
                background-color: rgba(20, 184, 166, 0.1); /* Slightly darker for active */
                color: #0D9488;
                font-weight: 600;
                padding-left: 20px;
            }
            .sidebar-link.active::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 80%;
                background-color: #14B8A6; /* Turquoise accent */
                border-radius: 0 4px 4px 0;
            }
            .sidebar-icon {
                margin-right: 12px;
                font-size: 1.1em;
            }
          `}
      </style>
    </aside>
  );
};

export default Sidebar; 