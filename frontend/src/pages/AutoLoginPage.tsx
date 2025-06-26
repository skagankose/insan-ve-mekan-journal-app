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
    const { t } = useLanguage();
    
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
                    <p style={{ fontSize: '1rem', color: '#4B5563' }}>
                        {t('redirecting')} <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#14B8A6' }}>({countdown})</span>...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AutoLoginPage; 