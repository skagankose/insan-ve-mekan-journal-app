import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './EditUserPage.css';
import ConfirmationModal from '../components/ConfirmationModal';
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
    const [deleting, setDeleting] = useState<boolean>(false);
    const [isLoginSectionExpanded, setIsLoginSectionExpanded] = useState<boolean>(false);
    const [isDeletionSectionExpanded, setIsDeletionSectionExpanded] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    
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
                        )}
                    </div>
                    
                    {/* Edit User Form */}
                    <div className="register-form-container" style={{ marginBottom: '24px' }}>
                        <form onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">{t('email')}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="name" className="form-label">{t('name')}</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="title" className="form-label">{t('title')}</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    maxLength={200}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="bio" className="form-label">{t('bio')}</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={3}
                                    maxLength={400}
                                    className="form-textarea"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="telephone" className="form-label">{t('telephone')}</label>
                                <input
                                    type="text"
                                    id="telephone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="science_branch" className="form-label">{t('scienceBranch')}</label>
                                <input
                                    type="text"
                                    id="science_branch"
                                    name="science_branch"
                                    value={formData.science_branch}
                                    onChange={handleInputChange}
                                    maxLength={300}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="location" className="form-label">{t('location')}</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="yoksis_id" className="form-label">{t('yoksisId')}</label>
                                <input
                                    type="text"
                                    id="yoksis_id"
                                    name="yoksis_id"
                                    value={formData.yoksis_id}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="orcid_id" className="form-label">{t('orcidId')}</label>
                                <input
                                    type="text"
                                    id="orcid_id"
                                    name="orcid_id"
                                    value={formData.orcid_id}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="role" className="form-label">{t('role')}</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
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
                            
                            <div style={{ 
                                display: 'flex',
                                gap: 'var(--spacing-3)',
                                marginTop: 'var(--spacing-6)'
                            }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    onClick={() => navigate('/admin')}
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

                    {/* Delete User Section */}
                    <div className="register-form-container" style={{ 
                        border: '2px solid #FEE2E2', 
                        backgroundColor: 'rgba(254, 226, 226, 0.3)',
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
                                {t('deleteUser') || 'Delete User'}
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
                                    {t('deleteUserWarning') || 'Warning: This action will permanently delete the user and transfer all related objects to your account. This cannot be undone.'}
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
                                        {(loading || deleting) ? (t('deleting') || 'Deleting...') : (t('deleteUser') || 'Delete User')}
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
                title={t('deleteUser') || 'Delete User'}
                message={t('deleteUserConfirm') || 'Are you sure you want to delete this user? All related data will be transferred to your account. This action cannot be undone.'}
                confirmText={t('confirmDelete') || 'Confirm Delete'}
                cancelText={t('cancel') || 'Cancel'}
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