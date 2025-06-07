import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './EditUserPage.css'; // Reuse the same styling
import ReCAPTCHA from 'react-google-recaptcha';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import CountrySelector from '../components/CountrySelector';
import '../styles/FormattedIdInput.css';

// Country code to flag mapping (same as RegisterPage)
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

interface UserForm {
    email: string;
    name: string;
    title: string;
    bio: string;
    countryCode: string;
    phoneNumber: string;
    science_branch: string;
    country: string;
    location: string;
    yoksis_id: string;
    orcid_id: string;
    role: string;
    password: string;
    confirmPassword: string;
    is_auth: boolean;
}

const CreateUserPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const formRef = useRef<HTMLFormElement>(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [captchaValue, setCaptchaValue] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [currentFlag, setCurrentFlag] = useState('🇹🇷');
    const [formData, setFormData] = useState<UserForm>({
        email: '',
        name: '',
        title: '',
        bio: '',
        countryCode: '+90',
        phoneNumber: '',
        science_branch: '',
        country: '',
        location: '',
        yoksis_id: '',
        orcid_id: '',
        role: 'author',
        password: '',
        confirmPassword: '',
        is_auth: true
    });

    // Function to get flag for country code (same as RegisterPage)
    const getFlagForCountryCode = (code: string): string => {
        if (countryFlags[code]) {
            return countryFlags[code];
        }
        
        for (let i = code.length - 1; i > 0; i--) {
            const partialCode = code.substring(0, i);
            if (countryFlags[partialCode]) {
                return countryFlags[partialCode];
            }
        }
        
        return '🌍';
    };

    // Update flag when country code changes
    useEffect(() => {
        setCurrentFlag(getFlagForCountryCode(formData.countryCode));
    }, [formData.countryCode]);

    // Format phone number as user types (same as RegisterPage)
    const formatPhoneNumber = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '');
        const limitedDigits = digitsOnly.slice(0, 7);
        
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

    const validatePassword = (password: string): boolean => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);

        if (password.length < minLength) {
            setPasswordError(t('passwordMinLength') || 'Password must be at least 8 characters long');
            return false;
        }
        if (!hasUpperCase || !hasLowerCase) {
            setPasswordError(t('passwordCase') || 'Password must contain both uppercase and lowercase letters');
            return false;
        }
        if (!hasNumbers) {
            setPasswordError(t('passwordNumber') || 'Password must contain at least one number');
            return false;
        }
        if (password !== formData.confirmPassword) {
            setPasswordError(t('passwordMatch') || 'Passwords do not match');
            return false;
        }

        setPasswordError(null);
        return true;
    };

    useEffect(() => {
        // Ensure only admin or owner users can access this page
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (currentUser?.role !== 'admin' && currentUser?.role !== 'owner') {
            navigate('/');
            return;
        }
    }, [isAuthenticated, currentUser, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setFormData({
                ...formData,
                [name]: checkbox.checked
            });
        } else if (name === 'phoneNumber') {
            const formatted = formatPhoneNumber(value);
            setFormData({
                ...formData,
                [name]: formatted
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!captchaValue) {
            setError(t('pleaseVerifyCaptcha') || 'Please verify that you are human');
            return;
        }

        if (!validatePassword(formData.password)) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            setPasswordError(null);
            
            // Combine country code and phone number
            const telephone = formData.countryCode + formData.phoneNumber.replace(/\s/g, '');
            
            // Use the register function from apiService
            await apiService.register({
                email: formData.email,
                name: formData.name,
                title: formData.title || undefined,
                bio: formData.bio || undefined,
                telephone: telephone || undefined,
                science_branch: formData.science_branch || undefined,
                location: formData.country && formData.location ? `${formData.location}, ${formData.country}` : formData.location || formData.country || undefined,
                yoksis_id: formData.yoksis_id || undefined,
                orcid_id: formData.orcid_id || undefined,
                role: formData.role,
                password: formData.password,
                is_auth: formData.is_auth,
                recaptcha_token: captchaValue
            });
            
            setSuccess(true);
            // Reset the form after successful submission
            setFormData({
                email: '',
                name: '',
                title: '',
                bio: '',
                countryCode: '+90',
                phoneNumber: '',
                science_branch: '',
                country: '',
                location: '',
                yoksis_id: '',
                orcid_id: '',
                role: 'author',
                password: '',
                confirmPassword: '',
                is_auth: true
            });
            setCaptchaValue(null);
            
            // Navigate back to admin page after a short delay
            navigate('/admin');
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section">
                <h1 style={{ margin: 0, textAlign: 'center' }}>{t('createUser') || 'Create User'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section" style={{ paddingBottom: '0px' }}>
                <div style={{ margin: '0 auto', maxWidth: '600px', width: '100%', padding: '0 20px' }}>
                    <div className="register-form-container">
                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px',
                                color: '#DC2626',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {error}
                            </div>
                        )}
                        
                        {success && (
                            <div style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px',
                                color: '#059669',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {t('userCreatedSuccessfully') || 'User created successfully'}
                            </div>
                        )}
                        
                        <form ref={formRef} onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">{t('email') || 'Email'}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="form-input"
                                    placeholder={t('enterEmail') || 'Enter email address'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="name" className="form-label">{t('name') || 'Name'}</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="form-input"
                                    placeholder={t('enterFullName') || 'Enter full name'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="title" className="form-label">{t('title') || 'Title'}</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    maxLength={200}
                                    className="form-input"
                                    placeholder={t('enterTitle') || 'Enter academic title'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="bio" className="form-label">{t('bio') || 'Bio'}</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={3}
                                    maxLength={400}
                                    className="form-textarea"
                                    placeholder={t('enterBio') || 'Enter biographical information'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="telephone" className="form-label">{t('telephone') || 'Phone Number'}</label>
                                <div className="phone-input-group">
                                    <div className="country-flag-display">
                                        <span className="flag-emoji">{currentFlag}</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="countryCode"
                                        name="countryCode"
                                        value={formData.countryCode}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        className="form-input country-code-input"
                                        maxLength={4}
                                        placeholder="+90"
                                    />
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        className="form-input phone-number-input"
                                        placeholder="555 55 55"
                                        maxLength={9}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="science_branch" className="form-label">{t('scienceBranch') || 'Science Branch'}</label>
                                <input
                                    type="text"
                                    id="science_branch"
                                    name="science_branch"
                                    value={formData.science_branch}
                                    onChange={handleInputChange}
                                    maxLength={300}
                                    className="form-input"
                                    placeholder={t('enterScienceBranch') || 'Enter field of study'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="country" className="form-label">{t('country') || 'Country'}</label>
                                <CountrySelector
                                    value={formData.country}
                                    onChange={(value) => setFormData({ ...formData, country: value })}
                                    id="country"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="location" className="form-label">{t('location') || 'City/Location'}</label>
                                <div className="location-input-container">
                                    <LocationInput
                                        value={formData.location}
                                        onChange={(value) => setFormData({ ...formData, location: value })}
                                        id="location"
                                        name="location"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="yoksis_id" className="form-label">{t('yoksisId') || 'YÖKSİS ID'}</label>
                                <div className="formatted-id-container">
                                    <FormattedIdInput
                                        type="yoksis"
                                        value={formData.yoksis_id}
                                        onChange={(value) => setFormData({ ...formData, yoksis_id: value })}
                                        id="yoksis_id"
                                        name="yoksis_id"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="orcid_id" className="form-label">{t('orcidId') || 'ORCID ID'}</label>
                                <div className="formatted-id-container">
                                    <FormattedIdInput
                                        type="orcid"
                                        value={formData.orcid_id}
                                        onChange={(value) => setFormData({ ...formData, orcid_id: value })}
                                        id="orcid_id"
                                        name="orcid_id"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">{t('password') || 'Password'}</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (formData.confirmPassword) {
                                            validatePassword(e.target.value);
                                        }
                                    }}
                                    required
                                    minLength={8}
                                    maxLength={100}
                                    className="form-input"
                                    placeholder={t('enterPassword') || 'Enter password'}
                                    disabled={loading}
                                />
                                <div className="password-requirements">
                                    <div className="password-requirements-list" style={{ color: 'gray' }}>
                                        <div>• {t('passwordMinLength') || 'At least 8 characters long'}</div>
                                        <div>• {t('passwordCase') || 'Contains both uppercase and lowercase letters'}</div>
                                        <div>• {t('passwordNumber') || 'Contains at least one number'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">{t('confirmPassword') || 'Confirm Password'}</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (formData.password) {
                                            validatePassword(formData.password);
                                        }
                                    }}
                                    required
                                    minLength={8}
                                    className="form-input"
                                    placeholder={t('confirmPassword') || 'Confirm password'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="role" className="form-label">{t('role') || 'Role'}</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                    disabled={loading}
                                    style={{
                                        appearance: 'none',
                                        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '20px',
                                        paddingRight: '40px'
                                    }}
                                >
                                    <option value="author">{t('roleAuthor') || 'Author'}</option>
                                    <option value="admin">{t('roleAdmin') || 'Admin'}</option>
                                    <option value="owner">{t('roleOwner') || 'Owner'}</option>
                                    <option value="editor">{t('roleEditor') || 'Editor'}</option>
                                    <option value="referee">{t('roleReferee') || 'Referee'}</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <div style={{
                                    background: 'rgba(248, 250, 252, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    border: '2px solid rgba(226, 232, 240, 0.8)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginTop: '8px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="checkbox"
                                                id="is_auth"
                                                name="is_auth"
                                                checked={formData.is_auth}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                                style={{
                                                    appearance: 'none',
                                                    width: '24px',
                                                    height: '24px',
                                                    border: '2px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    background: formData.is_auth ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255, 255, 255, 0.9)',
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    position: 'relative',
                                                    opacity: loading ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!loading) {
                                                        e.currentTarget.style.borderColor = '#10B981';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!loading) {
                                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }
                                                }}
                                            />
                                            {formData.is_auth && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '14px',
                                                    height: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    pointerEvents: 'none'
                                                }}>
                                                    <svg 
                                                        width="12" 
                                                        height="12" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="white" 
                                                        strokeWidth="3" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20,6 9,17 4,12"></polyline>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <label 
                                            htmlFor="is_auth" 
                                            style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#1E293B',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                userSelect: 'none',
                                                margin: 0,
                                                opacity: loading ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {t('isAuth') || 'Is Authorized'}
                                        </label>
                                    </div>
                                    <div style={{
                                        marginTop: '12px',
                                        fontSize: '14px',
                                        color: '#64748B',
                                        lineHeight: '1.5'
                                    }}>
                                        {t('isAuthDescription') || 'When enabled, this user will have authorized access to the system with full permissions for their assigned role.'}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                marginTop: '24px', 
                                marginBottom: '24px' 
                            }}>
                                <ReCAPTCHA
                                    sitekey="6Lc0kEYrAAAAACSgj_HzCdsBIdsl60GEN8uv7m43"
                                    onChange={handleCaptchaChange}
                                />
                            </div>
                            
                            {passwordError && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    color: '#DC2626',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    {passwordError}
                                </div>
                            )}
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '16px', 
                                marginTop: '32px',
                                flexDirection: 'column'
                            }}>
                                <button 
                                    type="submit" 
                                    className="register-submit-button"
                                    disabled={loading || !captchaValue}
                                >
                                    {loading ? (t('saving') || 'Saving...') : (t('createUser') || 'Create User')}
                                </button>
                                
                                <button 
                                    type="button" 
                                    onClick={() => navigate('/admin')}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        background: 'transparent',
                                        color: '#64748B',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        letterSpacing: '0.025em'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#94A3B8';
                                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {t('cancel') || 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateUserPage; 