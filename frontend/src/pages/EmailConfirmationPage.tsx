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
    
    const redirectMessage = t('emailConfirmationRedirectMessage') || 'Redirecting to login in {countdown} seconds...';

    return (
        <div className="email-confirmation-container">
            <motion.div 
                className="confirmation-box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {isSuccess ? (
                    <>
                        <div className="confirmation-icon-wrapper">
                            <FaCheckCircle className="confirmation-icon success" />
                        </div>
                        <h1 className="confirmation-title">{t('emailConfirmationSuccessTitle') || 'Email Confirmed!'}</h1>
                        <p className="confirmation-message">{t('emailConfirmationSuccessMessage') || 'Your email has been successfully verified. You can now log in.'}</p>
                        <p className="confirmation-redirect">
                            {t('emailConfirmationRedirectMessage').replace('{countdown}', countdown.toString())}
                        </p>
                        <Link to="/login" className="confirmation-btn confirmation-btn-primary">{t('goToLogin')}</Link>
                    </>
                ) : (
                    <>
                        <div className="confirmation-icon-wrapper">
                            <FaTimesCircle className="confirmation-icon failure" />
                        </div>
                        <h1 className="confirmation-title">{t('emailConfirmationFailureTitle') || 'Confirmation Failed'}</h1>
                        <p className="confirmation-message">{t('emailConfirmationFailureMessage') || 'The confirmation link is invalid or has expired.'}</p>
                        <p className="confirmation-support">
                            {t('emailConfirmationSupportMessage')}{' '}
                            <a href="mailto:support@insanmekan.com">support@insanmekan.com</a>.
                        </p>
                        <Link to="/register" className="confirmation-btn confirmation-btn-secondary">{t('backToRegister')}</Link>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default EmailConfirmationPage; 