import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        // Check if token exists
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
            return;
        }

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setIsSubmitting(true);

        try {
            await apiService.resetPassword(token, password);
            setSuccess(true);
            
            // Redirect to login after success
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error("Password reset failed:", err);
            setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired. Please request a new password reset.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('resetPassword')}</h1>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {success ? (
                <div className="card">
                    <div className="success-message">
                        {t('passwordResetSuccess')}
                    </div>
                    <p className="text-secondary" style={{ textAlign: 'center' }}>
                        {t('redirectingToLogin')}
                    </p>
                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                        <Link to="/login" className="btn btn-primary">
                            {t('goToLogin')}
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="card">
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">{t('newPassword')}</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isSubmitting}
                            placeholder={t('enterNewPassword')}
                            minLength={8}
                            maxLength={100}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">{t('confirmPassword')}</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isSubmitting}
                            placeholder={t('confirmNewPassword')}
                            minLength={8}
                            maxLength={100}
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginTop: 'var(--spacing-6)' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting}
                            style={{ width: '100%' }}
                        >
                            {isSubmitting ? t('resetting') : t('resetPassword')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ResetPasswordPage; 