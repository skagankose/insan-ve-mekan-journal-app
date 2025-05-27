import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use Link for client-side routing
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';

const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout, isLoading } = useAuth(); // Get auth state and functions
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login after logout
    };

    // Don't render anything until initial auth check is done
    if (isLoading) {
        return null; // Or a loading spinner
    }

    const primaryButtonClass = 'primary-nav-button';
    const outlineButtonClass = 'outline-nav-button';

    return (
        <nav className="navbar" style={{
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(0px)',
            borderBottom: '1px solid rgba(20, 184, 166, 0.2)'
        }}>
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo">
                        <img src="/logo.png" alt="Journal App Logo" className="navbar-logo-image" />
                        <span style={{ whiteSpace: 'nowrap', color: '#1E293B' }}>
                            {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
                        </span>
                    </Link>
                </div>
                
                <div className="navbar-menu" style={{ marginLeft: 'auto' }}>
                    <div className="navbar-end" style={{ gap: '12px' }}>
                        {isAuthenticated && user ? (
                            <>
                                <div className="navbar-item navbar-user" style={{ color: '#475569' }}>
                                    <span className="user-greeting" style={{ color: '#475569'}}>{t('welcome')}, </span>
                                    <span className="user-name" style={{ color: '#1E293B', fontWeight: '600' }}>{user.name}</span>
                                    {user.role === 'admin' && (
                                        <span className="badge badge-admin">Admin</span>
                                    )}
                                    {user.role === 'owner' && (
                                        <span className="badge badge-owner">Owner</span>
                                    )}
                                </div>
                                <Link 
                                    to="/profile" 
                                    className={`navbar-button ${primaryButtonClass}`}
                                >
                                    {t('profile') || 'Profile'}
                                </Link>
                                {(user.role === 'admin' || user.role === 'owner') && (
                                    <Link 
                                        to="/admin" 
                                        className={`navbar-button ${primaryButtonClass}`}
                                    >
                                        {t('adminDashboard')}
                                    </Link>
                                )}
                                <button 
                                    onClick={handleLogout} 
                                    className={`navbar-button ${outlineButtonClass}`}
                                >
                                    {t('logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="navbar-item" style={{ color: '#0D9488', fontWeight: '600' }}>
                                    {t('login')}
                                </Link>
                                <Link to="/register" className={`navbar-button ${primaryButtonClass}`}>
                                    {t('register')}
                                </Link>
                            </>
                        )}
                        
                        <div className="navbar-item">
                            <LanguageToggle />
                        </div>
                    </div>
                </div>
            </div>
            <style>
                {`
                    .${primaryButtonClass} {
                        background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 8px;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        border: none;
                        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
                    }
                    .${primaryButtonClass}:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
                    }
                    .${outlineButtonClass} {
                        background: transparent;
                        color: #0D9488;
                        padding: 8px 16px;
                        border-radius: 8px;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        border: 1px solid #14B8A6;
                    }
                    .${outlineButtonClass}:hover {
                        background: rgba(20, 184, 166, 0.1);
                        color: #0D9488;
                    }
                    .navbar-item a:hover {
                        color: #14B8A6;
                    }
                    .badge-admin, .badge-owner {
                        margin-left: 8px;
                        padding: 3px 8px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        color: white;
                    }
                    .badge-admin {
                        background-color: #0D9488; /* Darker turquoise */
                    }
                    .badge-owner {
                        background-color: #14B8A6; /* Lighter turquoise */
                    }
                `}
            </style>
        </nav>
    );
};

export default Navbar; 