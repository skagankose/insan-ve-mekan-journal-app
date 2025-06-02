import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import SearchBox from './SearchBox';
import LanguageToggle from './LanguageToggle';
import { MdEdit, MdArchive, MdDashboard } from 'react-icons/md';

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
        borderRight: '1.5px solid rgba(20, 184, 166, 0.6)'
    }}>
      <div className="sidebar-header">
        <div className="sidebar-search-container">
          <SearchBox/>
        </div>
      </div>
      
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
                <MdDashboard className="sidebar-icon" />
                <div className="sidebar-link-content">
                  <span className="sidebar-link-title">{t('editorJournals') || 'Editor Journals'}</span>
                </div>
              </Link>
            </li>
          )}
          
          {isAuthenticated && user && user.role !== 'editor' && user.role !== 'referee' && (
            <li className="sidebar-menu-item">
              <Link 
                to="/entries/new" 
                className={`sidebar-link ${isActiveLink('/entries/new') ? 'active' : ''}`}
              >
                <MdEdit className="sidebar-icon" />
                <div className="sidebar-link-content">
                  <span className="sidebar-link-title">{t('submitPaper')}</span>
                </div>
              </Link>
            </li>
          )}
          
          {/* Always show Previous Issues link */}
          <li className="sidebar-menu-item">
            <Link 
              to="/archive" 
              className={`sidebar-link ${isActiveLink('/archive') ? 'active' : ''}`}
            >
              <MdArchive className="sidebar-icon" />
              <div className="sidebar-link-content">
                <span className="sidebar-link-title">{t('publishedIssues')}</span>
              </div>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer" style={{ borderTop: '1.5px solid rgba(20, 184, 166, 0.4)', paddingTop: '16px', marginTop: 'auto' }}>
        <div className="sidebar-footer-content">
          <div className="sidebar-language-toggle">
            <LanguageToggle />
          </div>
          <p className="sidebar-footer-text">
            © {new Date().getFullYear()} {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
          </p>
        </div>
      </div>
      <style>
          {`
            .sidebar-search-container .search-input {
                font-size: 16px !important;
                padding: 12px 15px 12px 40px !important;
            }
            .sidebar-search-container .search-input::placeholder {
                font-size: 16px !important;
            }
            .sidebar-footer-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            .sidebar-language-toggle {
                display: flex;
                justify-content: center;
            }
            .sidebar-language-toggle .language-toggle {
                background: rgba(20, 184, 166, 0.1);
                border: 1px solid rgba(20, 184, 166, 0.3);
                color: #0D9488;
                font-size: 14px;
                font-weight: 600;
                padding: 8px 16px;
                border-radius: 20px;
                transition: all 0.2s ease;
                min-width: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .sidebar-language-toggle .language-toggle:hover {
                background: rgba(20, 184, 166, 0.2);
                border-color: rgba(20, 184, 166, 0.5);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(20, 184, 166, 0.2);
            }
            .sidebar-link {
                display: flex;
                align-items: flex-start;
                padding: 20px 24px;
                color: #000000;
                text-decoration: none;
                transition: all 0.2s ease;
                border-radius: 12px;
                margin: 6px 16px;
                position: relative;
                background: rgba(255, 255, 255, 0.6);
                border: 1px solid rgba(20, 184, 166, 0.15);
            }
            .sidebar-link:hover {
                background: rgba(255, 255, 255, 0.95);
                border-color: rgba(20, 184, 166, 0.4);
                box-shadow: 0 6px 20px rgba(20, 184, 166, 0.12);
                text-decoration: none;
            }
            .sidebar-link.active {
                background: linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%);
                border-color: rgba(20, 184, 166, 0.5);
                box-shadow: 0 8px 25px rgba(20, 184, 166, 0.18);
                text-decoration: none;
            }
            .sidebar-icon {
                font-size: 1.6rem;
                margin-right: 16px;
                margin-top: 2px;
                color: #000000;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            .sidebar-link:hover .sidebar-icon {
                color: #0D9488;
                transform: scale(1.05);
            }
            .sidebar-link.active .sidebar-icon {
                color: #0D9488;
            }
            .sidebar-link-content {
                display: flex;
                flex-direction: column;
                gap: 6px;
                flex: 1;
            }
            .sidebar-link-title {
                font-weight: 600;
                color: #000000;
                font-size: 1rem;
                transition: color 0.2s ease;
            }
            .sidebar-link:hover .sidebar-link-title {
                color: #0D9488;
            }
            .sidebar-link.active .sidebar-link-title {
                color: #0D9488;
                font-weight: 700;
            }
            .sidebar-link-description {
                font-size: 0.85rem;
                color: #64748B;
                transition: color 0.2s ease;
                line-height: 1.4;
            }
            .sidebar-link:hover .sidebar-link-description {
                color: #475569;
            }
            .sidebar-link.active .sidebar-link-description {
                color: #475569;
            }
            .sidebar-footer-text {
                font-size: 0.9rem;
                color: #64748B;
                margin: 0;
                text-align: center;
            }
          `}
      </style>
    </aside>
  );
};

export default Sidebar; 