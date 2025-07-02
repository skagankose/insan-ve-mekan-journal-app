import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const AutoLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setAuthState, user } = useAuth();
    const { t, language } = useLanguage();
    
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [countdown, setCountdown] = useState<number>(3);
    const loginAttemptedRef = useRef(false);
    const loginSuccessRef = useRef(false);

    // Effect to handle auto-login
    useEffect(() => {
        const autoLoginWithToken = async () => {
            // Prevent duplicate login attempts
            if (loginAttemptedRef.current) {
                return;
            }
            
            loginAttemptedRef.current = true;
            
            // Get token and userId from URL params
            const token = searchParams.get('token');
            const userId = searchParams.get('userId');
            
            if (!token || !userId) {
                setError(t('invalidLoginLink'));
                setLoading(false);
                return;
            }
            
            try {
                const response = await apiService.loginWithToken(token, parseInt(userId));
                
                // Store the token and update auth state
                if (response.access_token) {
                    // Save token to localStorage
                    localStorage.setItem('authToken', response.access_token);
                    
                    // Update auth context by fetching current user
                    try {
                        const currentUser = await apiService.getCurrentUser();
                        // Update auth context directly
                        setAuthState(true, currentUser);
                        loginSuccessRef.current = true;
                        setLoading(false); // Set loading to false after successful login
                    } catch (authErr) {
                        console.error('Error retrieving user after auto-login:', authErr);
                        setError(t('loginSuccessButUserInfoFailed'));
                        setLoading(false);
                    }
                } else {
                    setError(t('loginFailed'));
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('Auto login failed:', err);
                setError(t('autoLoginFailed'));
                setLoading(false);
            }
        };

        autoLoginWithToken();
    }, [searchParams, t, setAuthState]);

    // Effect to handle countdown and redirect
    useEffect(() => {
        if (loginSuccessRef.current && user) {
            const timer = setInterval(() => {
                setCountdown((prevCount) => {
                    if (prevCount <= 1) {
                        clearInterval(timer);
                        window.location.href = '/'; // Force a full page reload
                        return 0;
                    }
                    return prevCount - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="page-content-section">
                <div className="register-form-container">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <FaCheckCircle size={56} color="#14B8A6" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                            {t('autoLoginProcessing')}
                        </h2>
                        <p style={{ fontSize: '1rem', color: '#4B5563' }}>
                            {t('pleaseWait')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content-section">
                <div className="register-form-container">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <FaTimesCircle size={56} color="#DC2626" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                            {t('loginError')}
                        </h2>
                        <p style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '1.5rem' }}>
                            {error}
                        </p>
                        <button 
                            className="btn btn-primary register-submit-button" 
                            onClick={() => navigate('/login')}
                            style={{ textDecoration: 'none' }}
                        >
                            {t('goToLogin')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content-section">
            <div className="register-form-container">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <FaCheckCircle size={56} color="#14B8A6" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                        {t('loginSuccessful')}
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '2rem' }}>
                        {t('redirecting')} <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#14B8A6' }}>({countdown})</span>...
                    </p>
                    
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                padding: '16px 32px',
                                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(20, 184, 166, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" 
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {language === 'tr' ? 'Ana Sayfa' : 'Go Home'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoLoginPage; 