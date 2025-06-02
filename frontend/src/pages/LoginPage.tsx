import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { login, loginWithGoogle, isLoading } = useAuth();
    const { t } = useLanguage();

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
                setError(detail);
            } else {
                setError(detail || 'Login failed. Please check your credentials.');
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error("Google login failed:", err);
            setError('Google login failed. Please try again.');
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
    };

    if (isLoading) {
        return <div className="loading">{t('loading')}</div>;
    }

    return (
        <div className="login-container">
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

            </div>
        </div>
    );
};

export default LoginPage; 