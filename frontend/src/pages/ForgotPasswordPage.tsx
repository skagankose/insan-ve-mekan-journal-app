import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { FaCheckCircle } from 'react-icons/fa';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await apiService.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset request failed:", err);
            const errorMessage = err.response?.data?.detail || '';
            
            // Check for specific error messages and use appropriate translations
            if (errorMessage.includes('No user found with this email address')) {
                setError(t('emailNotFound'));
            } else if (errorMessage.includes('Invalid') || errorMessage.includes('expired') || errorMessage.includes('token')) {
                setError(t('invalidResetToken'));
            } else {
                setError(errorMessage || t('passwordResetFailed') || 'Failed to process password reset request. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{t('forgotPassword')}</h1>
            </div>

            <div className="page-content-section">
                <div className="register-form-container">
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <FaCheckCircle size={56} color="#14B8A6" style={{ marginBottom: '1.5rem' }} />
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                                {t('passwordResetLinkSent')}
                            </h2>
                            <p style={{ fontSize: '1rem', color: '#4B5563', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                                {t('passwordResetCheckEmail') || 'We have sent a password reset link to your email address. Please check your inbox and spam folder.'}
                            </p>
                            <button 
                                type="button"
                                className="btn btn-primary register-submit-button"
                                onClick={() => navigate('/login')}
                            >
                                {t('backToLogin') || 'Back to Login'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="email">{t('email')} *</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            
                            {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary register-submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('sending') : t('sendResetLink')}
                            </button>
                            
                            <div className="register-links">
                                <span>{t('rememberPassword') || "Remember your password?"} </span>
                                <Link to="/login">{t('backToLogin')}</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage; 