import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use Link for client-side routing
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { FaUsers } from 'react-icons/fa';
import { MdArticle } from 'react-icons/md';

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
        <nav className="navbar">
            <div className="navbar-container" style={{ padding: '0 10px' }}>
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo" style={{
                        gap: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                    }}>
                        <div className="navbar-logo-container" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
                            position: 'relative'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <MdArticle style={{
                                    fontSize: '24px',
                                    color: 'white',
                                    position: 'relative',
                                    zIndex: 2
                                }} />
                                <FaUsers style={{
                                    fontSize: '16px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-40%, -40%)',
                                    zIndex: 1
                                }} />
                            </div>
                        </div>
                        <div className="navbar-title-container">
                            <span className="navbar-title-text" style={{
                                fontWeight: '700',
                                fontSize: '1.5rem',
                                letterSpacing: '-0.02em',
                                lineHeight: '1.2'
                            }}>
                                {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
                            </span>
                            <span className="navbar-subtitle-text" style={{
                                fontWeight: '600',
                                fontSize: '0.850rem',
                                letterSpacing: '0.025em',
                                marginTop: '-2px',
                                display: 'block'
                            }}>
                                {language === 'en' ? 'Academy Platform' : 'Akademi Platformu'}
                            </span>
                        </div>
                    </Link>
                </div>
                
                <div className="navbar-menu" style={{ marginLeft: 'auto', gap: '24px' }}>
                    <div className="navbar-end" style={{ gap: '16px', alignItems: 'center' }}>
                        {/* Add navigation links for public pages */}
                        <Link to="/about" className="navbar-item" style={{
                            color: '#0D9488',
                            fontWeight: '600',
                            position: 'relative',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                        }}>
                            {t('about')}
                        </Link>
                        <Link to="/general-info" className="navbar-item" style={{
                            color: '#0D9488',
                            fontWeight: '600',
                            position: 'relative',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                        }}>
                            {t('generalInformation')}
                        </Link>
                        
                        {isAuthenticated && user ? (
                            <>
                                <div className="navbar-item navbar-user" style={{
                                    background: 'rgba(20, 184, 166, 0.1)',
                                    border: '1px solid rgba(20, 184, 166, 0.15)',
                                    padding: '8px 16px',
                                    borderRadius: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span className="user-greeting" style={{ color: '#475569' }}>{t('welcome')}, </span>
                                    <span className="user-name" style={{
                                        color: '#0D9488',
                                        fontWeight: '600',
                                        position: 'relative'
                                    }}>{user.name}</span>
                                    {user.role === 'admin' && (
                                        <span className="badge badge-admin" style={{
                                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                            boxShadow: '0 2px 4px rgba(20, 184, 166, 0.2)'
                                        }}>Admin</span>
                                    )}
                                    {user.role === 'owner' && (
                                        <span className="badge badge-owner" style={{
                                            background: 'linear-gradient(135deg, #0D9488 0%, #0B7A6E 100%)',
                                            boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)'
                                        }}>Owner</span>
                                    )}
                                </div>
                                <LanguageToggle />
                                <Link 
                                    to="/profile" 
                                    className={`navbar-button ${primaryButtonClass} no-text-hover`}
                                    style={{ position: 'relative' }}
                                >
                                    {t('profile') || 'Profile'}
                                </Link>
                                {(user.role === 'admin' || user.role === 'owner') && (
                                    <Link 
                                        to="/admin" 
                                        className={`navbar-button ${primaryButtonClass} no-text-hover`}
                                        style={{ position: 'relative' }}
                                    >
                                        {t('adminDashboard')}
                                    </Link>
                                )}
                                <button 
                                    onClick={handleLogout} 
                                    className={`navbar-button ${outlineButtonClass}`}
                                    style={{ position: 'relative' }}
                                >
                                    {t('logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <LanguageToggle />
                                <Link to="/login" className="navbar-item" style={{
                                    color: '#0D9488',
                                    fontWeight: '600',
                                    position: 'relative',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {t('login')}
                                </Link>
                                <Link to="/register" className={`navbar-button ${primaryButtonClass} no-text-hover`} style={{
                                    position: 'relative'
                                }}>
                                    {t('register')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <style>
                {`
                    .navbar-logo-container::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
                        border-radius: 12px;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    
                    .navbar-logo:hover .navbar-logo-container::before {
                        opacity: 1;
                    }
                    
                    .navbar-logo:hover .navbar-logo-container {
                        transform: translateY(0px);
                        box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4);
                    }
                    
                    .navbar-title-container {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .navbar-title-text {
                        color: #1E293B;
                        transition: all 0.3s ease;
                    }
                    
                    .navbar-subtitle-text {
                        color: #0D9488;
                        transition: all 0.3s ease;
                    }
                    
                    .navbar-logo:hover .navbar-title-text {
                        color: #0D9488 !important;
                        transform: scale(1.05);
                    }
                    
                    .navbar-logo:hover .navbar-subtitle-text {
                        color: #0D9488 !important;
                    }
                    
                    .${primaryButtonClass} {
                        background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 10px;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        border: none;
                        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
                        position: relative;
                        overflow: hidden;
                    }
                    .${primaryButtonClass}:hover {
                        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
                    }
                    .${primaryButtonClass}.no-text-hover:hover {
                        color: white;
                        text-decoration: none;
                    }
                    .${primaryButtonClass}::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    .${primaryButtonClass}:hover::after {
                        opacity: 1;
                    }
                    .${outlineButtonClass} {
                        background: transparent;
                        color: #0D9488;
                        padding: 10px 20px;
                        border-radius: 10px;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        border: 1px solid #14B8A6;
                        position: relative;
                        overflow: hidden;
                    }
                    .${outlineButtonClass}:hover {
                        background: rgba(20, 184, 166, 0.1);
                        color: #0D9488;
                        border-color: #0D9488;
                    }
                    .navbar-item a:hover {
                        color: #0D9488;
                        background: rgba(20, 184, 166, 0.1);
                    }
                    .badge {
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        color: white;
                        letter-spacing: 0.5px;
                    }
                    .navbar-end .language-toggle {
                        background: rgba(20, 184, 166, 0.1);
                        border: 1px solid rgba(20, 184, 166, 0.15);
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
                        margin-right: 8px;
                        outline: none;
                    }
                    .navbar-end .language-toggle:hover {
                        background: rgba(20, 184, 166, 0.2);
                        border-color: rgba(20, 184, 166, 0.25);
                        transform: translateY(-1px);
                        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.2);
                        outline: none;
                    }
                `}
            </style>
        </nav>
    );
};

export default Navbar; 