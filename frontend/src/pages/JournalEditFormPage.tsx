import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface JournalFormData {
    title: string;
    issue: string;
    is_published: boolean;
    created_date: string | undefined;
    publication_date: string | undefined;
    publication_place: string | undefined;
    cover_photo: string | undefined;
    meta_files: string | undefined;
    editor_notes: string | undefined;
    full_pdf: string | undefined;
    index_section: string | undefined;
    file_path: string | undefined;
}

const JournalEditFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const journalId = Number(id);
    
    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        issue: '',
        is_published: false,
        created_date: undefined,
        publication_date: undefined,
        publication_place: undefined,
        cover_photo: undefined,
        meta_files: undefined,
        editor_notes: undefined,
        full_pdf: undefined,
        index_section: undefined,
        file_path: undefined
    });

    const [selectedFiles, setSelectedFiles] = useState<{
        cover_photo?: File;
        meta_files?: File;
        editor_notes?: File;
        full_pdf?: File;
        index_section?: File;
        file_path?: File;
    }>({});

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();

    const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

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
                    created_date: journal.created_date ? journal.created_date.slice(0, 16) : undefined,
                    publication_date: journal.publication_date || undefined,
                    publication_place: journal.publication_place || undefined,
                    cover_photo: journal.cover_photo || undefined,
                    meta_files: journal.meta_files || undefined,
                    editor_notes: journal.editor_notes || undefined,
                    full_pdf: journal.full_pdf || undefined,
                    index_section: journal.index_section || undefined,
                    file_path: journal.file_path || undefined
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

                if (selectedFiles.index_section) {
                    if (!validateFileType(selectedFiles.index_section, ['docx'])) {
                        throw new Error('Index section must be a DOCX file');
                    }
                    formData.append('index_section', selectedFiles.index_section);
                }

                if (selectedFiles.file_path) {
                    if (!validateFileType(selectedFiles.file_path, ['docx'])) {
                        throw new Error('File path must be a DOCX file');
                    }
                    formData.append('file_path', selectedFiles.file_path);
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

        if (journalId === 1) {
            toast.error(t('cannotDeleteDefaultJournal') || 'Cannot delete the default journal (ID: 1)');
            return;
        }

        const confirmDelete = window.confirm(
            t('confirmDeleteJournal') || 
            'Are you sure you want to delete this journal? All related entries will be reassigned to the default journal (ID: 1). This action cannot be undone.'
        );

        if (!confirmDelete) {
            return;
        }
        
        setIsDeleting(true);
        try {
            await apiService.deleteJournal(journalId);
            toast.success(t('journalDeleted') || 'Journal deleted successfully. All entries have been reassigned to the default journal.');
            navigate('/');
        } catch (err: any) {
            console.error("Failed to delete journal:", err);
            if (err.response?.data?.detail?.includes("Cannot delete journal with ID 1")) {
                toast.error(t('cannotDeleteDefaultJournal') || 'Cannot delete the default journal (ID: 1)');
            } else {
                toast.error(err.response?.data?.detail || t('errorDeletingJournal') || 'Failed to delete journal');
            }
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{t('editJournal') || 'Edit Journal'}</h1>
                </div>
                <div className="page-content-section">
                    <div className="loading">{t('loadingJournal') || 'Loading journal...'}</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{t('editJournal') || 'Edit Journal'}</h1>
                </div>
                <div className="page-content-section">
                    <div className="error-message">{error}</div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section">
                <h1 style={{textAlign: 'center'}}>{t('editJournal') || 'Edit Journal'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="register-form-container">
                    {isAdminOrOwner && (
                        <div className="form-header" style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            marginBottom: 'var(--spacing-4)',
                            paddingBottom: 'var(--spacing-3)',
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)'
                        }}>
                            <button 
                                onClick={handleDeleteJournal}
                                disabled={isDeleting}
                                className="btn btn-danger btn-sm"
                                style={{
                                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'white',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    opacity: isDeleting ? 0.6 : 1,
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                {isDeleting 
                                    ? (t('deletingJournal') || 'Deleting Journal...') 
                                    : (t('deleteJournal') || 'Delete Journal')}
                            </button>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="register-form">
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
                                required
                                disabled={isSubmitting}
                                maxLength={300}
                                placeholder={t('enterJournalTitle') || 'Enter journal title'}
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
                                maxLength={100}
                                placeholder={t('enterIssue') || 'Enter issue number'}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="created_date" className="form-label">{t('createdDate') || 'Created Date'}</label>
                            <input
                                type="datetime-local"
                                id="created_date"
                                name="created_date"
                                className="form-input"
                                value={formData.created_date || ''}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label" style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    name="is_published"
                                    checked={formData.is_published}
                                    onChange={handleChange}
                                    disabled={isSubmitting || !isAdminOrOwner}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: isAdminOrOwner ? 'pointer' : 'not-allowed'
                                    }}
                                />
                                <span>{t('isPublished') || 'Is Published'}</span>
                                {!isAdminOrOwner && (
                                    <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                        ({t('adminOnly') || 'Admin only'})
                                    </small>
                                )}
                            </label>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="publication_date" className="form-label">
                                {t('publicationDate') || 'Publication Date'}
                                {!isAdminOrOwner && (
                                    <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                        ({t('adminOnly') || 'Admin only'})
                                    </small>
                                )}
                            </label>
                            <input
                                type="datetime-local"
                                id="publication_date"
                                name="publication_date"
                                className="form-input"
                                value={formData.publication_date || ''}
                                onChange={handleChange}
                                disabled={isSubmitting || !isAdminOrOwner}
                                style={{
                                    opacity: !isAdminOrOwner ? 0.6 : 1,
                                    cursor: !isAdminOrOwner ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="publication_place" className="form-label">
                                {t('publicationPlace') || 'Publication Place'}
                                {!isAdminOrOwner && (
                                    <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                        ({t('adminOnly') || 'Admin only'})
                                    </small>
                                )}
                            </label>
                            <input
                                type="text"
                                id="publication_place"
                                name="publication_place"
                                className="form-input"
                                maxLength={100}
                                value={formData.publication_place || ''}
                                onChange={handleChange}
                                placeholder={t('enterPublicationPlace') || 'Enter publication place'}
                                disabled={isSubmitting || !isAdminOrOwner}
                                style={{
                                    opacity: !isAdminOrOwner ? 0.6 : 1,
                                    cursor: !isAdminOrOwner ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>

                        {/* File Upload Sections */}
                        {[
                            {
                                key: 'cover_photo',
                                label: t('coverPhoto') || 'Cover Photo',
                                accept: '.png,.jpg,.jpeg',
                                description: t('coverPhotoDescription') || 'Upload a PNG or JPEG image file',
                                icon: '🖼️',
                                color: '#8B5CF6'
                            },
                            {
                                key: 'meta_files',
                                label: t('metaFiles') || 'Meta Files',
                                accept: '.docx',
                                description: t('metaFilesDescription') || 'Upload a DOCX file',
                                icon: '📋',
                                color: '#06B6D4'
                            },
                            {
                                key: 'editor_notes',
                                label: t('editorNotes') || 'Editor Notes',
                                accept: '.docx',
                                description: t('editorNotesDescription') || 'Upload a DOCX file',
                                icon: '📝',
                                color: '#F59E0B'
                            },
                            {
                                key: 'full_pdf',
                                label: t('fullPdf') || 'Full PDF',
                                accept: '.pdf',
                                description: t('fullPdfDescription') || 'Upload a PDF file',
                                icon: '📄',
                                color: '#EF4444'
                            },
                            {
                                key: 'index_section',
                                label: t('indexSection') || 'Index Section',
                                accept: '.docx',
                                description: t('indexSectionDescription') || 'Upload a DOCX file',
                                icon: '📊',
                                color: '#10B981'
                            },
                            {
                                key: 'file_path',
                                label: t('filePath') || 'File Path',
                                accept: '.docx',
                                description: t('filePathDescription') || 'Upload a DOCX file',
                                icon: '📁',
                                color: '#6366F1'
                            }
                        ].map(({ key, label, accept, description, icon, color }) => (
                            <div className="form-group" key={key}>
                                <label htmlFor={key} className="form-label">
                                    {label}
                                    {!isAdminOrOwner && (
                                        <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                            ({t('adminOnly') || 'Admin only'})
                                        </small>
                                    )}
                                </label>
                                {(formData as any)[key] && (
                                    <div style={{ 
                                        marginBottom: 'var(--spacing-2)', 
                                        padding: 'var(--spacing-2)', 
                                        background: `${color}15`, 
                                        borderRadius: '8px',
                                        border: `1px solid ${color}30`
                                    }}>
                                        <a 
                                            href={`/api${(formData as any)[key]}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{
                                                color: color,
                                                textDecoration: 'none',
                                                fontWeight: '500',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-1)'
                                            }}
                                        >
                                            <span>{icon}</span>
                                            {t(`current${key.charAt(0).toUpperCase() + key.slice(1).replace('_', '')}`) || `Current ${label}`}
                                        </a>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id={key}
                                    name={key}
                                    className="form-input"
                                    onChange={handleFileChange}
                                    accept={accept}
                                    disabled={isSubmitting || !isAdminOrOwner}
                                    style={{
                                        padding: '12px 16px',
                                        border: '2px dashed #E2E8F0',
                                        borderRadius: '12px',
                                        background: 'rgba(249, 250, 251, 0.8)',
                                        cursor: isAdminOrOwner ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s ease',
                                        opacity: !isAdminOrOwner ? 0.6 : 1
                                    }}
                                />
                                <small style={{ 
                                    color: 'var(--color-text-tertiary)', 
                                    fontSize: '0.8rem',
                                    fontStyle: 'italic',
                                    marginTop: 'var(--spacing-1)',
                                    display: 'block'
                                }}>
                                    {description}
                                </small>
                            </div>
                        ))}
                        
                        <div style={{ 
                            display: 'flex',
                            gap: 'var(--spacing-3)',
                            marginTop: 'var(--spacing-6)'
                        }}>
                            <button 
                                type="button" 
                                onClick={() => navigate('/')} 
                                className="btn btn-outline"
                                disabled={isSubmitting}
                                style={{
                                    flex: '1',
                                    padding: '12px 20px',
                                    border: '2px solid #E2E8F0',
                                    borderRadius: '12px',
                                    background: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                className="register-submit-button"
                                disabled={isSubmitting || !isAdminOrOwner}
                                style={{
                                    flex: '2',
                                    opacity: !isAdminOrOwner ? 0.6 : 1,
                                    cursor: !isAdminOrOwner ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting 
                                    ? (t('saving') || 'Saving...') 
                                    : (t('saveChanges') || 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default JournalEditFormPage; 