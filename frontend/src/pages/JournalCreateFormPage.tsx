import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/apiService';

interface JournalFormData {
    title: string;
    issue: string;
    is_published: boolean;
    publication_date: string | null;
}

const JournalCreateFormPage: React.FC = () => {
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
        is_published: false,
        publication_date: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (isAuthenticated && user && user.role !== 'admin') {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = event.target;
        
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!isAuthenticated || (user && user.role !== 'admin')) {
            setSubmitError("You must be an admin to create a journal.");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
            console.log("Creating journal:", formData);
            // We need to add this function to apiService
            await apiService.createJournal(formData);
            navigate('/journals'); // Navigate back to journals list after creation
        } catch (err: any) {
            console.error("Failed to create journal:", err);
            setSubmitError(err.response?.data?.detail || "Failed to create journal.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, isAuthenticated, user, navigate]);

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('createNewJournal') || 'Create New Journal'}</h1>
            </div>
            
            {isAuthenticated && user && user.role !== 'admin' && (
                <div className="error-message">
                    {t('accessDeniedAdminOnly') || 'Access Denied: Only administrators can create new journals.'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
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
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
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
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="publication_date" className="form-label">{t('publicationDate') || 'Publication Date'}</label>
                    <input
                        type="datetime-local"
                        id="publication_date"
                        name="publication_date"
                        className="form-input"
                        value={formData.publication_date || ''}
                        onChange={handleChange}
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label checkbox-label">
                        <input
                            type="checkbox"
                            id="is_published"
                            name="is_published"
                            checked={formData.is_published}
                            onChange={handleChange}
                            disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                        />
                        <span>{t('isPublished') || 'Publish Journal'}</span>
                    </label>
                </div>
                
                <div className="form-group" style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    >
                        {isSubmitting ? t('saving') || 'Saving...' : t('createJournal') || 'Create Journal'}
                    </button>
                </div>
            </form>
            
            <div className="text-secondary text-center" style={{ marginTop: 'var(--spacing-4)' }}>
                <p>{t('journalCreationInfo') || 'Creating a new journal will allow users to submit entries to it.'}</p>
            </div>
        </div>
    );
};

export default JournalCreateFormPage; 