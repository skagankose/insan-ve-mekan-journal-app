import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './EmailConfirmationPage.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const EmailConfirmationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    const status = searchParams.get('status');
    const isSuccess = status === 'success';

    useEffect(() => {
        if (isSuccess) {
            const timer = setInterval(() => {
                setCountdown(prevCountdown => {
                    if (prevCountdown <= 1) {
                        clearInterval(timer);
                    }
                    return prevCountdown - 1;
                });
            }, 1000);

            const redirectTimeout = setTimeout(() => {
                navigate('/login');
            }, 5000);

            return () => {
                clearInterval(timer);
                clearTimeout(redirectTimeout);
            };
        }
    }, [isSuccess, navigate]);

    return (
        <>
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{isSuccess ? (t('emailConfirmationSuccessTitle') || 'Email Confirmed!') : (t('emailConfirmationFailureTitle') || 'Confirmation Failed')}</h1>
            </div>

            <div className="page-content-section">
                <div className="register-form-container">
                    {isSuccess ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <FaCheckCircle size={56} color="#14B8A6" style={{ marginBottom: '1.5rem' }} />
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                                {t('emailConfirmationSuccessTitle') || 'Email Confirmed!'}
                            </h2>
                            <p style={{ fontSize: '1rem', color: '#4B5563', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                                {t('emailConfirmationSuccessMessage') || 'Your email has been successfully verified. You can now log in.'}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
                                {t('emailConfirmationRedirectMessage').replace('{countdown}', countdown.toString())}
                            </p>
                            <button 
                                type="button"
                                className="btn btn-primary register-submit-button"
                                onClick={() => navigate('/login')}
                            >
                                {t('goToLogin')}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <FaTimesCircle size={56} color="#DC2626" style={{ marginBottom: '1.5rem' }} />
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.75rem' }}>
                                {t('emailConfirmationFailureSubTitle') || 'Confirmation Failed'}
                            </h2>
                            <p style={{ fontSize: '1rem', color: '#4B5563', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                                {t('emailConfirmationFailureMessage') || 'The confirmation link is invalid or has expired.'}
                            </p>
                            <button 
                                type="button"
                                className="btn btn-primary register-submit-button"
                                onClick={() => navigate('/register')}
                            >
                                {t('backToRegister')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EmailConfirmationPage; 