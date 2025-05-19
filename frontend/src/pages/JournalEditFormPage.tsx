import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import './JournalFormPage.css';

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

const JournalEditFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const journalId = Number(id);
    
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
        is_published: false,
        date: undefined,
        publication_date: undefined,
        publication_place: undefined,
        cover_photo: undefined,
        meta_files: undefined,
        editor_notes: undefined,
        full_pdf: undefined
    });

    const [selectedFiles, setSelectedFiles] = useState<{
        cover_photo?: File;
        meta_files?: File;
        editor_notes?: File;
        full_pdf?: File;
    }>({});

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();

    // Fetch journal data
    useEffect(() => {
        const fetchJournal = async () => {
            if (!id || isNaN(journalId)) {
                setError("Invalid journal ID.");
                setIsLoading(false);
                return;
            }

            if (!isAuthenticated) {
                setError("You must be logged in to edit journals.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                // Get all journals and find the one with the matching ID
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
                    date: journal.date ? journal.date.slice(0, 16) : undefined,
                    publication_date: journal.publication_date || undefined,
                    publication_place: journal.publication_place || undefined,
                    cover_photo: journal.cover_photo || undefined,
                    meta_files: journal.meta_files || undefined,
                    editor_notes: journal.editor_notes || undefined,
                    full_pdf: journal.full_pdf || undefined
                });
            } catch (err: any) {
                console.error("Failed to fetch journal for editing:", err);
                setError(err.response?.data?.detail || "Failed to load journal data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournal();
    }, [id, journalId, isAuthenticated]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = event.target;
        
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
        }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = event.target;
        if (files && files.length > 0) {
            setSelectedFiles(prev => ({
                ...prev,
                [name]: files[0]
            }));
        }
    };

    const validateFileType = (file: File, allowedTypes: string[]): boolean => {
        const fileType = file.name.toLowerCase().split('.').pop();
        return allowedTypes.includes(fileType || '');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // First update the journal data
            await apiService.updateJournal(journalId, formData);

            // Then handle file uploads if any files were selected
            if (Object.keys(selectedFiles).length > 0) {
                const formData = new FormData();

                // Validate and append each file
                if (selectedFiles.cover_photo) {
                    if (!validateFileType(selectedFiles.cover_photo, ['png', 'jpg', 'jpeg'])) {
                        throw new Error('Cover photo must be a PNG or JPEG file');
                    }
                    formData.append('cover_photo', selectedFiles.cover_photo);
                }

                if (selectedFiles.meta_files) {
                    if (!validateFileType(selectedFiles.meta_files, ['docx'])) {
                        throw new Error('Meta files must be a DOCX file');
                    }
                    formData.append('meta_files', selectedFiles.meta_files);
                }

                if (selectedFiles.editor_notes) {
                    if (!validateFileType(selectedFiles.editor_notes, ['docx'])) {
                        throw new Error('Editor notes must be a DOCX file');
                    }
                    formData.append('editor_notes', selectedFiles.editor_notes);
                }

                if (selectedFiles.full_pdf) {
                    if (!validateFileType(selectedFiles.full_pdf, ['pdf'])) {
                        throw new Error('Full PDF must be a PDF file');
                    }
                    formData.append('full_pdf', selectedFiles.full_pdf);
                }

                // Upload the files
                await apiService.uploadJournalFiles(journalId, formData);
            }

            toast.success(t('journalUpdated') || 'Journal updated successfully');
            navigate(`/journals/${journalId}`);
        } catch (err: any) {
            console.error('Error updating journal:', err);
            setSubmitError(err.message || 'Failed to update journal');
            toast.error(err.message || t('errorUpdatingJournal') || 'Error updating journal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJournal = async () => {
        if (isNaN(journalId)) {
            setError("Invalid journal ID for deletion.");
            return;
        }

        const confirmDelete = window.confirm(
            t('confirmDeleteJournal') || 
            'Are you sure you want to delete this journal? This will also delete all related entries, updates, and files. This action cannot be undone.'
        );

        if (!confirmDelete) {
            return;
        }
        
        setIsDeleting(true);
        try {
            await apiService.deleteJournal(journalId);
            toast.success(t('journalDeleted') || 'Journal deleted successfully');
            navigate('/journals');
        } catch (err: any) {
            console.error("Failed to delete journal:", err);
            toast.error(err.response?.data?.detail || t('errorDeletingJournal') || 'Failed to delete journal');
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="form-container">
            <h1>{t('editJournal') || 'Edit Journal'}</h1>
            
            <form onSubmit={handleSubmit} className="journal-form">
                {submitError && <div className="error">{submitError}</div>}
                
                <div className="form-group">
                    <label htmlFor="title" className="form-label">{t('title') || 'Title'}</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-input"
                        value={formData.title}
                        onChange={handleChange}
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
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="date" className="form-label">{t('date') || 'Date'}</label>
                    <input
                        type="datetime-local"
                        id="date"
                        name="date"
                        className="form-input"
                        value={formData.date || ''}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">
                        <input
                            type="checkbox"
                            name="is_published"
                            checked={formData.is_published}
                            onChange={handleChange}
                            disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                        />
                        {' '}{t('isPublished') || 'Is Published'}
                    </label>
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
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
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
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="cover_photo" className="form-label">{t('coverPhoto') || 'Cover Photo'}</label>
                    {formData.cover_photo && (
                        <div className="current-file">
                            <a href={`/api${formData.cover_photo}`} target="_blank" rel="noopener noreferrer">
                                {t('currentCoverPhoto') || 'Current Cover Photo'}
                            </a>
                        </div>
                    )}
                    <input
                        type="file"
                        id="cover_photo"
                        name="cover_photo"
                        className="form-input"
                        onChange={handleFileChange}
                        accept=".png,.jpg,.jpeg"
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                    />
                    <small className="text-muted">
                        {t('coverPhotoDescription') || 'Upload a PNG or JPEG image file'}
                    </small>
                </div>
                
                <div className="form-group">
                    <label htmlFor="meta_files" className="form-label">{t('metaFiles') || 'Meta Files'}</label>
                    {formData.meta_files && (
                        <div className="current-file">
                            <a href={`/api${formData.meta_files}`} target="_blank" rel="noopener noreferrer">
                                {t('currentMetaFiles') || 'Current Meta Files'}
                            </a>
                        </div>
                    )}
                    <input
                        type="file"
                        id="meta_files"
                        name="meta_files"
                        className="form-input"
                        onChange={handleFileChange}
                        accept=".docx"
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                    />
                    <small className="text-muted">
                        {t('metaFilesDescription') || 'Upload a DOCX file'}
                    </small>
                </div>
                
                <div className="form-group">
                    <label htmlFor="editor_notes" className="form-label">{t('editorNotes') || 'Editor Notes'}</label>
                    {formData.editor_notes && (
                        <div className="current-file">
                            <a href={`/api${formData.editor_notes}`} target="_blank" rel="noopener noreferrer">
                                {t('currentEditorNotes') || 'Current Editor Notes'}
                            </a>
                        </div>
                    )}
                    <input
                        type="file"
                        id="editor_notes"
                        name="editor_notes"
                        className="form-input"
                        onChange={handleFileChange}
                        accept=".docx"
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                    />
                    <small className="text-muted">
                        {t('editorNotesDescription') || 'Upload a DOCX file'}
                    </small>
                </div>
                
                <div className="form-group">
                    <label htmlFor="full_pdf" className="form-label">{t('fullPdf') || 'Full PDF'}</label>
                    {formData.full_pdf && (
                        <div className="current-file">
                            <a href={`/api${formData.full_pdf}`} target="_blank" rel="noopener noreferrer">
                                {t('currentFullPdf') || 'Current Full PDF'}
                            </a>
                        </div>
                    )}
                    <input
                        type="file"
                        id="full_pdf"
                        name="full_pdf"
                        className="form-input"
                        onChange={handleFileChange}
                        accept=".pdf"
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                    />
                    <small className="text-muted">
                        {t('fullPdfDescription') || 'Upload a PDF file'}
                    </small>
                </div>
                
                <div className="form-buttons">
                    <button 
                        type="button" 
                        onClick={() => navigate('/journals')} 
                        className="cancel-button"
                        disabled={isSubmitting}
                    >
                        {t('cancel') || 'Cancel'}
                    </button>
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isSubmitting || (user ? (user.role !== 'admin' && user.role !== 'owner') : true)}
                    >
                        {isSubmitting 
                            ? (t('saving') || 'Saving...') 
                            : (t('saveChanges') || 'Save Changes')}
                    </button>
                </div>
            </form>

            {(user?.role === 'admin' || user?.role === 'owner') && (
                <div className="danger-zone">
                    <h2>{t('dangerZone') || 'Danger Zone'}</h2>
                    <div className="danger-zone-content">
                        <p>{t('deleteJournalWarning') || 'Once you delete a journal, there is no going back. This will delete all related entries, updates, and files.'}</p>
                        <button 
                            onClick={handleDeleteJournal}
                            disabled={isDeleting}
                            className="delete-button"
                        >
                            {isDeleting 
                                ? (t('deletingJournal') || 'Deleting Journal...') 
                                : (t('deleteJournal') || 'Delete Journal')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalEditFormPage; 