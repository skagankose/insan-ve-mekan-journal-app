import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import CountrySelector from '../components/CountrySelector';
import ConfirmationModal from '../components/ConfirmationModal';
import { validateYoksisId, validateOrcidId, validatePhoneNumber } from '../utils/validation';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../styles/FormattedIdInput.css';

// Country code to flag mapping (copied from RegisterPage)
const countryFlags: { [key: string]: string } = {
    '+1': '🇺🇸', '+7': '🇷🇺', '+20': '🇪🇬', '+27': '🇿🇦', '+30': '🇬🇷', '+31': '🇳🇱', '+32': '🇧🇪', '+33': '🇫🇷', '+34': '🇪🇸', '+36': '🇭🇺',
    '+39': '🇮🇹', '+40': '🇷🇴', '+41': '🇨🇭', '+43': '🇦🇹', '+44': '🇬🇧', '+45': '🇩🇰', '+46': '🇸🇪', '+47': '🇳🇴', '+48': '🇵🇱', '+49': '🇩🇪',
    '+51': '🇵🇪', '+52': '🇲🇽', '+53': '🇨🇺', '+54': '🇦🇷', '+55': '🇧🇷', '+56': '🇨🇱', '+57': '🇨🇴', '+58': '🇻🇪', '+60': '🇲🇾', '+61': '🇦🇺',
    '+62': '🇮🇩', '+63': '🇵🇭', '+64': '🇳🇿', '+65': '🇸🇬', '+66': '🇹🇭', '+81': '🇯🇵', '+82': '🇰🇷', '+84': '🇻🇳', '+86': '🇨🇳', '+90': '🇹🇷',
    '+91': '🇮🇳', '+92': '🇵🇰', '+93': '🇦🇫', '+94': '🇱🇰', '+95': '🇲🇲', '+98': '🇮🇷', '+212': '🇲🇦', '+213': '🇩🇿', '+216': '🇹🇳', '+218': '🇱🇾',
    '+220': '🇬🇲', '+221': '🇸🇳', '+222': '🇲🇷', '+223': '🇲🇱', '+224': '🇬🇳', '+225': '🇨🇮', '+226': '🇧🇫', '+227': '🇳🇪', '+228': '🇹🇬', '+229': '🇧🇯',
    '+230': '🇲🇺', '+231': '🇱🇷', '+232': '🇸🇱', '+233': '🇬🇭', '+234': '🇳🇬', '+235': '🇹🇩', '+236': '🇨🇫', '+237': '🇨🇲', '+238': '🇨🇻', '+239': '🇸🇹',
    '+240': '🇬🇶', '+241': '🇬🇦', '+242': '🇨🇬', '+243': '🇨🇩', '+244': '🇦🇴', '+245': '🇬🇼', '+246': '🇮🇴', '+248': '🇸🇨', '+249': '🇸🇩', '+250': '🇷🇼',
    '+251': '🇪🇹', '+252': '🇸🇴', '+253': '🇩🇯', '+254': '🇰🇪', '+255': '🇹🇿', '+256': '🇺🇬', '+257': '🇧🇮', '+258': '🇲🇿', '+260': '🇿🇲', '+261': '🇲🇬',
    '+262': '🇷🇪', '+263': '🇿🇼', '+264': '🇳🇦', '+265': '🇲🇼', '+266': '🇱🇸', '+267': '🇧🇼', '+268': '🇸🇿', '+269': '🇰🇲', '+290': '🇸🇭', '+291': '🇪🇷',
    '+297': '🇦🇼', '+298': '🇫🇴', '+299': '🇬🇱', '+350': '🇬🇮', '+351': '🇵🇹', '+352': '🇱🇺', '+353': '🇮🇪', '+354': '🇮🇸', '+355': '🇦🇱', '+356': '🇲🇹',
    '+357': '🇨🇾', '+358': '🇫🇮', '+359': '🇧🇬', '+370': '🇱🇹', '+371': '🇱🇻', '+372': '🇪🇪', '+373': '🇲🇩', '+374': '🇦🇲', '+375': '🇧🇾', '+376': '🇦🇩',
    '+377': '🇲🇨', '+378': '🇸🇲', '+380': '🇺🇦', '+381': '🇷🇸', '+382': '🇲🇪', '+383': '🇽🇰', '+385': '🇭🇷', '+386': '🇸🇮', '+387': '🇧🇦', '+389': '🇲🇰',
    '+420': '🇨🇿', '+421': '🇸🇰', '+423': '🇱🇮', '+500': '🇫🇰', '+501': '🇧🇿', '+502': '🇬🇹', '+503': '🇸🇻', '+504': '🇭🇳', '+505': '🇳🇮', '+506': '🇨🇷',
    '+507': '🇵🇦', '+508': '🇵🇲', '+509': '🇭🇹', '+590': '🇬🇵', '+591': '🇧🇴', '+592': '🇬🇾', '+593': '🇪🇨', '+594': '🇬🇫', '+595': '🇵🇾', '+596': '🇲🇶',
    '+597': '🇸🇷', '+598': '🇺🇾', '+599': '🇧🇶', '+670': '🇹🇱', '+672': '🇦🇶', '+673': '🇧🇳', '+674': '🇳🇷', '+675': '🇵🇬', '+676': '🇹🇴', '+677': '🇸🇧',
    '+678': '🇻🇺', '+679': '🇫🇯', '+680': '🇵🇼', '+681': '🇼🇫', '+682': '🇨🇰', '+683': '🇳🇺', '+684': '🇦🇸', '+685': '🇼🇸', '+686': '🇰🇮', '+687': '🇳🇨',
    '+688': '🇹🇻', '+689': '🇵🇫', '+690': '🇹🇰', '+691': '🇫🇲', '+692': '🇲🇭', '+850': '🇰🇵', '+852': '🇭🇰', '+853': '🇲🇴', '+855': '🇰🇭', '+856': '🇱🇦',
    '+880': '🇧🇩', '+886': '🇹🇼', '+960': '🇲🇻', '+961': '🇱🇧', '+962': '🇯🇴', '+963': '🇸🇾', '+964': '🇮🇶', '+965': '🇰🇼', '+966': '🇸🇦', '+967': '🇾🇪',
    '+968': '🇴🇲', '+970': '🇵🇸', '+971': '🇦🇪', '+972': '🇮🇱', '+973': '🇧🇭', '+974': '🇶🇦', '+975': '🇧🇹', '+976': '🇲🇳', '+977': '🇳🇵', '+992': '🇹🇯',
    '+993': '🇹🇲', '+994': '🇦🇿', '+995': '🇬🇪', '+996': '🇰🇬', '+998': '🇺🇿'
};
import './EditUserPage.css'; // Reuse the same CSS

interface UserForm {
    name: string;
    title: string;
    bio: string;
    science_branch: string;
    country: string;
    location: string;
    yoksis_id: string;
    orcid_id: string;
}

const ProfileEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { t, language } = useLanguage();
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    
    // Phone input state (separate country code and phone number)
    const [countryCode, setCountryCode] = useState('+90');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [currentFlag, setCurrentFlag] = useState('🇹🇷');
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
    
    // Password visibility state
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    
    // Collapsible sections state
    const [isPasswordSectionExpanded, setIsPasswordSectionExpanded] = useState<boolean>(false);
    const [isDeletionSectionExpanded, setIsDeletionSectionExpanded] = useState<boolean>(false);
    
    // Deletion confirmation modal state
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

    const [formData, setFormData] = useState<UserForm>({
        name: '',
        title: '',
        bio: '',
        science_branch: '',
        country: '',
        location: '',
        yoksis_id: '',
        orcid_id: '',
    });

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

    // Handle country code change
    const handleCountryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        // Clear errors when user starts typing
        if (hasAttemptedSubmit) {
            setError(null);
        }
    };

    // Format phone number as user types
    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const digitsOnly = value.replace(/\D/g, '');
        
        // Limit to 10 digits (for Turkish mobile format: XXX XXX XX XX)
        const limitedDigits = digitsOnly.slice(0, 10);
        
        // Format as XXX XXX XX XX
        let formatted = '';
        if (limitedDigits.length > 0) {
            formatted = limitedDigits.slice(0, 3);
            if (limitedDigits.length > 3) {
                formatted += ' ' + limitedDigits.slice(3, 6);
                if (limitedDigits.length > 6) {
                    formatted += ' ' + limitedDigits.slice(6, 8);
                    if (limitedDigits.length > 8) {
                        formatted += ' ' + limitedDigits.slice(8, 10);
                    }
                }
            }
        }
        
        return formatted;
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
        // Clear errors when user starts typing
        if (hasAttemptedSubmit) {
            setError(null);
        }
    };

    // Parse existing phone number to separate country code and number
    const parsePhoneNumber = (fullPhone: string) => {
        if (!fullPhone) return { code: '+90', number: '' }; // Return default Turkey code if no phone
        
        // Find the longest matching country code
        let bestMatch = '+90';
        let bestMatchLength = 0;
        
        for (const code in countryFlags) {
            if (fullPhone.startsWith(code) && code.length > bestMatchLength) {
                bestMatch = code;
                bestMatchLength = code.length;
            }
        }
        
        const remainingNumber = fullPhone.substring(bestMatchLength);
        return { code: bestMatch, number: formatPhoneNumber(remainingNumber) };
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Parse existing phone number
        const { code, number } = parsePhoneNumber(user.telephone || '');
        setCountryCode(code);
        setPhoneNumber(number);

        // Parse location into country and city (same as EditUserPage)
        const parseLocation = (location: string): { country: string; city: string } => {
            if (!location) {
                return { country: '', city: '' };
            }
            const parts = location.split(',').map(part => part.trim());
            if (parts.length > 1) {
                const country = parts[parts.length - 1];
                const city = parts.slice(0, -1).join(', ');
                return { country, city };
            }
            return { country: '', city: location };
        };

        const locationData = parseLocation(user.location || '');

        // Initialize form with current user data
        setFormData({
            name: user.name || '',
            title: user.title || '',
            bio: user.bio || '',
            science_branch: user.science_branch || '',
            country: locationData.country,
            location: locationData.city,
            yoksis_id: user.yoksis_id || '',
            orcid_id: user.orcid_id || '',
        });
        
        setLoading(false);
    }, [user, navigate]);

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
        if (password !== confirmNewPassword) {
            setPasswordError(t('passwordMatch'));
            return false;
        }

        setPasswordError(null);
        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear errors when user starts typing
        if (hasAttemptedSubmit) {
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            setError('User not authenticated');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            setHasAttemptedSubmit(true);
            
            // Validate YÖKSİS ID if provided
            if (formData.yoksis_id && !validateYoksisId(formData.yoksis_id)) {
                setError(t('yoksisValidationError'));
                setLoading(false);
                return;
            }
            
            // Validate ORCID ID if provided
            if (formData.orcid_id && !validateOrcidId(formData.orcid_id)) {
                setError(t('orcidValidationError'));
                setLoading(false);
                return;
            }
            
            // Validate phone number if provided
            if (phoneNumber.trim() && !validatePhoneNumber(countryCode, phoneNumber)) {
                setError(language === 'tr' ? 'Telefon numarası 555 555 55 55 formatında olmalıdır' : 'Phone number must be in format 555 555 55 55');
                setLoading(false);
                return;
            }
            
            // Combine country code and phone number
            const telephone = countryCode + phoneNumber.replace(/\s/g, '');
            
            // Prepare update data (excluding role, auth status, and email)
            const updateData = {
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                telephone: telephone || undefined,
                science_branch: formData.science_branch,
                location: formData.country && formData.location ? `${formData.location}, ${formData.country}` : formData.location || formData.country || undefined,
                yoksis_id: formData.yoksis_id,
                orcid_id: formData.orcid_id,
            };
            
            // Update user profile using the user-specific endpoint
            await apiService.updateMyProfile(updateData);
            
            // Refresh user data in the auth context
            if (refreshUser) {
                await refreshUser();
            }
            
            // Navigate back to profile page after a short delay
            setTimeout(() => {
                navigate('/profile?updated=true');
            }, 500);
            
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to update profile';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validatePassword(newPassword)) {
            return;
        }

        try {
            setIsChangingPassword(true);
            setPasswordError(null);

            await apiService.changePassword(currentPassword, newPassword);
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            
            // Navigate to profile page with password updated parameter
            navigate('/profile?passwordUpdated=true');

        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (detail === 'Incorrect current password') {
                setPasswordError(t('incorrectCurrentPassword'));
            } else {
                setPasswordError(t('passwordUpdateFailed'));
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleAccountDeletion = () => {
        // Just open the modal, don't perform the action yet
        setIsConfirmModalOpen(true);
    };

    const confirmAccountDeletion = async () => {
        setIsConfirmModalOpen(false); // Close the modal first
        try {
            const wasMarkedForDeletion = user?.marked_for_deletion;
            
            if (wasMarkedForDeletion) {
                await apiService.unmarkUserForDeletion();
            } else {
                await apiService.markUserForDeletion();
            }
            
            if (refreshUser) {
                await refreshUser();
            }
            
            // Navigate with appropriate parameter based on the action performed
            const param = wasMarkedForDeletion ? 'unmarkedForDeletion=true' : 'markedForDeletion=true';
            navigate(`/profile?${param}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || (user?.marked_for_deletion ? 'Failed to unmark account for deletion' : 'Failed to mark account for deletion'));
        }
    };

    if (loading && !user) {
        return <div className="loading">{t('loading') || 'Loading...'}</div>;
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{t('editProfile')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                {/* Profile Information Form */}
                <div className="register-form-container" style={{ marginBottom: '2rem' }}>
                    <form className="register-form" onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '-2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="name">{t('name') || 'Name'}</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    maxLength={200}
                                    disabled={loading}
                                    title={`${t('maxCharacters')}: 200`}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="title">{t('academicTitle')}</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    maxLength={200}
                                    disabled={loading}
                                    title={`${t('maxCharacters')}: 200`}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="bio">{t('biography') || 'Biography'}</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    className="form-textarea"
                                    rows={5}
                                    maxLength={400}
                                    disabled={loading}
                                    title={`${t('maxCharacters')}: 400`}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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
                                        disabled={loading}
                                        className="form-input country-code-input"
                                        maxLength={4}
                                        placeholder="+90"
                                    />
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        value={phoneNumber}
                                        onChange={handlePhoneNumberChange}
                                        disabled={loading}
                                        className="form-input phone-number-input"
                                        placeholder="555 555 55 55"
                                        maxLength={13}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="country">{t('country') || 'Country'}</label>
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

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="location">{t('location') || 'City/Location'}</label>
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
                                    maxLength={200}
                                    title={`${t('maxCharacters')}: 200`}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="science_branch">{t('scienceBranch') || 'Science Branch'}</label>
                                <input
                                    type="text"
                                    id="science_branch"
                                    name="science_branch"
                                    value={formData.science_branch}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    maxLength={300}
                                    disabled={loading}
                                    title={`${t('maxCharacters')}: 300`}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="yoksis_id">{t('yoksisId') || 'YÖKSİS ID'}</label>
                                <FormattedIdInput
                                    type="yoksis"
                                    value={formData.yoksis_id}
                                    onChange={(value) => {
                                        handleInputChange({
                                            target: { name: 'yoksis_id', value }
                                        } as React.ChangeEvent<HTMLInputElement>);
                                    }}
                                    id="yoksis_id"
                                    name="yoksis_id"
                                    disabled={loading}
                                    showValidationErrors={hasAttemptedSubmit}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="orcid_id">{t('orcidId') || 'ORCID ID'}</label>
                                <FormattedIdInput
                                    type="orcid"
                                    value={formData.orcid_id}
                                    onChange={(value) => {
                                        handleInputChange({
                                            target: { name: 'orcid_id', value }
                                        } as React.ChangeEvent<HTMLInputElement>);
                                    }}
                                    id="orcid_id"
                                    name="orcid_id"
                                    disabled={loading}
                                    showValidationErrors={hasAttemptedSubmit}
                                />
                            </div>
                        </div>

                        {hasAttemptedSubmit && error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            marginTop: '2rem'
                        }}>
                            <button 
                                type="button" 
                                className="btn btn-outline" 
                                onClick={() => navigate('/profile')}
                                disabled={loading}
                                style={{
                                    flex: '1',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    fontWeight: '600'
                                }}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                className="register-submit-button"
                                disabled={loading}
                                style={{ flex: '1', margin: 0 }}
                            >
                                {loading ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Change Section */}
                <div className="register-form-container" style={{ 
                    marginBottom: '2rem', 
                    padding: '0', 
                    overflow: 'hidden',
                    border: '2px solid #FEF3C7',
                    backgroundColor: 'rgba(254, 243, 199, 0.3)'
                }}>
                    <div 
                        onClick={() => setIsPasswordSectionExpanded(!isPasswordSectionExpanded)}
                        style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            padding: '1.5rem',
                            backgroundColor: 'rgba(254, 243, 199, 0.5)',
                            borderBottom: isPasswordSectionExpanded ? '2px solid #F59E0B' : 'none',
                            margin: '0',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(254, 243, 199, 0.7)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(254, 243, 199, 0.5)';
                        }}
                    >
                        <h2 style={{ 
                            margin: '0', 
                            fontSize: '1.5rem', 
                            fontWeight: '600', 
                            color: '#D97706'
                        }}>
                            {t('changePassword') || 'Change Password'}
                        </h2>
                        <span style={{ 
                            position: 'absolute',
                            right: '1.5rem',
                            fontSize: '2.5rem',
                            fontWeight: '300',
                            lineHeight: '1',
                            color: '#D97706',
                            transition: 'transform 0.3s ease',
                            transform: isPasswordSectionExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
                        }}>
                            +
                        </span>
                    </div>
                    
                    {isPasswordSectionExpanded && (
                        <div style={{ padding: '1.5rem', backgroundColor: 'white' }}>
                            <form className="register-form password-change-section" onSubmit={handlePasswordChange} style={{ padding: '0' }}>

                        <div className="form-group">
                            <label htmlFor="currentPassword">{t('currentPassword') || 'Current Password'}</label>
                            <div className="password-input-container">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        setPasswordError(null);
                                    }}
                                    className="form-input"
                                    required
                                    disabled={isChangingPassword}
                                    maxLength={100}
                                    title={`${t('maxCharacters')}: 100`}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    disabled={isChangingPassword}
                                >
                                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">{t('newPassword') || 'New Password'}</label>
                            <div className="password-input-container">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPasswordError(null);
                                    }}
                                    className="form-input"
                                    required
                                    disabled={isChangingPassword}
                                    minLength={8}
                                    maxLength={100}
                                    title={`${t('maxCharacters')}: 100`}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    disabled={isChangingPassword}
                                >
                                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            <div className="password-requirements" style={{ background: 'rgba(254, 243, 199, 0.4)', border: '1px solid #F59E0B' }}>
                                <div className="password-requirements-list" style={{ color: '#B45309', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    <div>• {t('passwordMinLength') || 'At least 8 characters long'}</div>
                                    <div>• {t('passwordCase') || 'Contains uppercase and lowercase letters'}</div>
                                    <div>• {t('passwordNumber') || 'Contains at least one number'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmNewPassword">{t('confirmPassword') || 'Confirm New Password'}</label>
                            <div className="password-input-container">
                                <input
                                    type={showConfirmNewPassword ? "text" : "password"}
                                    id="confirmNewPassword"
                                    value={confirmNewPassword}
                                    onChange={(e) => {
                                        setConfirmNewPassword(e.target.value);
                                        setPasswordError(null);
                                    }}
                                    className="form-input"
                                    required
                                    disabled={isChangingPassword}
                                    minLength={8}
                                    maxLength={100}
                                    title={`${t('maxCharacters')}: 100`}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                    disabled={isChangingPassword}
                                >
                                    {showConfirmNewPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="error-message" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                {passwordError}
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            marginTop: '2rem'
                        }}>
                            <button 
                                type="submit" 
                                className="register-submit-button"
                                disabled={isChangingPassword}
                                style={{ 
                                    width: 'auto', 
                                    margin: 0,
                                    background: '#F59E0B',
                                    borderColor: '#F59E0B',
                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    if (!target.disabled) {
                                        target.style.background = '#D97706';
                                        target.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    if (!target.disabled) {
                                        target.style.background = '#F59E0B';
                                        target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                                    }
                                }}
                            >
                                {isChangingPassword ? (t('changingPassword') || 'Changing Password...') : (t('changePassword') || 'Change Password')}
                            </button>
                        </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Account Deletion Section */}
                <div className="register-form-container" style={{ 
                    border: user?.marked_for_deletion ? '2px solid #BBF7D0' : '2px solid #FEE2E2', 
                    backgroundColor: user?.marked_for_deletion ? 'rgba(187, 247, 208, 0.3)' : 'rgba(254, 226, 226, 0.3)',
                    padding: '0',
                    overflow: 'hidden'
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
                            backgroundColor: user?.marked_for_deletion ? 'rgba(187, 247, 208, 0.5)' : 'rgba(254, 226, 226, 0.5)',
                            borderBottom: isDeletionSectionExpanded ? (user?.marked_for_deletion ? '2px solid #86EFAC' : '2px solid #FCA5A5') : 'none',
                            margin: '0',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = user?.marked_for_deletion ? 'rgba(187, 247, 208, 0.7)' : 'rgba(254, 226, 226, 0.7)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = user?.marked_for_deletion ? 'rgba(187, 247, 208, 0.5)' : 'rgba(254, 226, 226, 0.5)';
                        }}
                    >
                        <h2 style={{ 
                            margin: '0', 
                            fontSize: '1.5rem', 
                            fontWeight: '600', 
                            color: user?.marked_for_deletion ? '#059669' : '#DC2626'
                        }}>
                            {user?.marked_for_deletion 
                                ? (t('unmarkForDeletion') || 'Unmark Account for Deletion')
                                : (t('markForDeletion') || 'Mark Account for Deletion')
                            }
                        </h2>
                        <span style={{ 
                            position: 'absolute',
                            right: '1.5rem',
                            fontSize: '2.5rem',
                            fontWeight: '300',
                            lineHeight: '1',
                            color: user?.marked_for_deletion ? '#059669' : '#DC2626',
                            transition: 'transform 0.3s ease',
                            transform: isDeletionSectionExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
                        }}>
                            +
                        </span>
                    </div>
                    
                    {isDeletionSectionExpanded && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'white' }}>
                        
                        <p style={{ 
                            color: '#6B7280', 
                            marginBottom: '2rem',
                            lineHeight: '1.6',
                            fontSize: '1rem'
                        }}>
                            {user?.marked_for_deletion
                                ? (t('unmarkForDeletionWarning') || 'Your account is currently marked for deletion. Click the button below to cancel the deletion request.')
                                : (t('markForDeletionWarning') || 'Warning: This action will mark your account for deletion. This is the first step in the account deletion process. An administrator will review and process your request.')
                            }
                        </p>
                        
                        <button 
                            type="button" 
                            className="btn"
                            onClick={handleAccountDeletion}
                            style={{
                                backgroundColor: user?.marked_for_deletion ? '#10B981' : '#DC2626',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: user?.marked_for_deletion 
                                    ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                                    : '0 2px 8px rgba(220, 38, 38, 0.3)'
                            }}
                            onMouseOver={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.backgroundColor = user?.marked_for_deletion ? '#059669' : '#B91C1C';
                                target.style.boxShadow = user?.marked_for_deletion 
                                    ? '0 4px 16px rgba(16, 185, 129, 0.4)' 
                                    : '0 4px 16px rgba(220, 38, 38, 0.4)';
                            }}
                            onMouseOut={(e) => {
                                const target = e.target as HTMLButtonElement;
                                target.style.backgroundColor = user?.marked_for_deletion ? '#10B981' : '#DC2626';
                                target.style.boxShadow = user?.marked_for_deletion 
                                    ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                                    : '0 2px 8px rgba(220, 38, 38, 0.3)';
                            }}
                        >
                            {user?.marked_for_deletion
                                ? (t('unmarkForDeletion') || 'Unmark for Deletion')
                                : (t('markForDeletion') || 'Mark for Deletion')
                            }
                        </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAccountDeletion}
                title={user?.marked_for_deletion ? t('unmarkForDeletion') : t('markForDeletion')}
                message={user?.marked_for_deletion ? t('unmarkForDeletionWarning') : t('markForDeletionWarning')}
                confirmText={user?.marked_for_deletion ? t('unmarkForDeletion') : t('markForDeletion')}
                cancelText={t('cancel')}
                variant={user?.marked_for_deletion ? 'success' : 'danger'}
                icon={user?.marked_for_deletion ? '✓' : '⚠'}
            />
        </>
    );
};

export default ProfileEditPage; 