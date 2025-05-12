import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JournalForm, { JournalFormData } from '../components/JournalForm';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const JournalEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [initialData, setInitialData] = useState<JournalFormData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const entryId = Number(id);

    useEffect(() => {
        if (!id || isNaN(entryId)) {
            setError("Invalid entry ID.");
            setIsLoading(false);
            return;
        }

        const fetchEntry = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const entry = await apiService.getEntryById(entryId);
                setInitialData({ 
                    title: entry.title,
                    abstract_tr: entry.abstract_tr,
                    abstract_en: entry.abstract_en,
                    keywords: entry.keywords,
                    page_number: entry.page_number,
                    article_type: entry.article_type,
                    language: entry.language,
                    doi: entry.doi,
                    file_path: entry.file_path || '',
                    status: entry.status || '',
                    journal_id: entry.journal_id,
                    authors_ids: entry.authors?.map((author: apiService.UserRead) => author.id),
                    referees_ids: entry.referees?.map((referee: apiService.UserRead) => referee.id),
                    date: entry.date ? new Date(entry.date).toISOString().slice(0, 16) : ''
                });
            } catch (err: any) {
                console.error("Failed to fetch entry for editing:", err);
                setError(err.response?.data?.detail || "Failed to load entry data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntry();
    }, [id, entryId]);

    const handleUpdateSubmit = useCallback(async (formData: JournalFormData) => {
        if (isNaN(entryId)) {
            setSubmitError("Invalid entry ID for update.");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            // Create copy of formData to modify
            const updateData = {...formData};
            
            // Format date if provided
            if (updateData.date) {
                updateData.date = new Date(updateData.date).toISOString();
            }
            
            await apiService.updateEntry(entryId, updateData as any);
            navigate('/profile'); // Navigate to user profile page after successful update
        } catch (err: any) {
            console.error("Failed to update entry:", err);
            setSubmitError(err.response?.data?.detail || "Failed to update entry.");
        } finally {
            setIsSubmitting(false);
        }
    }, [entryId, navigate]);

    if (isLoading) {
        return <div className="loading">{t('loadingEntries') || 'Loading entry...'}</div>;
    }
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }
    
    if (!initialData) {
        return <div className="error-message">Entry data not found.</div>;
    }

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('editEntry') || 'Edit Entry'}</h1>
            </div>
            
            <JournalForm
                initialData={initialData}
                onSubmit={handleUpdateSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitButtonText={t('updateEntry') || 'Update Entry'}
            />
        </div>
    );
};

export default JournalEditPage; 