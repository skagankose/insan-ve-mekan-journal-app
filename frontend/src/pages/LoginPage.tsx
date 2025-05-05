import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading } = useAuth();
    const { t } = useLanguage();

    // Determine where to redirect after login
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error("Login failed:", err);
            const detail = err.response?.data?.detail || 'Login failed. Please check your credentials.';
            setError(detail);
        }
    };

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('welcomeBack')}</h1>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="card">
                <div className="form-group">
                    <label htmlFor="username" className="form-label">{t('username')}</label>
                    <input
                        type="text"
                        id="username"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder={t('enterUsername')}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password" className="form-label">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder={t('enterPassword')}
                    />
                </div>
                
                <div className="form-group" style={{ marginTop: 'var(--spacing-6)' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    >
                        {isLoading ? t('signingIn') : t('loginButton')}
                    </button>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <p className="text-secondary">
                        {t('dontHaveAccount')} <Link to="/register">{t('signUp')}</Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginPage; 