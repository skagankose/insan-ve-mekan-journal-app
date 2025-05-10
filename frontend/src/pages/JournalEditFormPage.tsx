import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/apiService';

interface JournalFormData {
    title: string;
    issue: string;
    is_published: boolean;
    publication_date: string | null;
}

const JournalEditFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const journalId = Number(id);
    
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
        is_published: false,
        publication_date: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();

    // Fetch journal data
    useEffect(() => {
        if (!isAuthenticated || !id || isNaN(journalId)) {
            setError("Invalid journal ID or not authenticated.");
            setIsLoading(false);
            return;
        }

        const fetchJournal = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Need to implement this function in apiService
                const journals = await apiService.getJournals();
                const journal = journals.find(j => j.id === journalId);
                
                if (!journal) {
                    setError("Journal not found.");
                    return;
                }
                
                setFormData({
                    title: journal.title,
                    issue: journal.issue,
                    is_published: journal.is_published,
                    publication_date: journal.publication_date
                });
            } catch (err: any) {
                console.error("Failed to fetch journal:", err);
                setError(err.response?.data?.detail || "Failed to load journal data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournal();
    }, [id, journalId, isAuthenticated]);

    // Redirect if not admin
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
            setSubmitError("You must be an admin to update a journal.");
            return;
        }
        
        if (isNaN(journalId)) {
            setSubmitError("Invalid journal ID.");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
            // Need to implement this function in apiService
            await apiService.updateJournal(journalId, formData);
            navigate('/journals'); // Navigate back to journals list after update
        } catch (err: any) {
            console.error("Failed to update journal:", err);
            setSubmitError(err.response?.data?.detail || "Failed to update journal.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, isAuthenticated, user, journalId, navigate]);

    if (isLoading) {
        return <div className="loading">{t('loading')}</div>;
    }
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('editJournal') || 'Edit Journal'}</h1>
            </div>
            
            {isAuthenticated && user && user.role !== 'admin' && (
                <div className="error-message">
                    {t('accessDeniedAdminOnly') || 'Access Denied: Only administrators can edit journals.'}
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
                        {isSubmitting ? t('saving') || 'Saving...' : t('updateJournal') || 'Update Journal'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JournalEditFormPage; 