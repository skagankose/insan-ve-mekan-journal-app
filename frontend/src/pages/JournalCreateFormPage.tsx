import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/apiService';

interface JournalFormData {
    title: string;
    issue: string;
}

const JournalCreateFormPage: React.FC = () => {
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!isAuthenticated) {
            setSubmitError("You must be logged in to create a journal.");
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
    }, [formData, isAuthenticated, navigate]);

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('createNewJournal') || 'Create New Journal'}</h1>
            </div>
            
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
                        disabled={isSubmitting}
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
                    />
                </div>
                
                <div className="form-group" style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmitting}
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