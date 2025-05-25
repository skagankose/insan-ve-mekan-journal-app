import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import apiService from '../services/apiService'; // No longer needed directly
import { useAuth } from '../contexts/AuthContext'; // Use the Auth context
import { useLanguage } from '../contexts/LanguageContext';
import ReCAPTCHA from 'react-google-recaptcha';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [telephone, setTelephone] = useState('');
    const [scienceBranch, setScienceBranch] = useState('');
    const [location, setLocation] = useState('');
    const [yoksisId, setYoksisId] = useState('');
    const [orcidId, setOrcidId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [captchaValue, setCaptchaValue] = useState<string | null>(null);
    const navigate = useNavigate();
    const { register } = useAuth(); // Get register function
    const { t } = useLanguage();

    const validatePassword = (password: string): boolean => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);

        if (password.length < minLength) {
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
        if (password !== confirmPassword) {
            setPasswordError(t('passwordMatch'));
            return false;
        }

        setPasswordError(null);
        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setPasswordError(null);
        setIsSubmitting(true);

        if (!captchaValue) {
            setError(t('pleaseVerifyCaptcha') || 'Please verify that you are human');
            setIsSubmitting(false);
            return;
        }

        if (!validatePassword(password)) {
            setIsSubmitting(false);
            return;
        }

        try {
            const userData = { 
                email, 
                name,
                title: title || undefined,
                bio: bio || undefined,
                telephone: telephone || undefined,
                science_branch: scienceBranch || undefined,
                location: location || undefined,
                yoksis_id: yoksisId || undefined,
                orcid_id: orcidId || undefined,
                role: 'author', // Set default role to author
                password,
                recaptcha_token: captchaValue
            };
            await register(userData); // Call register from context
            setSuccess('Registration successful! Redirecting to login...');
            // Clear form
            setEmail(''); setName(''); setTitle(''); setBio(''); 
            setTelephone(''); setScienceBranch(''); setLocation(''); 
            setYoksisId(''); setOrcidId(''); setPassword(''); setConfirmPassword('');
            setCaptchaValue(null);
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000); 
        } catch (err: any) {
            console.error("Registration failed:", err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCaptchaChange = (value: string | null) => {
        setCaptchaValue(value);
        if (!value) {
            setError(t('captchaExpired') || 'CAPTCHA verification expired. Please verify again.');
        } else {
            setError(null);
        }
    };

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('createAccount')}</h1>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            {passwordError && <div className="error-message">{passwordError}</div>}
            
            <form onSubmit={handleSubmit} className="card">
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
                        maxLength={200}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="name" className="form-label">{t('name')}</label>
                    <input
                        type="text"
                        id="name"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        maxLength={200}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="title" className="form-label">{t('title')}</label>
                    <input
                        type="text"
                        id="title"
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={200}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="bio" className="form-label">{t('bio')}</label>
                    <textarea
                        id="bio"
                        className="form-input"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                        maxLength={400}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="telephone" className="form-label">{t('telephone') || 'Phone Number'}</label>
                    <input
                        type="text"
                        id="telephone"
                        className="form-input"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={100}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="scienceBranch" className="form-label">{t('scienceBranch') || 'Science Branch'}</label>
                    <input
                        type="text"
                        id="scienceBranch"
                        className="form-input"
                        value={scienceBranch}
                        onChange={(e) => setScienceBranch(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={300}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="location" className="form-label">{t('location') || 'Location'}</label>
                    <input
                        type="text"
                        id="location"
                        className="form-input"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={100}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="yoksisId" className="form-label">{t('yoksisId') || 'YÖKSİS ID'}</label>
                    <input
                        type="text"
                        id="yoksisId"
                        className="form-input"
                        value={yoksisId}
                        onChange={(e) => setYoksisId(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={100}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="orcidId" className="form-label">{t('orcidId') || 'ORCID ID'}</label>
                    <input
                        type="text"
                        id="orcidId"
                        className="form-input"
                        value={orcidId}
                        onChange={(e) => setOrcidId(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={100}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password" className="form-label">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (confirmPassword) {
                                validatePassword(e.target.value);
                            }
                        }}
                        required
                        disabled={isSubmitting}
                        minLength={8}
                        maxLength={100}
                    />
                    <small className="form-text text-muted">
                        {t('passwordRequirements')}
                        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                            <li>{t('passwordMinLength')}</li>
                            <li>{t('passwordCase')}</li>
                            <li>{t('passwordNumber')}</li>
                        </ul>
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">{t('confirmPassword')}</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (password) {
                                validatePassword(password);
                            }
                        }}
                        required
                        disabled={isSubmitting}
                        minLength={8}
                    />
                </div>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
                    <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaChange}
                    />
                </div>
                
                <div className="form-group" style={{ marginTop: 'var(--spacing-6)' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmitting || !captchaValue}
                        style={{ width: '100%' }}
                    >
                        {isSubmitting ? t('creatingAccount') : t('registerButton')}
                    </button>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <p className="text-secondary">
                        {t('alreadyHaveAccount')} <Link to="/login">{t('loginText')}</Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage; 