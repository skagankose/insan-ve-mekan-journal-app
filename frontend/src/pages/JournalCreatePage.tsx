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
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();
    const { activeJournal } = useActiveJournal();

    const initialFormData = useMemo(() => ({
        title: '', 
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        article_type: '',
        language: '',
        authors_ids: [],
        referees_ids: []
    }), []);

    const handleCreateSubmit = useCallback(async (formData: JournalFormData) => {
        if (!isAuthenticated) {
            setSubmitError("You must be logged in to create an entry.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const submitData: apiService.JournalEntryCreate = {
                title: formData.title,
                abstract_tr: formData.abstract_tr,
                abstract_en: formData.abstract_en,
                keywords: formData.keywords,
                article_type: formData.article_type,
                language: formData.language,
                authors_ids: formData.authors_ids || [],
                referees_ids: formData.referees_ids || []
            };
            
            if (activeJournal) {
                submitData.journal_id = activeJournal.id;
            }
            
            if (user && (!submitData.authors_ids || !submitData.authors_ids.includes(user.id))) {
                submitData.authors_ids = [...(submitData.authors_ids || []), user.id];
            }
            
            await apiService.createEntry(submitData);
            navigate('/');
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
                <h1 className="page-title">{t('createNewEntry') || 'Create New Journal Entry'}</h1>
            </div>
            
            {!activeJournal && (
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