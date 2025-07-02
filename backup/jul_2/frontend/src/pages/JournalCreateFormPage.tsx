import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface JournalFormData {
    title: string;
    issue: string;
}

const JournalCreateFormPage: React.FC = () => {
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: ''
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
            // Create the journal (with is_published set to false by default)
            const journalData = {
                ...formData,
                is_published: false
            };
            const newJournal = await apiService.createJournal(journalData);
            // Navigate to journal details page with success parameter
            navigate(`/journals/${newJournal.id}?created=true`);
        } catch (err: any) {
            console.error('Error creating journal:', err);
            setSubmitError(err.message || 'Failed to create journal');
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
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{t('createNewJournal') || 'Create New Journal'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="register-form-container">
                    <form onSubmit={handleSubmit} className="register-form">
                        {submitError && <div className="error-message">{submitError}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">{t('journalTitle') || 'Journal Title'}</label>
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
                                title={`${t('maxCharacters')}: 300`}
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
                                title={`${t('maxCharacters')}: 200`}
                            />
                        </div>
                        

                        
                        <div style={{ 
                            display: 'flex',
                            gap: 'var(--spacing-3)',
                            marginTop: 'var(--spacing-6)'
                        }}>
                            <button 
                                type="submit" 
                                className="register-submit-button"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%'
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