import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface JournalFormData {
    title: string;
    issue: string;
    is_published: boolean;
}

const JournalCreateFormPage: React.FC = () => {
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
        is_published: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();

    const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

    useEffect(() => {
        if (isAuthenticated && user && !isAdminOrOwner) {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate, isAdminOrOwner]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = event.target;
        
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Create the journal
            const newJournal = await apiService.createJournal(formData);
            toast.success(t('journalCreatedSuccessfully') || 'Journal created successfully');
            navigate(`/journals/${newJournal.id}`);
        } catch (err: any) {
            console.error('Error creating journal:', err);
            setSubmitError(err.message || 'Failed to create journal');
            toast.error(err.message || t('errorCreatingJournal') || 'Error creating journal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated || !isAdminOrOwner) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{t('createNewJournal') || 'Create New Journal'}</h1>
                </div>
                <div className="page-content-section">
                    <div className="error-message">
                        {t('accessDenied') || 'Access denied. Admin privileges required.'}
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section">
                <h1 style={{textAlign: 'center'}}>{t('createNewJournal') || 'Create New Journal'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="register-form-container">
                    <form onSubmit={handleSubmit} className="register-form">
                        {submitError && <div className="error-message">{submitError}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">{t('title') || 'Title'}</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="form-input"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder={t('enterJournalTitle') || 'Enter journal title'}
                                required
                                disabled={isSubmitting}
                                maxLength={300}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="issue" className="form-label">{t('issue') || 'Issue'}</label>
                            <input
                                type="text"
                                id="issue"
                                name="issue"
                                className="form-input"
                                value={formData.issue}
                                onChange={handleChange}
                                placeholder={t('enterIssueNumber') || 'Enter issue number'}
                                required
                                disabled={isSubmitting}
                                maxLength={200}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label" style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    name="is_published"
                                    checked={formData.is_published}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span>{t('isPublished') || 'Is Published'}</span>
                            </label>
                        </div>
                        
                        <div style={{ 
                            display: 'flex',
                            gap: 'var(--spacing-3)',
                            marginTop: 'var(--spacing-6)'
                        }}>
                            <button 
                                type="button" 
                                onClick={() => navigate('/')} 
                                className="btn btn-outline"
                                disabled={isSubmitting}
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
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                className="register-submit-button"
                                disabled={isSubmitting}
                                style={{
                                    flex: '2'
                                }}
                            >
                                {isSubmitting ? (t('saving') || 'Saving...') : (t('createJournal') || 'Create Journal')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default JournalCreateFormPage; 