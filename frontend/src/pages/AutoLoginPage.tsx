import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './AutoLoginPage.css';

const AutoLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setAuthState, user } = useAuth();
    const { t } = useLanguage();
    
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
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

    // Effect to navigate after user is set
    useEffect(() => {
        if (loginSuccessRef.current && user) {
            // Short delay to ensure everything is properly loaded
            setTimeout(() => {
                window.location.href = '/'; // Force a full page reload
            }, 300);
        }
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="auto-login-page">
                <div className="loading-container">
                    <img src="/book.gif" alt="Loading" className="loading-spinner" />
                    <p>{t('pleaseWait')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="auto-login-page">
                <div className="error-container">
                    <div className="error-icon">
                        <FaTimesCircle />
                    </div>
                    <h2>{t('loginError')}</h2>
                    <p className="error-message">{error}</p>
                    <button 
                        className="login-button" 
                        onClick={() => navigate('/login')}
                    >
                        {t('goToLogin')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auto-login-page">
            <div className="success-container">
                <div className="success-icon">
                    <FaCheckCircle />
                </div>
                <p>{t('redirecting')}</p>
            </div>
        </div>
    );
};

export default AutoLoginPage; 