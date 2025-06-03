import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import PhoneInput from 'react-phone-input-2';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-phone-input-2/lib/style.css';
import '../styles/PhoneInput.css';
import '../styles/FormattedIdInput.css';
import './EditUserPage.css'; // Reuse the same CSS

interface UserForm {
    name: string;
    title: string;
    bio: string;
    telephone: string;
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
        telephone: '',
        science_branch: '',
        location: '',
        yoksis_id: '',
        orcid_id: '',
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Initialize form with current user data
        setFormData({
            name: user.name || '',
            title: user.title || '',
            bio: user.bio || '',
            telephone: user.telephone || '',
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
            
            // Prepare update data (excluding role, auth status, and email)
            const updateData = {
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                telephone: formData.telephone,
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
            navigate('/profile');
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update profile');
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
            setPasswordError(err.response?.data?.detail || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (loading && !user) {
        return <div className="loading">{t('loading') || 'Loading...'}</div>;
    }

    return (
        <div className="edit-user-container">
            <div className="page-header">
                <h1>{t('editProfile') || 'Edit Profile'}</h1>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {t('profileUpdated') || 'Profile updated successfully!'}
                </div>
            )}

            <form className="edit-user-form" onSubmit={handleSubmit}>
                <div className="form-section">
                    <h2>{t('personalInformation') || 'Personal Information'}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="name">{t('name') || 'Name'}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="form-control"
                            required
                            maxLength={200}
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
                            className="form-control"
                            maxLength={200}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">{t('biography') || 'Biography'}</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            className="form-control"
                            rows={5}
                            maxLength={400}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h2>{t('contactInformation') || 'Contact Information'}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="telephone">{t('telephone') || 'Telephone'}</label>
                        <PhoneInput
                            country={'tr'}
                            value={formData.telephone}
                            onChange={(phone: string) => handleInputChange({
                                target: { name: 'telephone', value: phone }
                            } as React.ChangeEvent<HTMLInputElement>)}
                            inputProps={{
                                id: 'telephone',
                                disabled: loading
                            }}
                            containerClass="phone-input-container"
                            inputClass="form-input"
                            buttonClass="country-dropdown"
                            disabled={loading}
                            enableSearch={true}
                            searchPlaceholder={t('searchCountry') || 'Search country'}
                            searchNotFound={t('countryNotFound') || 'Country not found'}
                            preferredCountries={['tr']}
                        />
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

                <div className="form-section">
                    <h2>{t('academicInformation') || 'Academic Information'}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="science_branch">{t('scienceBranch') || 'Science Branch'}</label>
                        <input
                            type="text"
                            id="science_branch"
                            name="science_branch"
                            value={formData.science_branch}
                            onChange={handleInputChange}
                            className="form-control"
                            maxLength={300}
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

                <div className="form-actions">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/profile')}
                        disabled={loading}
                    >
                        {t('cancel') || 'Cancel'}
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
                    </button>
                </div>
            </form>

            {/* Password Change Section */}
            <form className="edit-user-form" onSubmit={handlePasswordChange} style={{ marginTop: '2rem' }}>
                <div className="form-section">
                    <h2>{t('changePassword') || 'Change Password'}</h2>

                    {passwordError && (
                        <div className="alert alert-danger">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="alert alert-success">
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
                            className="form-control"
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
                            className="form-control"
                            required
                            disabled={isChangingPassword}
                            minLength={8}
                        />
                        <small className="form-text text-muted">
                            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                                <li>{t('passwordMinLength')}</li>
                                <li>{t('passwordCase')}</li>
                                <li>{t('passwordNumber')}</li>
                            </ul>
                        </small>
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
                            className="form-control"
                            required
                            disabled={isChangingPassword}
                            minLength={8}
                        />
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? (t('changingPassword') || 'Changing Password...') : (t('changePassword') || 'Change Password')}
                        </button>
                    </div>
                </div>
            </form>

            {/* Mark for Deletion Section */}
            <div className="form-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ff4444', borderRadius: '4px' }}>
                <h2 style={{ color: '#ff4444' }}>
                    {user?.marked_for_deletion 
                        ? (t('unmarkForDeletion') || 'Unmark Account for Deletion')
                        : (t('markForDeletion') || 'Mark Account for Deletion')
                    }
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                    {user?.marked_for_deletion
                        ? (t('unmarkForDeletionWarning') || 'Your account is currently marked for deletion. Click the button below to cancel the deletion request.')
                        : (t('markForDeletionWarning') || 'Warning: This action will mark your account for deletion. This is the first step in the account deletion process. An administrator will review and process your request.')
                    }
                </p>
                <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={async () => {
                        const shouldProceed = user?.marked_for_deletion ? true : 
                            window.confirm(t('confirmMarkForDeletion') || 'Are you sure you want to mark your account for deletion? This action will be reviewed by an administrator.');

                        if (shouldProceed) {
                            try {
                                if (user?.marked_for_deletion) {
                                    await apiService.unmarkUserForDeletion();
                                    if (refreshUser) {
                                        await refreshUser();
                                    }
                                    toast.success(t('accountUnmarkedForDeletion') || 'Your account has been unmarked for deletion.');
                                } else {
                                    await apiService.markUserForDeletion();
                                    if (refreshUser) {
                                        await refreshUser();
                                    }
                                    toast.warning(t('accountMarkedForDeletion') || 'Your account has been marked for deletion. An administrator will review your request.');
                                }
                                navigate('/profile');
                            } catch (err: any) {
                                setError(err.response?.data?.detail || (user?.marked_for_deletion ? 'Failed to unmark account for deletion' : 'Failed to mark account for deletion'));
                                toast.error(t('errorMarkingForDeletion') || 'Failed to update deletion status');
                            }
                        }
                    }}
                    style={{
                        backgroundColor: user?.marked_for_deletion ? '#28a745' : '#ff4444',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {user?.marked_for_deletion
                        ? (t('unmarkForDeletion') || 'Unmark for Deletion')
                        : (t('markForDeletion') || 'Mark for Deletion')
                    }
                </button>
            </div>
        </div>
    );
};

export default ProfileEditPage; 