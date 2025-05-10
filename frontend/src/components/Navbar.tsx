import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use Link for client-side routing
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

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

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo">
                        <img src="/logo.png" alt="Journal App Logo" className="navbar-logo-image" />
                        {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
                    </Link>
                </div>
                
                <div className="navbar-menu">
                    <div className="navbar-start">
                        {isAuthenticated && user && user.role === 'admin' && (
                            <Link to="/" className="navbar-item">
                                {t('journals')}
                            </Link>
                        )}
                        {isAuthenticated && user && user.role === 'admin' && (
                            <Link to="/admin" className="navbar-item">
                                Admin
                            </Link>
                        )}
                    </div>
                    
                    <div className="navbar-end">
                        {isAuthenticated && user ? (
                            <>
                                <div className="navbar-item navbar-user">
                                    <span className="user-greeting">{t('welcome')}, </span>
                                    <span className="user-name">{user.username}</span>
                                    {user.role === 'admin' && (
                                        <span className="badge badge-admin">Admin</span>
                                    )}
                                </div>
                                <button 
                                    onClick={handleLogout} 
                                    className="btn btn-outline navbar-button"
                                >
                                    {t('logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="navbar-item">
                                    {t('login')}
                                </Link>
                                <Link to="/register" className="btn btn-primary navbar-button">
                                    {t('register')}
                                </Link>
                            </>
                        )}
                        
                        {/* Theme Toggle Button */}
                        <div className="navbar-item">
                            <ThemeToggle />
                        </div>
                        
                        {/* Language Toggle Button */}
                        <div className="navbar-item">
                            <LanguageToggle />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 