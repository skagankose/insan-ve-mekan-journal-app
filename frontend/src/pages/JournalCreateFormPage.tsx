import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface JournalFormData {
    title: string;
    issue: string;
    is_published: boolean;
    date: string | undefined;
    publication_date: string | undefined;
    publication_place: string | undefined;
    cover_photo: string | undefined;
    meta_files: string | undefined;
    editor_notes: string | undefined;
    full_pdf: string | undefined;
}

const JournalCreateFormPage: React.FC = () => {
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
        is_published: false,
        date: new Date().toISOString().slice(0, 16), // Include time component but truncate seconds
        publication_date: undefined,
        publication_place: undefined,
        cover_photo: undefined,
        meta_files: undefined,
        editor_notes: undefined,
        full_pdf: undefined
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
            // Create a copy of formData with properly formatted date
            const submitData = { ...formData };
            
            // Convert date string to full ISO string if it exists
            if (submitData.date) {
                // Add time portion to make it a complete ISO string
                submitData.date = new Date(submitData.date).toISOString();
            }
            
            // console.log("Creating journal:", submitData);
            // We need to add this function to apiService
            await apiService.createJournal(submitData);
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
                    <label htmlFor="date" className="form-label">{t('date') || 'Date and Time'}</label>
                    <input
                        type="datetime-local"
                        id="date"
                        name="date"
                        className="form-input"
                        value={formData.date || ''}
                        onChange={handleChange}
                        placeholder={t('enterDate') || 'Enter date and time'}
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
                    <label htmlFor="publication_place" className="form-label">{t('publicationPlace') || 'Publication Place'}</label>
                    <input
                        type="text"
                        id="publication_place"
                        name="publication_place"
                        className="form-input"
                        value={formData.publication_place || ''}
                        onChange={handleChange}
                        placeholder={t('enterPublicationPlace') || 'Enter publication place'}
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="cover_photo" className="form-label">{t('coverPhoto') || 'Cover Photo Path'}</label>
                    <input
                        type="text"
                        id="cover_photo"
                        name="cover_photo"
                        className="form-input"
                        value={formData.cover_photo || ''}
                        onChange={handleChange}
                        placeholder={t('enterCoverPhotoPath') || 'Enter cover photo path'}
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="meta_files" className="form-label">{t('metaFiles') || 'Meta Files Path'}</label>
                    <input
                        type="text"
                        id="meta_files"
                        name="meta_files"
                        className="form-input"
                        value={formData.meta_files || ''}
                        onChange={handleChange}
                        placeholder={t('enterMetaFilesPath') || 'Enter meta files path'}
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="editor_notes" className="form-label">{t('editorNotes') || 'Editor Notes Path'}</label>
                    <input
                        type="text"
                        id="editor_notes"
                        name="editor_notes"
                        className="form-input"
                        value={formData.editor_notes || ''}
                        onChange={handleChange}
                        placeholder={t('enterEditorNotesPath') || 'Enter editor notes path'}
                        disabled={isSubmitting || (user ? user.role !== 'admin' : true)}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="full_pdf" className="form-label">{t('fullPdf') || 'Full PDF Path'}</label>
                    <input
                        type="text"
                        id="full_pdf"
                        name="full_pdf"
                        className="form-input"
                        value={formData.full_pdf || ''}
                        onChange={handleChange}
                        placeholder={t('enterFullPdfPath') || 'Enter full PDF path'}
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