import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './JournalFormPage.css';

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

    useEffect(() => {
        if (isAuthenticated && user && user.role !== 'admin' && user.role !== 'owner') {
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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Create the journal
            await apiService.createJournal(formData);
            navigate('/journals');
        } catch (err: any) {
            console.error('Error creating journal:', err);
            setSubmitError(err.message || 'Failed to create journal');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'owner')) {
        return null;
    }

    return (
        <div className="form-page">
            <div className="form-container">
                <h1>{t('createNewJournal') || 'Create New Journal'}</h1>
            
                {submitError && (
                    <div className="error-message">
                        {submitError}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title" className="form-label">{t('title') || 'Title'}</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-input"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder={t('enterTitle') || 'Enter title'}
                            required
                            disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
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
                            disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                            maxLength={200}
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                        >
                            {isSubmitting ? t('saving') || 'Saving...' : t('createJournal') || 'Create Journal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JournalCreateFormPage; 