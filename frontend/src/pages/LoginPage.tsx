import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { resendConfirmationEmail } from '../services/apiService';
import '../styles/LoginPage.css';
import '../styles/FormattedIdInput.css';
import '../pages/UserProfilePage.css'; // Import toast styles

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
    const [showResendToast, setShowResendToast] = useState(false);
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

    const handleResendToastClose = () => {
        setShowResendToast(false);
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
                setShowEmailNotConfirmed(true);
            } else {
                setError(t('incorrectCredentials'));
                setShowEmailNotConfirmed(false);
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

    const handleResendConfirmationEmail = async () => {
        if (!email) {
            setError(t('enterEmail') || 'Please enter your email address');
            return;
        }

        setIsResendingEmail(true);
        setError(null);

        try {
            await resendConfirmationEmail(email);
            setShowResendToast(true);
            setShowEmailNotConfirmed(false);
            setError(null);
            
            // Auto-hide toast after 5 seconds
            setTimeout(() => {
                setShowResendToast(false);
            }, 5000);
        } catch (err: any) {
            console.error("Resend confirmation email failed:", err);
            const detail = err.response?.data?.detail;
            if (detail === "This email address is already confirmed.") {
                setError(t('emailAlreadyRegistered') || 'This email address is already confirmed.');
            } else if (detail === "No user found with this email address.") {
                setError(t('emailNotFound') || 'No account found with this email address.');
            } else {
                setError(t('resendConfirmationEmailError'));
            }
        } finally {
            setIsResendingEmail(false);
        }
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

            {/* Resend Confirmation Toast */}
            {showResendToast && (
                <div className="toast-notification">
                    <div className="toast-content toast-success">
                        <div className="toast-icon">✓</div>
                        <div className="toast-message">
                            {t('confirmationEmailSent')}
                        </div>
                        <button 
                            className="toast-close"
                            onClick={handleResendToastClose}
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
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
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

                {error && (
                    <div className="error-message">
                        {error}
                        {showEmailNotConfirmed && (
                            <>
                                {' '}
                                <button 
                                    type="button"
                                    onClick={handleResendConfirmationEmail}
                                    disabled={isResendingEmail}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#b91c1c',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        fontSize: 'inherit',
                                        padding: '0',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {isResendingEmail ? t('resendingConfirmationEmail') : t('resendEmailLink')}
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div className="register-links">
                    <span>{t('dontHaveAccount')}</span>
                    <Link to="/register">{t('signUp')}</Link>
                </div>

            </div>
        </div>
    );
};

export default LoginPage; 