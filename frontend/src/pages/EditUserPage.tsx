import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './EditUserPage.css';
import ConfirmationModal from '../components/ConfirmationModal';
import type { UserUpdate } from '../services/apiService';
import { FaCopy, FaPaperPlane } from 'react-icons/fa';

import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import CountrySelector from '../components/CountrySelector';
import { validateYoksisId, validateOrcidId, validatePhoneNumber } from '../utils/validation';
import '../styles/FormattedIdInput.css';

// Country code to flag mapping (same as CreateUserPage)
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
    '+228': '🇹��', // Togo
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
    is_auth: boolean;
}

const EditUserPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuth();
    const { t, language } = useLanguage();
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loginLinkGenerated, setLoginLinkGenerated] = useState<boolean>(false);
    const [loginLink, setLoginLink] = useState<string>('');
    const [emailSent, setEmailSent] = useState<boolean>(false);
    const [sendingEmail, setSendingEmail] = useState<boolean>(false);
    const [customEmailAddress, setCustomEmailAddress] = useState<string>('');
    const [deleting, setDeleting] = useState<boolean>(false);
    const [isLoginSectionExpanded, setIsLoginSectionExpanded] = useState<boolean>(false);
    const [isDeletionSectionExpanded, setIsDeletionSectionExpanded] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [currentFlag, setCurrentFlag] = useState('🇹🇷');
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastType, setToastType] = useState<'success' | 'warning'>('success');
    const [toastMessage, setToastMessage] = useState<string>('');
    
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
        role: 'user',
        is_auth: true
    });

    // Function to get flag for country code (same as CreateUserPage)
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

    // Format phone number as user types (same as CreateUserPage)
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

    // Parse existing phone number into country code and number
    const parsePhoneNumber = (telephone: string): { countryCode: string; phoneNumber: string; country: string } => {
        if (!telephone) {
            return { countryCode: '+90', phoneNumber: '', country: '' };
        }

        // Find the longest matching country code
        let matchedCode = '+90';
        let remainingNumber = '';
        
        for (const code of Object.keys(countryFlags).sort((a, b) => b.length - a.length)) {
            if (telephone.startsWith(code)) {
                matchedCode = code;
                remainingNumber = telephone.substring(code.length);
                break;
            }
        }

        return {
            countryCode: matchedCode,
            phoneNumber: formatPhoneNumber(remainingNumber),
            country: ''
        };
    };

    // Parse location into country and city
    const parseLocation = (location: string): { country: string; city: string } => {
        if (!location) {
            return { country: '', city: '' };
        }

        // Split by comma and take the last part as country, rest as city
        const parts = location.split(',').map(part => part.trim());
        if (parts.length > 1) {
            const country = parts[parts.length - 1];
            const city = parts.slice(0, -1).join(', ');
            return { country, city };
        }

        return { country: '', city: location };
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (currentUser?.role !== 'admin' && currentUser?.role !== 'owner') {
            navigate('/');
            return;
        }

        const fetchUser = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get all users and filter for the one we need
                const users = await apiService.getAllUsers();
                const userData = users.find(user => user.id === Number(id));
                
                if (!userData) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }
                
                const phoneData = parsePhoneNumber(userData.telephone || '');
                const locationData = parseLocation(userData.location || '');
                
                setFormData({
                    email: userData.email || '',
                    name: userData.name || '',
                    title: userData.title || '',
                    bio: userData.bio || '',
                    countryCode: phoneData.countryCode,
                    phoneNumber: phoneData.phoneNumber,
                    science_branch: userData.science_branch || '',
                    country: locationData.country,
                    location: locationData.city,
                    yoksis_id: userData.yoksis_id || '',
                    orcid_id: userData.orcid_id || '',
                    role: userData.role || 'user',
                    is_auth: userData.is_auth
                });
                
                setLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load user data');
                setLoading(false);
            }
        };

        if (id) {
            fetchUser();
        }
    }, [id, isAuthenticated, currentUser, navigate]);

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
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setHasAttemptedSubmit(true);

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
            
            const updateData: UserUpdate = {
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
                is_auth: formData.is_auth
            };
            
            // Call the updateUser function with the user ID and update data
            await apiService.updateUser(Number(id), updateData);
            
            setSuccess(true);
            setToastMessage(t('userUpdatedSuccessfully'));
            setToastType('success');
            setShowToast(true);
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
            
            navigate(`/admin/users/profile/${id}?updated=true`);
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update user');
            setLoading(false);
        }
    };

    const handleGenerateLoginLink = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Call API to generate a token
            const token = await apiService.generateUserLoginToken(Number(id));
            
            // Create the full login URL with the token
            const baseUrl = window.location.origin;
            const loginUrl = `${baseUrl}/auto-login?token=${token}&userId=${id}`;
            
            setLoginLink(loginUrl);
            setLoginLinkGenerated(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate login link');
            setLoading(false);
        }
    };

    const handleCopyLoginLink = () => {
        navigator.clipboard.writeText(loginLink)
            .then(() => {
                setToastMessage(t('linkCopied'));
                setToastType('success');
                setShowToast(true);
                
                // Hide toast after 4 seconds
                setTimeout(() => {
                    setShowToast(false);
                }, 4000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                setToastMessage(t('copyFailed'));
                setToastType('warning');
                setShowToast(true);
                
                // Hide toast after 4 seconds
                setTimeout(() => {
                    setShowToast(false);
                }, 4000);
            });
    };

    const handleSendLoginLinkEmail = async () => {
        try {
            setSendingEmail(true);
            setError(null);
            
            // Use custom email address if provided, otherwise use the user's email
            const emailToSend = customEmailAddress.trim() || formData.email;
            
            // Call API to send the login link via email
            await apiService.sendLoginLinkEmail(Number(id), loginLink, emailToSend);
            
            setEmailSent(true);
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to send login link via email');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDeleteConfirm = () => {
        setIsConfirmModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!currentUser?.id) {
            setError('Current admin user ID not available');
            return;
        }

        try {
            setDeleting(true);
            setError(null);
            setIsConfirmModalOpen(false);
            
            // Call API to delete user and transfer data to current admin
            await apiService.deleteUser(Number(id), currentUser.id);
            
            setSuccess(true);
            
            // Navigate back to admin page after short delay
            navigate('/admin?deleted=true');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete user');
            setDeleting(false);
        }
    };

    if (loading && !formData.email) {
        return (
            <>
                <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                    <h1>{t('editUser')}</h1>
                </div>
                <div className="page-content-section">
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '400px',
                        gap: '24px'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '3px solid rgba(20, 184, 166, 0.1)',
                            borderTopColor: '#14B8A6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{
                            fontSize: '16px',
                            color: '#64748B',
                            fontWeight: '500',
                            letterSpacing: '0.025em'
                        }}>{t('loading')}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Toast Notification */}
            {showToast && (
                <div className="toast-notification">
                    <div className={`toast-content toast-${toastType}`}>
                        <div className="toast-icon">
                            {toastType === 'success' ? '✓' : '⚠'}
                        </div>
                        <span className="toast-message">{toastMessage}</span>
                        <button 
                            className="toast-close"
                            onClick={() => setShowToast(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Title Section */}
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{t('editUser')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section" style={{ paddingBottom: '0px' }}>
                <div style={{ margin: '0 auto', maxWidth: '600px', width: '100%', padding: '0 20px' }}>
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
                            {t('userUpdatedSuccessfully')}
                        </div>
                    )}
                    
                    {/* Edit User Form */}
                    <div className="register-form-container" style={{ marginBottom: '24px' }}>
                        <form onSubmit={handleSubmit} className="register-form">
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
                                            }
                                        }}
                                        id="orcid_id"
                                        name="orcid_id"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="role" className="form-label">{language === 'tr' ? 'Rol' : 'Role'} *</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        style={{
                                            padding: '12px 16px',
                                            border: '2px solid #E2E8F0',
                                            borderRadius: '12px',
                                            background: 'rgba(249, 250, 251, 0.8)',
                                            backgroundColor: 'rgba(249, 250, 251, 0.8)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            color: '#374151',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            width: '100%',
                                            appearance: 'none' as const,
                                            WebkitAppearance: 'none' as const,
                                            MozAppearance: 'none' as const,
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 12px center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '16px',
                                            fontFamily: 'var(--font-family-sans)',
                                            outline: 'none',
                                            boxSizing: 'border-box' as const,
                                            minHeight: '48px',
                                            display: 'block'
                                        } as React.CSSProperties}
                                        onFocus={(e) => {
                                            e.target.style.setProperty('border-color', '#6A9DA1', 'important');
                                            e.target.style.setProperty('box-shadow', '0 0 0 3px rgba(106, 157, 161, 0.1)', 'important');
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.setProperty('border-color', '#E2E8F0', 'important');
                                            e.target.style.setProperty('box-shadow', 'none', 'important');
                                        }}
                                        ref={(element) => {
                                            if (element) {
                                                // Force override any CSS with !important
                                                element.style.setProperty('padding', '12px 16px', 'important');
                                                element.style.setProperty('border', '2px solid #E2E8F0', 'important');
                                                element.style.setProperty('border-radius', '12px', 'important');
                                                element.style.setProperty('background', 'rgba(249, 250, 251, 0.8)', 'important');
                                                element.style.setProperty('cursor', 'pointer', 'important');
                                                element.style.setProperty('color', '#374151', 'important');
                                                element.style.setProperty('font-size', '1rem', 'important');
                                                element.style.setProperty('font-weight', '500', 'important');
                                                element.style.setProperty('width', '100%', 'important');
                                                element.style.setProperty('appearance', 'none', 'important');
                                                element.style.setProperty('-webkit-appearance', 'none', 'important');
                                                element.style.setProperty('-moz-appearance', 'none', 'important');
                                                element.style.setProperty('background-image', `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 'important');
                                                element.style.setProperty('background-position', 'right 12px center', 'important');
                                                element.style.setProperty('background-repeat', 'no-repeat', 'important');
                                                element.style.setProperty('background-size', '16px', 'important');
                                                element.style.setProperty('outline', 'none', 'important');
                                                element.style.setProperty('min-height', '48px', 'important');
                                            }
                                        }}
                                    >
                                        <option value="author">{language === 'tr' ? 'Yazar' : 'Author'}</option>
                                        <option value="admin">{language === 'tr' ? 'Yönetici' : 'Admin'}</option>
                                        <option value="owner">{language === 'tr' ? 'Sahip' : 'Owner'}</option>
                                        <option value="editor">{language === 'tr' ? 'Editör' : 'Editor'}</option>
                                        <option value="referee">{language === 'tr' ? 'Hakem' : 'Referee'}</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Authorization Status Section */}
                            <div className="form-group">
                                <label className="form-label">
                                    {language === 'tr' ? 'Yetki Durumu' : 'Authorization Status'}
                                </label>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: 'var(--spacing-2)', 
                                    marginTop: 'var(--spacing-2)' 
                                }}>
                                    {/* Authorized Option */}
                                    <div 
                                        onClick={() => !loading && setFormData({...formData, is_auth: true})}
                                        style={{
                                            flex: '1',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            border: formData.is_auth ? '3px solid #14B8A6' : '2px solid #E2E8F0',
                                            background: formData.is_auth 
                                                ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)'
                                                : 'rgba(249, 250, 251, 0.8)',
                                            cursor: !loading ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s ease',
                                            textAlign: 'center',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: '1.5rem', 
                                            marginBottom: '4px',
                                            color: formData.is_auth ? '#14B8A6' : '#9CA3AF'
                                        }}>
                                            ✓
                                        </div>
                                        <div style={{ 
                                            fontWeight: '600', 
                                            fontSize: '0.9rem',
                                            color: formData.is_auth ? '#14B8A6' : '#6B7280'
                                        }}>
                                            {language === 'tr' ? 'Yetkili' : 'Authorized'}
                                        </div>
                                    </div>

                                    {/* Unauthorized Option */}
                                    <div 
                                        onClick={() => !loading && setFormData({...formData, is_auth: false})}
                                        style={{
                                            flex: '1',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            border: !formData.is_auth ? '3px solid #F59E0B' : '2px solid #E2E8F0',
                                            background: !formData.is_auth 
                                                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
                                                : 'rgba(249, 250, 251, 0.8)',
                                            cursor: !loading ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s ease',
                                            textAlign: 'center',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: '1.5rem', 
                                            marginBottom: '4px',
                                            color: !formData.is_auth ? '#F59E0B' : '#9CA3AF'
                                        }}>
                                            ⏸
                                        </div>
                                        <div style={{ 
                                            fontWeight: '600', 
                                            fontSize: '0.9rem',
                                            color: !formData.is_auth ? '#F59E0B' : '#6B7280'
                                        }}>
                                            {language === 'tr' ? 'Yetkisiz' : 'Unauthorized'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
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
                                display: 'flex',
                                gap: 'var(--spacing-3)',
                                marginTop: hasAttemptedSubmit && error ? '0px' : 'var(--spacing-6)'
                            }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    onClick={() => navigate(`/admin/users/profile/${id}`)}
                                    disabled={loading}
                                    style={{
                                        flex: '1',
                                        padding: '12px 20px',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: '12px',
                                        background: 'transparent',
                                        color: 'var(--color-text-secondary)',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    type="submit" 
                                    className="register-submit-button"
                                    disabled={loading}
                                    style={{
                                        flex: '2'
                                    }}
                                >
                                    {loading ? t('saving') : t('saveChanges')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Login Link Section */}
                    <div className="register-form-container" style={{ 
                        border: '2px solid #E0F2FE', 
                        backgroundColor: 'rgba(224, 242, 254, 0.3)',
                        padding: '0',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <div 
                            onClick={() => setIsLoginSectionExpanded(!isLoginSectionExpanded)}
                            style={{ 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                padding: '1.5rem',
                                backgroundColor: 'rgba(224, 242, 254, 0.5)',
                                borderBottom: isLoginSectionExpanded ? '2px solid #0EA5E9' : 'none',
                                margin: '0',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(224, 242, 254, 0.7)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(224, 242, 254, 0.5)';
                            }}
                        >
                            <h2 style={{ 
                                margin: '0', 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                color: '#0369A1'
                            }}>
                                {t('directLogin')}
                            </h2>
                            <span style={{ 
                                position: 'absolute',
                                right: '1.5rem',
                                fontSize: '2.5rem',
                                fontWeight: '300',
                                lineHeight: '1',
                                color: '#0369A1',
                                transition: 'transform 0.3s ease',
                                transform: isLoginSectionExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
                            }}>
                                +
                            </span>
                        </div>
                        
                        {isLoginSectionExpanded && (
                            <div style={{ padding: '1.5rem', backgroundColor: 'white' }}>
                                <p style={{ 
                                    color: '#6B7280', 
                                    marginBottom: '1.5rem',
                                    lineHeight: '1.6',
                                    fontSize: '1rem'
                                }}>
                                    {t('directLoginDescription')}
                                </p>
                                
                                {loginLinkGenerated ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {/* Link Display with Copy Icon */}
                                        <div style={{
                                            position: 'relative',
                                            padding: '12px 48px 12px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #E2E8F0',
                                            background: 'rgba(249, 250, 251, 0.8)',
                                            color: '#374151',
                                            fontFamily: 'monospace',
                                            fontSize: '0.9rem',
                                            wordBreak: 'break-all',
                                            textAlign: 'left'
                                        }}>
                                            {loginLink}
                                            <button
                                                type="button"
                                                onClick={handleCopyLoginLink}
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    right: '12px',
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#6B7280',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.color = '#0369A1'}
                                                onMouseOut={(e) => e.currentTarget.style.color = '#6B7280'}
                                            >
                                                <FaCopy size={18} />
                                            </button>
                                        </div>

                                        {/* Email Action */}
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="email"
                                                placeholder={t('customEmailAddress')}
                                                value={customEmailAddress}
                                                onChange={(e) => setCustomEmailAddress(e.target.value)}
                                                className="form-input"
                                                style={{ flex: '1' }}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleSendLoginLinkEmail}
                                                disabled={loading || sendingEmail}
                                                className="register-submit-button login-link-button"
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    minWidth: '48px',
                                                    padding: '0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '12px'
                                                }}
                                            >
                                                {sendingEmail ? (
                                                    <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                ) : (
                                                    <FaPaperPlane size={18} />
                                                )}
                                            </button>
                                        </div>
                                        
                                        {/* Status Messages */}
                                        <div style={{ textAlign: 'right', minHeight: '20px', fontSize: '0.9rem', color: '#059669', fontWeight: '500' }}>
                                            {emailSent && (
                                                <span className="email-sent-message">
                                                    {t('linkEmailSent')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateLoginLink}
                                            disabled={loading}
                                            className="register-submit-button login-link-button"
                                            style={{
                                                width: 'auto',
                                                minWidth: '200px',
                                                padding: '12px 24px',
                                            }}
                                        >
                                            {loading ? t('generating') : t('generateLoginLink')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Delete User Section */}
                    <div className="register-form-container" style={{ 
                        border: '2px solid #FEE2E2', 
                        backgroundColor: 'rgba(254, 226, 226, 0.3)',
                        padding: '0',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <div 
                            onClick={() => setIsDeletionSectionExpanded(!isDeletionSectionExpanded)}
                            style={{ 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                padding: '1.5rem',
                                backgroundColor: 'rgba(254, 226, 226, 0.5)',
                                borderBottom: isDeletionSectionExpanded ? '2px solid #FCA5A5' : 'none',
                                margin: '0',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(254, 226, 226, 0.7)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(254, 226, 226, 0.5)';
                            }}
                        >
                            <h2 style={{ 
                                margin: '0', 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                color: '#DC2626'
                            }}>
                                {t('deleteUser')}
                            </h2>
                            <span style={{ 
                                position: 'absolute',
                                right: '1.5rem',
                                fontSize: '2.5rem',
                                fontWeight: '300',
                                lineHeight: '1',
                                color: '#DC2626',
                                transition: 'transform 0.3s ease',
                                transform: isDeletionSectionExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
                            }}>
                                +
                            </span>
                        </div>
                        
                        {isDeletionSectionExpanded && (
                            <div style={{ padding: '1.5rem', backgroundColor: 'white' }}>
                                <p style={{ 
                                    color: '#6B7280', 
                                    marginBottom: '1.5rem',
                                    lineHeight: '1.6',
                                    fontSize: '1rem'
                                }}>
                                    {t('deleteUserWarning')}
                                </p>
                                
                                <div style={{ textAlign: 'center' }}>
                                    <button 
                                        type="button" 
                                        onClick={handleDeleteConfirm}
                                        disabled={loading || deleting}
                                        style={{
                                            backgroundColor: '#DC2626',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            cursor: (loading || deleting) ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            opacity: (loading || deleting) ? 0.6 : 1,
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                                        }}
                                        onMouseOver={(e) => {
                                            const target = e.target as HTMLButtonElement;
                                            if (!target.disabled) {
                                                target.style.backgroundColor = '#B91C1C';
                                                target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.4)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            const target = e.target as HTMLButtonElement;
                                            if (!target.disabled) {
                                                target.style.backgroundColor = '#DC2626';
                                                target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                                            }
                                        }}
                                    >
                                        {deleting ? t('deleting') : t('deleteUser')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteUser}
                title={t('deleteUser')}
                message={t('deleteUserConfirm')}
                confirmText={t('confirmDelete')}
                cancelText={t('cancel')}
                variant="danger"
                icon="⚠"
            />

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default EditUserPage; 