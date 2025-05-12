import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
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
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
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
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h2>{t('contactInformation') || 'Contact Information'}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="telephone">{t('telephone') || 'Telephone'}</label>
                        <input
                            type="tel"
                            id="telephone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">{t('location') || 'Location'}</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="form-control"
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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="yoksis_id">{t('yoksisId') || 'YÖKSİS ID'}</label>
                        <input
                            type="text"
                            id="yoksis_id"
                            name="yoksis_id"
                            value={formData.yoksis_id}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="orcid_id">{t('orcidId') || 'ORCID ID'}</label>
                        <input
                            type="text"
                            id="orcid_id"
                            name="orcid_id"
                            value={formData.orcid_id}
                            onChange={handleInputChange}
                            className="form-control"
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
        </div>
    );
};

export default ProfileEditPage; 