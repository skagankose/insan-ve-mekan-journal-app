import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await apiService.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset request failed:", err);
            setError(err.response?.data?.detail || 'Failed to process password reset request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('forgotPassword')}</h1>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {success ? (
                <div className="card">
                    <div className="success-message">
                        {t('passwordResetLinkSent')}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                        <Link to="/login" className="btn btn-primary">
                            {t('backToLogin')}
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="card">
                    <p className="form-description">
                        {t('forgotPasswordInstructions')}
                    </p>
                    
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">{t('email')}</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isSubmitting}
                            placeholder={t('enterEmail')}
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginTop: 'var(--spacing-6)' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting}
                            style={{ width: '100%' }}
                        >
                            {isSubmitting ? t('sending') : t('sendResetLink')}
                        </button>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                        <p className="text-secondary">
                            {t('rememberPassword')} <Link to="/login">{t('backToLogin')}</Link>
                        </p>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ForgotPasswordPage; 