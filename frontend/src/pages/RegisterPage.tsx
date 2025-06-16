import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import apiService from '../services/apiService'; // No longer needed directly
import { useAuth } from '../contexts/AuthContext'; // Use the Auth context
import { useLanguage } from '../contexts/LanguageContext';
import ReCAPTCHA from 'react-google-recaptcha';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import CountrySelector from '../components/CountrySelector';
import '../styles/FormattedIdInput.css';

// Country code to flag mapping
const countryFlags: { [key: string]: string } = {
    '+1': '🇺🇸', // USA
    '+7': '🇷🇺', // Russia
    '+20': '🇪🇬', // Egypt
    '+27': '🇿🇦', // South Africa
    '+30': '🇬🇷', // Greece
    '+31': '🇳🇱', // Netherlands
    '+32': '🇧🇪', // Belgium
    '+33': '🇫🇷', // France
    '+34': '🇪🇸', // Spain
    '+36': '🇭🇺', // Hungary
    '+39': '🇮🇹', // Italy
    '+40': '🇷🇴', // Romania
    '+41': '🇨🇭', // Switzerland
    '+43': '🇦🇹', // Austria
    '+44': '🇬🇧', // UK
    '+45': '🇩🇰', // Denmark
    '+46': '🇸🇪', // Sweden
    '+47': '🇳🇴', // Norway
    '+48': '🇵🇱', // Poland
    '+49': '🇩🇪', // Germany
    '+51': '🇵🇪', // Peru
    '+52': '🇲🇽', // Mexico
    '+53': '🇨🇺', // Cuba
    '+54': '🇦🇷', // Argentina
    '+55': '🇧🇷', // Brazil
    '+56': '🇨🇱', // Chile
    '+57': '🇨🇴', // Colombia
    '+58': '🇻🇪', // Venezuela
    '+60': '🇲🇾', // Malaysia
    '+61': '🇦🇺', // Australia
    '+62': '🇮🇩', // Indonesia
    '+63': '🇵🇭', // Philippines
    '+64': '🇳🇿', // New Zealand
    '+65': '🇸🇬', // Singapore
    '+66': '🇹🇭', // Thailand
    '+81': '🇯🇵', // Japan
    '+82': '🇰🇷', // South Korea
    '+84': '🇻🇳', // Vietnam
    '+86': '🇨🇳', // China
    '+90': '🇹🇷', // Turkey
    '+91': '🇮🇳', // India
    '+92': '🇵🇰', // Pakistan
    '+93': '🇦🇫', // Afghanistan
    '+94': '🇱🇰', // Sri Lanka
    '+95': '🇲🇲', // Myanmar
    '+98': '🇮🇷', // Iran
    '+212': '🇲🇦', // Morocco
    '+213': '🇩🇿', // Algeria
    '+216': '🇹🇳', // Tunisia
    '+218': '🇱🇾', // Libya
    '+220': '🇬🇲', // Gambia
    '+221': '🇸🇳', // Senegal
    '+222': '🇲🇷', // Mauritania
    '+223': '🇲🇱', // Mali
    '+224': '🇬🇳', // Guinea
    '+225': '🇨🇮', // Ivory Coast
    '+226': '🇧🇫', // Burkina Faso
    '+227': '🇳🇪', // Niger
    '+228': '🇹🇬', // Togo
    '+229': '🇧🇯', // Benin
    '+230': '🇲🇺', // Mauritius
    '+231': '🇱🇷', // Liberia
    '+232': '🇸🇱', // Sierra Leone
    '+233': '🇬🇭', // Ghana
    '+234': '🇳🇬', // Nigeria
    '+235': '🇹🇩', // Chad
    '+236': '🇨🇫', // Central African Republic
    '+237': '🇨🇲', // Cameroon
    '+238': '🇨🇻', // Cape Verde
    '+239': '🇸🇹', // São Tomé and Príncipe
    '+240': '🇬🇶', // Equatorial Guinea
    '+241': '🇬🇦', // Gabon
    '+242': '🇨🇬', // Republic of the Congo
    '+243': '🇨🇩', // Democratic Republic of the Congo
    '+244': '🇦🇴', // Angola
    '+245': '🇬🇼', // Guinea-Bissau
    '+246': '🇮🇴', // British Indian Ocean Territory
    '+248': '🇸🇨', // Seychelles
    '+249': '🇸🇩', // Sudan
    '+250': '🇷🇼', // Rwanda
    '+251': '🇪🇹', // Ethiopia
    '+252': '🇸🇴', // Somalia
    '+253': '🇩🇯', // Djibouti
    '+254': '🇰🇪', // Kenya
    '+255': '🇹🇿', // Tanzania
    '+256': '🇺🇬', // Uganda
    '+257': '🇧🇮', // Burundi
    '+258': '🇲🇿', // Mozambique
    '+260': '🇿🇲', // Zambia
    '+261': '🇲🇬', // Madagascar
    '+262': '🇷🇪', // Réunion
    '+263': '🇿🇼', // Zimbabwe
    '+264': '🇳🇦', // Namibia
    '+265': '🇲🇼', // Malawi
    '+266': '🇱🇸', // Lesotho
    '+267': '🇧🇼', // Botswana
    '+268': '🇸🇿', // Eswatini
    '+269': '🇰🇲', // Comoros
    '+290': '🇸🇭', // Saint Helena
    '+291': '🇪🇷', // Eritrea
    '+297': '🇦🇼', // Aruba
    '+298': '🇫🇴', // Faroe Islands
    '+299': '🇬🇱', // Greenland
    '+350': '🇬🇮', // Gibraltar
    '+351': '🇵🇹', // Portugal
    '+352': '🇱🇺', // Luxembourg
    '+353': '🇮🇪', // Ireland
    '+354': '🇮🇸', // Iceland
    '+355': '🇦🇱', // Albania
    '+356': '🇲🇹', // Malta
    '+357': '🇨🇾', // Cyprus
    '+358': '🇫🇮', // Finland
    '+359': '🇧🇬', // Bulgaria
    '+370': '🇱🇹', // Lithuania
    '+371': '🇱🇻', // Latvia
    '+372': '🇪🇪', // Estonia
    '+373': '🇲🇩', // Moldova
    '+374': '🇦🇲', // Armenia
    '+375': '🇧🇾', // Belarus
    '+376': '🇦🇩', // Andorra
    '+377': '🇲🇨', // Monaco
    '+378': '🇸🇲', // San Marino
    '+380': '🇺🇦', // Ukraine
    '+381': '🇷🇸', // Serbia
    '+382': '🇲🇪', // Montenegro
    '+383': '🇽🇰', // Kosovo
    '+385': '🇭🇷', // Croatia
    '+386': '🇸🇮', // Slovenia
    '+387': '🇧🇦', // Bosnia and Herzegovina
    '+389': '🇲🇰', // North Macedonia
    '+420': '🇨🇿', // Czech Republic
    '+421': '🇸🇰', // Slovakia
    '+423': '🇱🇮', // Liechtenstein
    '+500': '🇫🇰', // Falkland Islands
    '+501': '🇧🇿', // Belize
    '+502': '🇬🇹', // Guatemala
    '+503': '🇸🇻', // El Salvador
    '+504': '🇭🇳', // Honduras
    '+505': '🇳🇮', // Nicaragua
    '+506': '🇨🇷', // Costa Rica
    '+507': '🇵🇦', // Panama
    '+508': '🇵🇲', // Saint Pierre and Miquelon
    '+509': '🇭🇹', // Haiti
    '+590': '🇬🇵', // Guadeloupe
    '+591': '🇧🇴', // Bolivia
    '+592': '🇬🇾', // Guyana
    '+593': '🇪🇨', // Ecuador
    '+594': '🇬🇫', // French Guiana
    '+595': '🇵🇾', // Paraguay
    '+596': '🇲🇶', // Martinique
    '+597': '🇸🇷', // Suriname
    '+598': '🇺🇾', // Uruguay
    '+599': '🇧🇶', // Caribbean Netherlands
    '+670': '🇹🇱', // East Timor
    '+672': '🇦🇶', // Antarctica
    '+673': '🇧🇳', // Brunei
    '+674': '🇳🇷', // Nauru
    '+675': '🇵🇬', // Papua New Guinea
    '+676': '🇹🇴', // Tonga
    '+677': '🇸🇧', // Solomon Islands
    '+678': '🇻🇺', // Vanuatu
    '+679': '🇫🇯', // Fiji
    '+680': '🇵🇼', // Palau
    '+681': '🇼🇫', // Wallis and Futuna
    '+682': '🇨🇰', // Cook Islands
    '+683': '🇳🇺', // Niue
    '+684': '🇦🇸', // American Samoa
    '+685': '🇼🇸', // Samoa
    '+686': '🇰🇮', // Kiribati
    '+687': '🇳🇨', // New Caledonia
    '+688': '🇹🇻', // Tuvalu
    '+689': '🇵🇫', // French Polynesia
    '+690': '🇹🇰', // Tokelau
    '+691': '🇫🇲', // Federated States of Micronesia
    '+692': '🇲🇭', // Marshall Islands
    '+850': '🇰🇵', // North Korea
    '+852': '🇭🇰', // Hong Kong
    '+853': '🇲🇴', // Macau
    '+855': '🇰🇭', // Cambodia
    '+856': '🇱🇦', // Laos
    '+880': '🇧🇩', // Bangladesh
    '+886': '🇹🇼', // Taiwan
    '+960': '🇲🇻', // Maldives
    '+961': '🇱🇧', // Lebanon
    '+962': '🇯🇴', // Jordan
    '+963': '🇸🇾', // Syria
    '+964': '🇮🇶', // Iraq
    '+965': '🇰🇼', // Kuwait
    '+966': '🇸🇦', // Saudi Arabia
    '+967': '🇾🇪', // Yemen
    '+968': '🇴🇲', // Oman
    '+970': '🇵🇸', // Palestine
    '+971': '🇦🇪', // United Arab Emirates
    '+972': '🇮🇱', // Israel
    '+973': '🇧🇭', // Bahrain
    '+974': '🇶🇦', // Qatar
    '+975': '🇧🇹', // Bhutan
    '+976': '🇲🇳', // Mongolia
    '+977': '🇳🇵', // Nepal
    '+992': '🇹🇯', // Tajikistan
    '+993': '🇹🇲', // Turkmenistan
    '+994': '🇦🇿', // Azerbaijan
    '+995': '🇬🇪', // Georgia
    '+996': '🇰🇬', // Kyrgyzstan
    '+998': '🇺🇿', // Uzbekistan
};

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [countryCode, setCountryCode] = useState('+90');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [scienceBranch, setScienceBranch] = useState('');
    const [country, setCountry] = useState('');
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
    const [currentFlag, setCurrentFlag] = useState('🇹🇷');
    const navigate = useNavigate();
    const { register } = useAuth(); // Get register function
    const { t } = useLanguage();
    const formRef = useRef<HTMLFormElement>(null);

    // Function to get flag for country code
    const getFlagForCountryCode = (code: string): string => {
        // Try to match the exact code first
        if (countryFlags[code]) {
            return countryFlags[code];
        }
        
        // If not found, try to find a match by removing characters from the end
        for (let i = code.length - 1; i > 0; i--) {
            const partialCode = code.substring(0, i);
            if (countryFlags[partialCode]) {
                return countryFlags[partialCode];
            }
        }
        
        // Default flag if no match found
        return '🌍';
    };

    // Update flag when country code changes
    useEffect(() => {
        setCurrentFlag(getFlagForCountryCode(countryCode));
    }, [countryCode]);

    // Set custom validation messages
    useEffect(() => {
        if (!formRef.current) return;

        const form = formRef.current;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        const handleInvalid = (e: Event) => {
            const target = e.target as HTMLInputElement;
            
            if (target.validity.valueMissing) {
                target.setCustomValidity(t('validation.required'));
            } else if (target.validity.typeMismatch && target.type === 'email') {
                target.setCustomValidity(t('validation.email'));
            } else if (target.validity.tooShort) {
                target.setCustomValidity(t('validation.tooShort').replace('{min}', target.minLength?.toString() || '8'));
            } else if (target.validity.tooLong) {
                target.setCustomValidity(t('validation.tooLong').replace('{max}', target.maxLength?.toString() || '200'));
            } else {
                target.setCustomValidity('');
            }
        };

        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            target.setCustomValidity('');
        };

        // Add event listeners
        inputs.forEach((input) => {
            input.addEventListener('invalid', handleInvalid);
            input.addEventListener('input', handleInput);
        });

        // Cleanup
        return () => {
            inputs.forEach((input) => {
                input.removeEventListener('invalid', handleInvalid);
                input.removeEventListener('input', handleInput);
            });
        };
    }, [t]); // Re-run when language changes

    // Handle country code change
    const handleCountryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
    };

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

        const form = event.target as HTMLFormElement;
        
        // Check form validity and show browser validation messages
        if (!form.checkValidity()) {
            // This will trigger HTML5 validation messages and scroll to first invalid field
            form.reportValidity();
            return;
        }

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
                location: country && location ? `${location}, ${country}` : location || country || undefined,
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
            setCountryCode('+90'); setPhoneNumber(''); setScienceBranch(''); 
            setCountry(''); setLocation(''); 
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
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{t('createAccount')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="register-form-container">
                    <form ref={formRef} className="register-form" onSubmit={handleSubmit}>
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
                                <div className="country-flag-display">
                                    <span className="flag-emoji">{currentFlag}</span>
                                </div>
                                <input
                                    type="text"
                                    id="countryCode"
                                    value={countryCode}
                                    onChange={handleCountryCodeChange}
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
                            <label htmlFor="country">{t('country') || 'Country'}</label>
                            <CountrySelector
                                value={country}
                                onChange={setCountry}
                                id="country"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="location">{t('location') || 'City/Location'}</label>
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
                                <div className="password-requirements-list" style={{ color: 'gray' }}>
                                    <div>• {t('passwordMinLength')}</div>
                                    <div>• {t('passwordCase')}</div>
                                    <div>• {t('passwordNumber')}</div>
                                </div>
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

                        <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={handleCaptchaChange}
                            />
                        </div>
                        
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        {passwordError && <div className="error-message">{passwordError}</div>}
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary register-submit-button" 
                            disabled={isSubmitting}
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