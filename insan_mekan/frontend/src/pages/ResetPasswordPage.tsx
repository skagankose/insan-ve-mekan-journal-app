import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState<number>(3);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const validatePassword = (passwordToValidate: string): boolean => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(passwordToValidate);
        const hasLowerCase = /[a-z]/.test(passwordToValidate);
        const hasNumbers = /\d/.test(passwordToValidate);

        if (passwordToValidate.length < minLength) {
            setPasswordError(t('passwordMinLength'));
            return false;
        }
        if (!hasUpperCase || !hasLowerCase) {
            setPasswordError(t('passwordCase'));
            return false;
        }
        if (!hasNumbers) {
            setPasswordError(t('passwordNumber'));
            return false;
        }
        if (passwordToValidate !== confirmPassword) {
            setPasswordError(t('passwordMatch'));
            return false;
        }

        setPasswordError(null);
        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setPasswordError(null);

        if (!token) {
            setError(t('invalidResetLink') || 'Invalid reset link. Please request a new password reset.');
            return;
        }

        if (!validatePassword(password)) {
            return;
        }

        setIsSubmitting(true);

        try {
            await apiService.resetPassword(token, password);
            setSuccess(true);
            
            // Start countdown timer
            const timer = setInterval(() => {
                setCountdown((prevCount) => {
                    if (prevCount <= 1) {
                        clearInterval(timer);
                        navigate('/login?reset=success');
                        return 0;
                    }
                    return prevCount - 1;
                });
            }, 1000);

        } catch (err: any) {
            console.error("Password reset failed:", err);
            setError(err.response?.data?.detail || t('passwordResetFailed') || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {!success && (
                <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                    <h1>{t('resetPassword')}</h1>
                </div>
            )}

            <div className="page-content-section">
                <div className="register-form-container">
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <FaCheckCircle size={56} color="#14B8A6" style={{ marginBottom: '1.5rem' }} />
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                                {t('passwordResetSuccess')}
                            </h2>
                            <p style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '1.5rem' }}>
                                {t('redirectingToLogin')} <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#14B8A6' }}>({countdown})</span>...
                            </p>
                            <button 
                                type="button"
                                className="btn btn-primary register-submit-button"
                                onClick={() => navigate('/login?reset=success')}
                            >
                                {t('goToLogin') || 'Go to Login'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="password">{t('newPassword')} *</label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        className="form-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        minLength={8}
                                        maxLength={100}
                                        title={`${t('maxCharacters')}: 100`}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isSubmitting}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                                <div className="password-requirements">
                                    <div className="password-requirements-list" style={{ color: 'gray' }}>
                                        <div>• {t('passwordMinLength')}</div>
                                        <div>• {t('passwordCase')}</div>
                                        <div>• {t('passwordNumber')}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="confirmPassword">{t('confirmPassword')} *</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        className="form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        minLength={8}
                                        maxLength={100}
                                        title={`${t('maxCharacters')}: 100`}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={isSubmitting}
                                    >
                                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>

                            {(error || passwordError) && (
                                <div className="error-message">
                                    {error || passwordError}
                                </div>
                            )}
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary register-submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('resetting') : t('resetPassword')}
                            </button>
                            <div className="register-links">
                                <Link to="/login">{t('backToLogin')}</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage; 