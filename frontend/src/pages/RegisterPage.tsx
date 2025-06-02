import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import apiService from '../services/apiService'; // No longer needed directly
import { useAuth } from '../contexts/AuthContext'; // Use the Auth context
import { useLanguage } from '../contexts/LanguageContext';
import ReCAPTCHA from 'react-google-recaptcha';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import '../styles/FormattedIdInput.css';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [countryCode, setCountryCode] = useState('+90');
    const [phoneNumber, setPhoneNumber] = useState('');
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

    // Format phone number as user types
    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const digitsOnly = value.replace(/\D/g, '');
        
        // Limit to 7 digits (for Turkish mobile format: XXX XX XX)
        const limitedDigits = digitsOnly.slice(0, 7);
        
        // Format as XXX XX XX
        let formatted = '';
        if (limitedDigits.length > 0) {
            formatted = limitedDigits.slice(0, 3);
            if (limitedDigits.length > 3) {
                formatted += ' ' + limitedDigits.slice(3, 5);
                if (limitedDigits.length > 5) {
                    formatted += ' ' + limitedDigits.slice(5, 7);
                }
            }
        }
        
        return formatted;
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
    };

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
            // Combine country code and phone number
            const telephone = countryCode + phoneNumber.replace(/\s/g, '');
            
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
            setCountryCode('+90'); setPhoneNumber(''); setScienceBranch(''); setLocation(''); 
            setYoksisId(''); setOrcidId(''); setPassword(''); setConfirmPassword('');
            setCaptchaValue(null);
            // Redirect to login after a short delay
            navigate('/login');
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
        <>
            {/* Title Section */}
            <div className="page-title-section">
                <h1 style={{textAlign: 'center'}}>{t('createAccount')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="register-form-container">
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    {passwordError && <div className="error-message">{passwordError}</div>}
                    
                    <form className="register-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">{t('email')}</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isSubmitting}
                                maxLength={200}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="name">{t('name')}</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isSubmitting}
                                maxLength={200}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="title">{t('title')}</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                                maxLength={200}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="bio">{t('bio')}</label>
                            <textarea
                                id="bio"
                                className="form-textarea"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                disabled={isSubmitting}
                                rows={3}
                                maxLength={400}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="telephone">{t('telephone') || 'Phone Number'}</label>
                            <div className="phone-input-group">
                                <input
                                    type="text"
                                    id="countryCode"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="form-input country-code-input"
                                    maxLength={4}
                                    placeholder="+90"
                                />
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    value={phoneNumber}
                                    onChange={handlePhoneNumberChange}
                                    required
                                    disabled={isSubmitting}
                                    className="form-input phone-number-input"
                                    placeholder="555 55 55"
                                    maxLength={9}
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="scienceBranch">{t('scienceBranch') || 'Science Branch'}</label>
                            <input
                                type="text"
                                id="scienceBranch"
                                value={scienceBranch}
                                onChange={(e) => setScienceBranch(e.target.value)}
                                disabled={isSubmitting}
                                maxLength={300}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="location">{t('location') || 'Location'}</label>
                            <LocationInput
                                value={location}
                                onChange={setLocation}
                                id="location"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="yoksisId">{t('yoksisId') || 'YÖKSİS ID'}</label>
                            <FormattedIdInput
                                type="yoksis"
                                value={yoksisId}
                                onChange={setYoksisId}
                                id="yoksisId"
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="orcidId">{t('orcidId') || 'ORCID ID'}</label>
                            <FormattedIdInput
                                type="orcid"
                                value={orcidId}
                                onChange={setOrcidId}
                                id="orcidId"
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">{t('password')}</label>
                            <input
                                type="password"
                                id="password"
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
                                className="form-input"
                            />
                            <div className="password-requirements">
                                <small>{t('passwordRequirements')}</small>
                                <ul>
                                    <li>{t('passwordMinLength')}</li>
                                    <li>{t('passwordCase')}</li>
                                    <li>{t('passwordNumber')}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                            <input
                                type="password"
                                id="confirmPassword"
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
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={handleCaptchaChange}
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary register-submit-button" 
                            disabled={isSubmitting || !captchaValue}
                        >
                            {isSubmitting ? t('creatingAccount') : t('registerButton')}
                        </button>
                        
                        <div className="register-links">
                            <span>{t('alreadyHaveAccount')}</span>
                            <Link to="/login">{t('loginText')}</Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default RegisterPage; 