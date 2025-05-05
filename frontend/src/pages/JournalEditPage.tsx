import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JournalForm from '../components/JournalForm';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface JournalFormData {
    title: string;
    content: string;
    abstract: string;
}

const JournalEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
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
            if (!isAuthenticated) {
                setError("You must be logged in to edit entries.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const entry = await apiService.getEntryById(entryId);
                setInitialData({ 
                    title: entry.title, 
                    content: entry.content, 
                    abstract: entry.abstract
                });
            } catch (err: any) {
                console.error("Failed to fetch entry for editing:", err);
                setError(err.response?.data?.detail || "Failed to load entry data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntry();
    }, [id, entryId, isAuthenticated]);

    const handleUpdateSubmit = useCallback(async (formData: JournalFormData) => {
        if (!isAuthenticated) {
            setSubmitError("You must be logged in to update an entry.");
            return;
        }
        if (isNaN(entryId)) {
            setSubmitError("Invalid entry ID for update.");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await apiService.updateEntry(entryId, formData);
            navigate('/'); // Navigate to Journals page after successful update
        } catch (err: any) {
            console.error("Failed to update entry:", err);
            setSubmitError(err.response?.data?.detail || "Failed to update entry.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isAuthenticated, entryId, navigate]);

    if (isLoading) {
        return <div className="loading">{t('loadingEntries')}</div>;
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
                <h1 className="page-title">{t('editEntry')}</h1>
            </div>
            
            <JournalForm
                initialData={initialData}
                onSubmit={handleUpdateSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitButtonText={t('updateEntry')}
            />
        </div>
    );
};

export default JournalEditPage; 