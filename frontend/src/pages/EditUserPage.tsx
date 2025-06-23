import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './EditUserPage.css';
import type { UserUpdate } from '../services/apiService';

interface UserForm {
    email: string;
    name: string;
    title: string;
    bio: string;
    telephone: string;
    science_branch: string;
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
    const { t } = useLanguage();
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loginLinkGenerated, setLoginLinkGenerated] = useState<boolean>(false);
    const [loginLink, setLoginLink] = useState<string>('');
    const [emailSent, setEmailSent] = useState<boolean>(false);
    const [sendingEmail, setSendingEmail] = useState<boolean>(false);
    const [customEmailAddress, setCustomEmailAddress] = useState<string>('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    
    const [formData, setFormData] = useState<UserForm>({
        email: '',
        name: '',
        title: '',
        bio: '',
        telephone: '',
        science_branch: '',
        location: '',
        yoksis_id: '',
        orcid_id: '',
        role: 'user',
        is_auth: true
    });

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
                
                setFormData({
                    email: userData.email || '',
                    name: userData.name || '',
                    title: userData.title || '',
                    bio: userData.bio || '',
                    telephone: userData.telephone || '',
                    science_branch: userData.science_branch || '',
                    location: userData.location || '',
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
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            
            const updateData: UserUpdate = {
                email: formData.email,
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                telephone: formData.telephone,
                science_branch: formData.science_branch,
                location: formData.location,
                yoksis_id: formData.yoksis_id,
                orcid_id: formData.orcid_id,
                role: formData.role,
                is_auth: formData.is_auth
            };
            
            // Call the updateUser function with the user ID and update data
            await apiService.updateUser(Number(id), updateData);
            
            setSuccess(true);
            navigate('/admin');
            
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
                // Show temporary success message
                const linkCopiedMsg = document.getElementById('link-copied-message');
                if (linkCopiedMsg) {
                    linkCopiedMsg.style.opacity = '1';
                }
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                setError('Failed to copy login link');
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
        setShowDeleteConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleDeleteUser = async () => {
        if (!currentUser?.id) {
            setError('Current admin user ID not available');
            return;
        }

        try {
            setDeleting(true);
            setError(null);
            
            // Call API to delete user and transfer data to current admin
            await apiService.deleteUser(Number(id), currentUser.id);
            
            setSuccess(true);
            setShowDeleteConfirm(false);
            
            // Navigate back to admin page after short delay
            navigate('/admin?deleted=true');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete user');
            setDeleting(false);
        }
    };

    if (loading && !formData.email) {
        return (
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
        );
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section">
                <h1>{t('editUser')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="edit-user-content">
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{t('userUpdatedSuccessfully')}</div>}
                    
                    {/* Login Link Section */}
                    <div className="login-link-section">
                        <h2>{t('directLogin')}</h2>
                        <p>{t('directLoginDescription')}</p>
                        
                        {loginLinkGenerated ? (
                            <div className="login-link-container">
                                <div className="login-link">{loginLink}</div>
                                <div className="link-actions">
                                    <button 
                                        type="button" 
                                        className="copy-button" 
                                        onClick={handleCopyLoginLink}
                                        disabled={loading}
                                    >
                                        {t('copyLink')}
                                    </button>
                                    <div className="email-actions">
                                        <input
                                            type="email"
                                            placeholder={t('customEmailAddress') || "Custom email address"}
                                            value={customEmailAddress}
                                            onChange={(e) => setCustomEmailAddress(e.target.value)}
                                            className="custom-email-input"
                                        />
                                        <button 
                                            type="button" 
                                            className="email-button" 
                                            onClick={handleSendLoginLinkEmail}
                                            disabled={loading || sendingEmail}
                                        >
                                            {sendingEmail ? t('sending') : t('sendLinkViaEmail')}
                                        </button>
                                    </div>
                                </div>
                                <span id="link-copied-message" className="link-copied-message">
                                    {t('linkCopied')}
                                </span>
                                {emailSent && (
                                    <span className="email-sent-message">
                                        {t('linkEmailSent')}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <button 
                                type="button" 
                                className="generate-link-button" 
                                onClick={handleGenerateLoginLink}
                                disabled={loading}
                            >
                                {loading ? t('generating') : t('generateLoginLink')}
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="edit-user-form">
                        <div className="form-group">
                            <label htmlFor="email">{t('email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                maxLength={200}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="name">{t('name')}</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                maxLength={200}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="title">{t('title')}</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                maxLength={200}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="bio">{t('bio')}</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows={3}
                                maxLength={400}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="telephone">{t('telephone')}</label>
                            <input
                                type="text"
                                id="telephone"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleInputChange}
                                maxLength={100}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="science_branch">{t('scienceBranch')}</label>
                            <input
                                type="text"
                                id="science_branch"
                                name="science_branch"
                                value={formData.science_branch}
                                onChange={handleInputChange}
                                maxLength={300}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="location">{t('location')}</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                maxLength={100}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="yoksis_id">{t('yoksisId')}</label>
                            <input
                                type="text"
                                id="yoksis_id"
                                name="yoksis_id"
                                value={formData.yoksis_id}
                                onChange={handleInputChange}
                                maxLength={100}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="orcid_id">{t('orcidId')}</label>
                            <input
                                type="text"
                                id="orcid_id"
                                name="orcid_id"
                                value={formData.orcid_id}
                                onChange={handleInputChange}
                                maxLength={100}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="role">{t('role')}</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                                <option value="editor">Editor</option>
                                <option value="referee">Referee</option>
                                <option value="author">Author</option>
                            </select>
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <label htmlFor="is_auth">
                                <input
                                    type="checkbox"
                                    id="is_auth"
                                    name="is_auth"
                                    checked={formData.is_auth}
                                    onChange={handleInputChange}
                                />
                                {t('isAuth')}
                            </label>
                        </div>
                        
                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={() => navigate('/admin')}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="save-button" disabled={loading}>
                                {loading ? t('saving') : t('saveChanges')}
                            </button>
                        </div>
                    </form>

                    {/* Delete User Section */}
                    <div className="delete-user-section">
                        <h2>{t('deleteUser') || 'Delete User'}</h2>
                        <p>{t('deleteUserWarning') || 'Warning: This action will permanently delete the user and transfer all related objects to your account. This cannot be undone.'}</p>
                        
                        {showDeleteConfirm ? (
                            <div className="delete-confirmation">
                                <p>{t('deleteUserConfirm') || 'Are you sure you want to delete this user? All related data will be transferred to your account.'}</p>
                                <div className="confirmation-actions">
                                    <button 
                                        type="button" 
                                        className="cancel-delete-button" 
                                        onClick={handleCancelDelete}
                                        disabled={deleting}
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="confirm-delete-button" 
                                        onClick={handleDeleteUser}
                                        disabled={deleting}
                                    >
                                        {deleting ? (t('deleting') || 'Deleting...') : (t('confirmDelete') || 'Confirm Delete')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                type="button" 
                                className="delete-user-button" 
                                onClick={handleDeleteConfirm}
                                disabled={loading}
                            >
                                {t('deleteUser') || 'Delete User'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

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