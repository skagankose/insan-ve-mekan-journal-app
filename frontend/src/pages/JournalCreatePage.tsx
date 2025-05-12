import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import JournalForm, { JournalFormData } from '../components/JournalForm';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';

const JournalCreatePage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth(); // Ensure user is authenticated
    const { t } = useLanguage();
    const { activeJournal } = useActiveJournal();

    // Memoize the initialData to prevent unnecessary re-renders of JournalForm
    const initialFormData = useMemo(() => ({
        title: '', 
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        page_number: '',
        article_type: '',
        language: '',
        doi: '',
        file_path: '',
        status: '',
        date: new Date().toISOString().split('T')[0],
        authors_ids: [], // Initialize as empty array
        referees_ids: []  // Initialize as empty array
    }), []);

    const handleCreateSubmit = useCallback(async (formData: JournalFormData) => {
        if (!isAuthenticated) {
            setSubmitError("You must be logged in to create an entry.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            // Create a new object to avoid modifying the original formData
            const submitData: apiService.JournalEntryCreate = {
                title: formData.title,
                abstract_tr: formData.abstract_tr,
                abstract_en: formData.abstract_en,
                keywords: formData.keywords,
                page_number: formData.page_number,
                article_type: formData.article_type,
                language: formData.language,
                doi: formData.doi,
                file_path: formData.file_path,
                status: formData.status,
                authors_ids: formData.authors_ids || [],
                referees_ids: formData.referees_ids || []
            };
            
            // Add the journal_id if there's an active journal
            if (activeJournal) {
                submitData.journal_id = activeJournal.id;
            }
            
            // Add current user as author if not already in authors_ids
            if (user && (!submitData.authors_ids || !submitData.authors_ids.includes(user.id))) {
                submitData.authors_ids = [...(submitData.authors_ids || []), user.id];
            }
            
            // Format date if provided
            if (formData.date) {
                submitData.date = new Date(formData.date).toISOString();
            }
            
            // Make sure we never send an ID for a new entry
            if ('id' in submitData) {
                delete (submitData as any).id;
            }
            
            // console.log("Creating entry:", submitData);
            await apiService.createEntry(submitData);
            navigate('/'); // Navigate to Journals page after successful creation
        } catch (err: any) {
            console.error("Failed to create entry:", err);
            setSubmitError(err.response?.data?.detail || "Failed to create entry.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isAuthenticated, navigate, activeJournal, user]);

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
                initialData={initialFormData}
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