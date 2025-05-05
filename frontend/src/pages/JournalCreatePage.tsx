import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import JournalForm from '../components/JournalForm';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';

interface JournalFormData {
    title: string;
    content: string;
    abstract: string;
    journal_id?: number;
}

const JournalCreatePage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth(); // Ensure user is authenticated
    const { t } = useLanguage();
    const { activeJournal } = useActiveJournal();

    const handleCreateSubmit = useCallback(async (formData: JournalFormData) => {
        if (!isAuthenticated) {
            setSubmitError("You must be logged in to create an entry.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            // Add the journal_id if there's an active journal
            if (activeJournal) {
                formData.journal_id = activeJournal.id;
            }
            
            console.log("Creating entry:", formData);
            await apiService.createEntry(formData);
            navigate('/'); // Navigate to Journals page after successful creation
        } catch (err: any) {
            console.error("Failed to create entry:", err);
            setSubmitError(err.response?.data?.detail || "Failed to create entry.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isAuthenticated, navigate, activeJournal]);

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('createNewEntry')}</h1>
            </div>
            
            {activeJournal ? (
                <div className="active-journal-badge">
                    <span>{t('submittingTo') || 'Submitting to journal'}:</span> 
                    <strong>{activeJournal.title}</strong> 
                    <span>({t('issue') || 'Issue'}: {activeJournal.issue})</span>
                </div>
            ) : (
                <div className="warning-message" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <p>
                        {t('noActiveJournal') || 'No active journal selected. '} 
                        <Link to="/journals">{t('selectJournal') || 'Select a journal'}</Link> 
                        {t('toAssociateEntry') || ' to associate with this entry.'}
                    </p>
                </div>
            )}
            
            <JournalForm
                onSubmit={handleCreateSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitButtonText={t('createEntry')}
            />
            
            <div className="text-secondary text-center" style={{ marginTop: 'var(--spacing-4)' }}>
                <p>{t('entrySavedSecurely')}</p>
            </div>
        </div>
    );
};

export default JournalCreatePage; 