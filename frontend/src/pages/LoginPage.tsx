import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/LoginPage.css';
import '../pages/UserProfilePage.css'; // Import toast styles

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login, loginWithGoogle, isLoading } = useAuth();
    const { t } = useLanguage();

    // Check if user came from registration
    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            setShowToast(true);
            // Remove the parameter from URL
            searchParams.delete('registered');
            setSearchParams(searchParams, { replace: true });
            
            // Auto-hide toast after 8 seconds
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 8000);
            
            return () => clearTimeout(timer);
        }
    }, [searchParams, setSearchParams]);

    const handleToastClose = () => {
        setShowToast(false);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error("Login failed:", err);
            const detail = err.response?.data?.detail;
            if (err.response?.status === 403 && detail === "Please confirm your email address to login.") {
                setError(t('pleaseConfirmEmail'));
            } else {
                setError(t('incorrectCredentials'));
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error("Google login failed:", err);
            setError(t('googleSignInFailed'));
        }
    };

    const handleGoogleError = () => {
        setError(t('googleSignInFailed'));
    };

    if (isLoading) {
        return <div className="loading">{t('loading')}</div>;
    }

    return (
        <div className="login-container">
            {/* Toast Notification */}
            {showToast && (
                <div className="toast-notification">
                    <div className="toast-content toast-success">
                        <div className="toast-icon">✓</div>
                        <div className="toast-message">
                            {t('registrationToastMessage')}
                        </div>
                        <button 
                            className="toast-close"
                            onClick={handleToastClose}
                            type="button"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="login-box">
                <h2>{t('login')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">{t('email')}</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">{t('password')}</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div className="forgot-password-link">
                            <Link to="/forgot-password">{t('forgotPassword')}</Link>
                        </div>
                    </div>
                    <button type="submit" className="login-button">
                        {t('login')}
                    </button>
                </form>

                <div className="divider">
                    <span>{t('or') || 'or'}</span>
                </div>

                <div className="social-login">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="register-links">
                    <span>{t('dontHaveAccount')}</span>
                    <Link to="/register">{t('signUp')}</Link>
                </div>

            </div>
        </div>
    );
};

export default LoginPage; 