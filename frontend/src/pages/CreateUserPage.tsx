import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './EditUserPage.css'; // Reuse the same styling
import { FiEye, FiEyeOff } from 'react-icons/fi';

import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import CountrySelector from '../components/CountrySelector';
import { validateYoksisId, validateOrcidId, validatePhoneNumber } from '../utils/validation';
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
    const { language } = useLanguage();
    const formRef = useRef<HTMLFormElement>(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [currentFlag, setCurrentFlag] = useState('🇹🇷');
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            setPasswordError(language === 'tr' ? 'Şifre en az 8 karakter uzunluğunda olmalıdır' : 'Password must be at least 8 characters long');
            return false;
        }
        if (!hasUpperCase || !hasLowerCase) {
            setPasswordError(language === 'tr' ? 'Şifre büyük ve küçük harfler içermelidir' : 'Password must contain both uppercase and lowercase letters');
            return false;
        }
        if (!hasNumbers) {
            setPasswordError(language === 'tr' ? 'Şifre en az bir rakam içermelidir' : 'Password must contain at least one number');
            return false;
        }
        if (password !== formData.confirmPassword) {
            setPasswordError(language === 'tr' ? 'Şifreler eşleşmiyor' : 'Passwords do not match');
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

        // Clear errors when user starts typing after attempting submit
        if (hasAttemptedSubmit) {
            setError(null);
            setPasswordError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPasswordError(null);
        setHasAttemptedSubmit(true);

        if (!validatePassword(formData.password)) {
            setLoading(false);
            return;
        }

        // Validate YÖKSİS ID if provided
        if (formData.yoksis_id && !validateYoksisId(formData.yoksis_id)) {
            setError(language === 'tr' ? 'YÖKSİS ID 5-8 rakam olmalıdır' : 'YÖKSİS ID must be 5-8 digits');
            setLoading(false);
            return;
        }
        
        // Validate ORCID ID if provided
        if (formData.orcid_id && !validateOrcidId(formData.orcid_id)) {
            setError(language === 'tr' ? 'ORCID ID formatı 0000-0000-0000-0000 olmalıdır' : 'ORCID ID must be in format 0000-0000-0000-0000');
            setLoading(false);
            return;
        }
        
        // Validate phone number only if phone number is provided
        if (formData.phoneNumber.trim() && !validatePhoneNumber(formData.countryCode, formData.phoneNumber)) {
            setError(language === 'tr' ? 'Telefon numarası formatı geçersiz' : 'Phone number format is invalid');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setSuccess(false);
            
            // Combine country code and phone number only if phone number is provided
            const telephone = formData.phoneNumber.trim() ? formData.countryCode + formData.phoneNumber.replace(/\s/g, '') : undefined;
            
            // Use the register function from apiService
            const createdUser = await apiService.register({
                email: formData.email,
                name: formData.name,
                title: formData.title || undefined,
                bio: formData.bio || undefined,
                telephone: telephone,
                science_branch: formData.science_branch || undefined,
                location: formData.country && formData.location ? `${formData.location}, ${formData.country}` : formData.location || formData.country || undefined,
                yoksis_id: formData.yoksis_id || undefined,
                orcid_id: formData.orcid_id || undefined,
                role: formData.role,
                password: formData.password,
                is_auth: true, // Always set to true for admin-created users
                recaptcha_token: '' // Skip reCAPTCHA for admin creation
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
            setHasAttemptedSubmit(false);
            
            // Navigate to the newly created user's profile page
            navigate(`/admin/users/profile/${createdUser.id}?created=true`);
            
        } catch (err: any) {
            console.error("User creation failed:", err);
            // Handle specific error messages
            if (err.response?.data?.detail) {
                const errorDetail = err.response.data.detail.toLowerCase();
                console.log("Backend error detail:", err.response.data.detail);
                
                // Check for email already registered error
                if (errorDetail === 'email already registered' || 
                    (errorDetail.includes('email') && errorDetail.includes('already'))) {
                    setError(language === 'tr' ? 'E-posta adresi zaten kayıtlı' : 'Email already registered');
                } else {
                    setError(err.response.data.detail);
                }
            } else {
                setError(language === 'tr' ? 'Kullanıcı oluşturulamadı' : 'Failed to create user');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{language === 'tr' ? 'Kullanıcı Oluştur' : 'Create User'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section" style={{ paddingBottom: '0px' }}>
                <div style={{ margin: '0 auto', maxWidth: '600px', width: '100%', padding: '0 20px' }}>
                    <div className="register-form-container">

                        
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
    {language === 'tr' ? 'Kullanıcı başarıyla oluşturuldu' : 'User created successfully'}
                            </div>
                        )}
                        
                        <form ref={formRef} onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">{language === 'tr' ? 'E-posta' : 'Email'} *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="form-input"
                                    placeholder={language === 'tr' ? 'E-posta adresini girin' : 'Enter email address'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="name" className="form-label">{language === 'tr' ? 'Ad Soyad' : 'Name'} *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="form-input"
                                    placeholder={language === 'tr' ? 'Tam adınızı girin' : 'Enter full name'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="title" className="form-label">{language === 'tr' ? 'Ünvan' : 'Title'}</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    maxLength={200}
                                    className="form-input"
                                    placeholder={language === 'tr' ? 'Akademik unvanınızı girin' : 'Enter academic title'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="bio" className="form-label">{language === 'tr' ? 'Biyografi' : 'Bio'}</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={3}
                                    maxLength={400}
                                    className="form-textarea"
                                    placeholder={language === 'tr' ? 'Biyografik bilgilerinizi girin' : 'Enter biographical information'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="telephone" className="form-label">{language === 'tr' ? 'Telefon Numarası' : 'Phone Number'}</label>
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
                                        disabled={loading}
                                        className="form-input phone-number-input"
                                        placeholder="555 55 55"
                                        maxLength={9}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="science_branch" className="form-label">{language === 'tr' ? 'Bilim Dalı' : 'Science Branch'}</label>
                                <input
                                    type="text"
                                    id="science_branch"
                                    name="science_branch"
                                    value={formData.science_branch}
                                    onChange={handleInputChange}
                                    maxLength={300}
                                    className="form-input"
                                    placeholder={language === 'tr' ? 'Çalışma alanınızı girin' : 'Enter field of study'}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="country" className="form-label">{language === 'tr' ? 'Ülke' : 'Country'}</label>
                                <CountrySelector
                                    value={formData.country}
                                    onChange={(value) => {
                                        setFormData({ ...formData, country: value });
                                        if (hasAttemptedSubmit) {
                                            setError(null);
                                            setPasswordError(null);
                                        }
                                    }}
                                    id="country"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="location" className="form-label">{language === 'tr' ? 'Şehir/Konum' : 'City/Location'}</label>
                                <div className="location-input-container">
                                    <LocationInput
                                        value={formData.location}
                                        onChange={(value) => {
                                            setFormData({ ...formData, location: value });
                                            if (hasAttemptedSubmit) {
                                                setError(null);
                                                setPasswordError(null);
                                            }
                                        }}
                                        id="location"
                                        name="location"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="yoksis_id" className="form-label">{language === 'tr' ? 'YÖKSİS ID' : 'YÖKSİS ID'}</label>
                                <div className="formatted-id-container">
                                    <FormattedIdInput
                                        type="yoksis"
                                        value={formData.yoksis_id}
                                        onChange={(value) => {
                                            setFormData({ ...formData, yoksis_id: value });
                                            if (hasAttemptedSubmit) {
                                                setError(null);
                                                setPasswordError(null);
                                            }
                                        }}
                                        id="yoksis_id"
                                        name="yoksis_id"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="orcid_id" className="form-label">{language === 'tr' ? 'ORCID ID' : 'ORCID ID'}</label>
                                <div className="formatted-id-container">
                                    <FormattedIdInput
                                        type="orcid"
                                        value={formData.orcid_id}
                                        onChange={(value) => {
                                            setFormData({ ...formData, orcid_id: value });
                                            if (hasAttemptedSubmit) {
                                                setError(null);
                                                setPasswordError(null);
                                            }
                                        }}
                                        id="orcid_id"
                                        name="orcid_id"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">{language === 'tr' ? 'Şifre' : 'Password'} *</label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        minLength={8}
                                        maxLength={100}
                                        className="form-input"
                                        placeholder={language === 'tr' ? 'Şifrenizi girin' : 'Enter password'}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                                <div className="password-requirements">
                                    <div className="password-requirements-list" style={{ color: 'gray' }}>
                                        <div>• {language === 'tr' ? 'En az 8 karakter uzunluğunda' : 'At least 8 characters long'}</div>
                                        <div>• {language === 'tr' ? 'Büyük ve küçük harfler içerir' : 'Contains both uppercase and lowercase letters'}</div>
                                        <div>• {language === 'tr' ? 'En az bir rakam içerir' : 'Contains at least one number'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">{language === 'tr' ? 'Şifre Onayı' : 'Confirm Password'} *</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required
                                        minLength={8}
                                        className="form-input"
                                        placeholder={language === 'tr' ? 'Şifrenizi tekrar girin' : 'Confirm password'}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="role" className="form-label">{language === 'tr' ? 'Rol' : 'Role'} *</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                    disabled={loading}
                                >
                                    <option value="author">{language === 'tr' ? 'Yazar' : 'Author'}</option>
                                    <option value="admin">{language === 'tr' ? 'Yönetici' : 'Admin'}</option>
                                    <option value="owner">{language === 'tr' ? 'Sahip' : 'Owner'}</option>
                                    <option value="editor">{language === 'tr' ? 'Editör' : 'Editor'}</option>
                                    <option value="referee">{language === 'tr' ? 'Hakem' : 'Referee'}</option>
                                </select>
                            </div>
                            
                            {hasAttemptedSubmit && passwordError && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginTop: '16px',
                                    marginBottom: '16px',
                                    color: '#DC2626',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}>
                                    {passwordError}
                                </div>
                            )}
                            
                            {hasAttemptedSubmit && error && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginTop: '16px',
                                    marginBottom: '16px',
                                    color: '#DC2626',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}
                            
                            <div style={{ 
                                marginTop: hasAttemptedSubmit && (passwordError || error) ? '0px' : '24px'
                            }}>
                                <button 
                                    type="submit" 
                                    className="register-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (language === 'tr' ? 'Kullanıcı Oluştur' : 'Create User')}
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