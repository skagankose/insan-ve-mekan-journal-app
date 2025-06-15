import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
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
    location: string;
    yoksis_id: string;
    orcid_id: string;
}

const ProfileEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { t } = useLanguage();
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    
    // Phone input state (separate country code and phone number)
    const [countryCode, setCountryCode] = useState('+90');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [currentFlag, setCurrentFlag] = useState('🇹🇷');
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);
    const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
    
    const [formData, setFormData] = useState<UserForm>({
        name: '',
        title: '',
        bio: '',
        science_branch: '',
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

    // Parse existing phone number to separate country code and number
    const parsePhoneNumber = (fullPhone: string) => {
        if (!fullPhone) return { code: '+90', number: '' };
        
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

        // Initialize form with current user data
        setFormData({
            name: user.name || '',
            title: user.title || '',
            bio: user.bio || '',
            science_branch: user.science_branch || '',
            location: user.location || '',
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
            setSuccess(false);
            
            // Combine country code and phone number
            const telephone = countryCode + phoneNumber.replace(/\s/g, '');
            
            // Prepare update data (excluding role, auth status, and email)
            const updateData = {
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                telephone: telephone || undefined,
                science_branch: formData.science_branch,
                location: formData.location,
                yoksis_id: formData.yoksis_id,
                orcid_id: formData.orcid_id,
            };
            
            // Update user profile using the user-specific endpoint
            await apiService.updateMyProfile(updateData);
            
            // Refresh user data in the auth context
            if (refreshUser) {
                await refreshUser();
            }
            
            setSuccess(true);
            
            // Navigate back to profile page after a short delay
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
            
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
            setPasswordSuccess(false);

            await apiService.changePassword(currentPassword, newPassword);
            
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to update password';
            setPasswordError(errorMessage);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleAccountDeletion = async () => {
        const shouldProceed = user?.marked_for_deletion ? true : 
            window.confirm(t('confirmMarkForDeletion') || 'Are you sure you want to mark your account for deletion? This action will be reviewed by an administrator.');

        if (shouldProceed) {
            try {
                if (user?.marked_for_deletion) {
                    await apiService.unmarkUserForDeletion();
                    if (refreshUser) {
                        await refreshUser();
                    }
                } else {
                    await apiService.markUserForDeletion();
                    if (refreshUser) {
                        await refreshUser();
                    }
                }
                navigate('/profile');
            } catch (err: any) {
                setError(err.response?.data?.detail || (user?.marked_for_deletion ? 'Failed to unmark account for deletion' : 'Failed to mark account for deletion'));
            }
        }
    };

    if (loading && !user) {
        return <div className="loading">{t('loading') || 'Loading...'}</div>;
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section">
                <h1>{t('editProfile') || 'Edit Profile'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                {/* Profile Information Form */}
                <div className="register-form-container" style={{ marginBottom: '2rem' }}>
                    <form className="register-form" onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ 
                                margin: '0 0 1.5rem 0', 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                color: '#374151',
                                borderBottom: '2px solid #E5E7EB',
                                paddingBottom: '0.5rem'
                            }}>
                                {t('personalInformation') || 'Personal Information'}
                            </h2>
                            
                            <div className="form-group">
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
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="title">{t('academicTitle') || 'Academic Title'}</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    maxLength={200}
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
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
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ 
                                margin: '0 0 1.5rem 0', 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                color: '#374151',
                                borderBottom: '2px solid #E5E7EB',
                                paddingBottom: '0.5rem'
                            }}>
                                {t('contactInformation') || 'Contact Information'}
                            </h2>
                            
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
                                        placeholder="555 55 55"
                                        maxLength={9}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">{t('location') || 'Location'}</label>
                                <LocationInput
                                    value={formData.location}
                                    onChange={(value) => handleInputChange({
                                        target: { name: 'location', value }
                                    } as React.ChangeEvent<HTMLInputElement>)}
                                    id="location"
                                    name="location"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ 
                                margin: '0 0 1.5rem 0', 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                color: '#374151',
                                borderBottom: '2px solid #E5E7EB',
                                paddingBottom: '0.5rem'
                            }}>
                                {t('academicInformation') || 'Academic Information'}
                            </h2>
                            
                            <div className="form-group">
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
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="yoksis_id">{t('yoksisId') || 'YÖKSİS ID'}</label>
                                <FormattedIdInput
                                    type="yoksis"
                                    value={formData.yoksis_id}
                                    onChange={(value) => handleInputChange({
                                        target: { name: 'yoksis_id', value }
                                    } as React.ChangeEvent<HTMLInputElement>)}
                                    id="yoksis_id"
                                    name="yoksis_id"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="orcid_id">{t('orcidId') || 'ORCID ID'}</label>
                                <FormattedIdInput
                                    type="orcid"
                                    value={formData.orcid_id}
                                    onChange={(value) => handleInputChange({
                                        target: { name: 'orcid_id', value }
                                    } as React.ChangeEvent<HTMLInputElement>)}
                                    id="orcid_id"
                                    name="orcid_id"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="success-message">
                                {t('profileUpdated') || 'Profile updated successfully!'}
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            justifyContent: 'flex-end',
                            marginTop: '2rem'
                        }}>
                            <button 
                                type="button" 
                                className="btn btn-outline" 
                                onClick={() => navigate('/profile')}
                                disabled={loading}
                                style={{
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
                                style={{ width: 'auto', margin: 0 }}
                            >
                                {loading ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Change Section */}
                <div className="register-form-container" style={{ marginBottom: '2rem' }}>
                    <form className="register-form" onSubmit={handlePasswordChange}>
                        <h2 style={{ 
                            margin: '0 0 1.5rem 0', 
                            fontSize: '1.5rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            borderBottom: '2px solid #E5E7EB',
                            paddingBottom: '0.5rem'
                        }}>
                            {t('changePassword') || 'Change Password'}
                        </h2>

                        {passwordError && (
                            <div className="error-message">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="success-message">
                                {t('passwordUpdated') || 'Password updated successfully!'}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="currentPassword">{t('currentPassword') || 'Current Password'}</label>
                            <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="form-input"
                                required
                                disabled={isChangingPassword}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">{t('newPassword') || 'New Password'}</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (confirmNewPassword) {
                                        validatePassword(e.target.value);
                                    }
                                }}
                                className="form-input"
                                required
                                disabled={isChangingPassword}
                                minLength={8}
                            />
                            <div className="password-requirements">
                                <div className="password-requirements-list" style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    <div>• {t('passwordMinLength') || 'At least 8 characters long'}</div>
                                    <div>• {t('passwordCase') || 'Contains uppercase and lowercase letters'}</div>
                                    <div>• {t('passwordNumber') || 'Contains at least one number'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmNewPassword">{t('confirmPassword') || 'Confirm New Password'}</label>
                            <input
                                type="password"
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => {
                                    setConfirmNewPassword(e.target.value);
                                    if (newPassword) {
                                        validatePassword(newPassword);
                                    }
                                }}
                                className="form-input"
                                required
                                disabled={isChangingPassword}
                                minLength={8}
                            />
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            marginTop: '2rem'
                        }}>
                            <button 
                                type="submit" 
                                className="register-submit-button"
                                disabled={isChangingPassword}
                                style={{ width: 'auto', margin: 0 }}
                            >
                                {isChangingPassword ? (t('changingPassword') || 'Changing Password...') : (t('changePassword') || 'Change Password')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Account Deletion Section */}
                <div className="register-form-container" style={{ 
                    border: '2px solid #FEE2E2', 
                    backgroundColor: 'rgba(254, 226, 226, 0.3)' 
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ 
                            margin: '0 0 1.5rem 0', 
                            fontSize: '1.5rem', 
                            fontWeight: '600', 
                            color: '#DC2626',
                            borderBottom: '2px solid #FCA5A5',
                            paddingBottom: '0.5rem'
                        }}>
                            {user?.marked_for_deletion 
                                ? (t('unmarkForDeletion') || 'Unmark Account for Deletion')
                                : (t('markForDeletion') || 'Mark Account for Deletion')
                            }
                        </h2>
                        
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
                </div>
            </div>
        </>
    );
};

export default ProfileEditPage; 