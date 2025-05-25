import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './JournalEditPage.css';

interface JournalFormData {
    title: string;
    abstract_tr: string;
    abstract_en?: string;
    keywords?: string;
    page_number?: string;
    article_type?: string;
    language?: string;
    doi?: string;
    file_path?: string;
    full_pdf?: string;
    status?: string;
    publication_date?: string;
    authors_ids?: number[];
    referees_ids?: number[];
}

const JournalEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const isEditorOrAdmin = isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner');

    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        page_number: '',
        article_type: '',
        language: '',
        doi: '',
        file_path: '',
        full_pdf: '',
        status: 'waiting_for_payment',
        authors_ids: [],
        referees_ids: []
    });

    const [selectedFiles, setSelectedFiles] = useState<{
        file_path?: File;
        full_pdf?: File;
    }>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
                setFormData({ 
                    title: entry.title,
                    abstract_tr: entry.abstract_tr,
                    abstract_en: entry.abstract_en,
                    keywords: entry.keywords,
                    page_number: entry.page_number,
                    article_type: entry.article_type,
                    language: entry.language,
                    doi: entry.doi,
                    file_path: entry.file_path,
                    full_pdf: entry.full_pdf,
                    status: entry.status,
                    authors_ids: entry.authors?.map((author: apiService.UserRead) => author.id),
                    referees_ids: entry.referees?.map((referee: apiService.UserRead) => referee.id),
                    publication_date: entry.publication_date ? new Date(entry.publication_date).toISOString().slice(0, 16) : ''
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

    const validateFileType = (file: File, allowedTypes: string[]): boolean => {
        const fileType = file.name.split('.').pop()?.toLowerCase();
        return fileType ? allowedTypes.includes(fileType) : false;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            const file = files[0];
            if (!validateFileType(file, ['docx'])) {
                toast.error(t('onlyDocxAllowed') || 'Only DOCX files are allowed');
                e.target.value = '';
                return;
            }
            setSelectedFiles(prev => ({
                ...prev,
                [name]: file
            }));
        }
    };
        
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // First update the entry data
            await apiService.updateEntry(Number(id), formData);

            // Then handle file uploads if any files were selected
            if (Object.keys(selectedFiles).length > 0) {
                const uploadData = new FormData();
                
                if (selectedFiles.file_path) {
                    uploadData.append('file', selectedFiles.file_path);
                }
                
                if (selectedFiles.full_pdf) {
                    uploadData.append('full_pdf', selectedFiles.full_pdf);
                }
                
                await apiService.uploadEntryFile(Number(id), uploadData);
            }

            toast.success(t('entryUpdatedSuccessfully') || 'Entry updated successfully');
            navigate(`/entries/${id}`);
        } catch (error) {
            console.error('Error updating entry:', error);
            setSubmitError(t('errorUpdatingEntry') || 'Error updating entry');
            toast.error(t('errorUpdatingEntry') || 'Error updating entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEntry = async () => {
        if (isNaN(entryId)) {
            setError("Invalid entry ID for deletion.");
            return;
        }

        const confirmDelete = window.confirm(
            t('confirmDeleteEntry') || 
            'Are you sure you want to delete this entry? This action cannot be undone.'
        );

        if (!confirmDelete) {
            return;
        }
        
        setIsDeleting(true);
        try {
            await apiService.deleteEntry(entryId);
            navigate('/');
        } catch (err: any) {
            console.error("Failed to delete entry:", err);
            setError(err.response?.data?.detail || "Failed to delete entry.");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <div className="loading">{t('loadingEntry') || 'Loading entry...'}</div>;
    }
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('editEntry') || 'Edit Entry'}</h1>
                <button 
                    onClick={handleDeleteEntry}
                    disabled={isDeleting}
                    className="delete-entry-button"
                >
                    {isDeleting 
                        ? (t('deleting') || 'Deleting...') 
                        : (t('deleteEntry') || 'Delete Entry')}
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="card">
                {submitError && <div className="error-message">{submitError}</div>}
                
                <div className="form-group">
                    <label htmlFor="title" className="form-label">{t('title')}</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-input"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder={t('enterTitle')}
                        required
                        disabled={isSubmitting}
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
                        onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                        placeholder={t('enterPublicationDate') || 'Enter publication date'}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="abstract_tr" className="form-label">{t('abstractTurkish') || 'Abstract (Turkish)'}</label>
                    <textarea
                        id="abstract_tr"
                        name="abstract_tr"
                        className="form-textarea"
                        value={formData.abstract_tr}
                        onChange={(e) => setFormData({...formData, abstract_tr: e.target.value})}
                        placeholder={t('enterAbstractTr') || 'Enter a brief summary in Turkish...'}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="abstract_en" className="form-label">{t('abstractEnglish') || 'Abstract (English)'}</label>
                    <textarea
                        id="abstract_en"
                        name="abstract_en"
                        className="form-textarea"
                        value={formData.abstract_en || ''}
                        onChange={(e) => setFormData({...formData, abstract_en: e.target.value})}
                        placeholder={t('enterAbstractEn') || 'Enter a brief summary in English...'}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="keywords" className="form-label">{t('keywords') || 'Keywords'}</label>
                    <input
                        type="text"
                        id="keywords"
                        name="keywords"
                        className="form-input"
                        value={formData.keywords || ''}
                        onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                        placeholder={t('enterKeywords') || 'Enter keywords, separated by commas...'}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="page_number" className="form-label">{t('pageNumber') || 'Page Number'}</label>
                    <input
                        type="text"
                        id="page_number"
                        name="page_number"
                        className="form-input"
                        value={formData.page_number || ''}
                        onChange={(e) => setFormData({...formData, page_number: e.target.value})}
                        placeholder={t('enterPageNumber') || 'Enter page number'}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="article_type" className="form-label">{t('articleType') || 'Article Type'}</label>
                    <select
                        id="article_type"
                        name="article_type"
                        className="form-select"
                        value={formData.article_type || ''}
                        onChange={(e) => setFormData({...formData, article_type: e.target.value})}
                        disabled={isSubmitting}
                    >
                        <option value="">{t('selectArticleType') || 'Select article type'}</option>
                        <option value="research">{t('research') || 'Research'}</option>
                        <option value="review">{t('review') || 'Review'}</option>
                        <option value="case_study">{t('caseStudy') || 'Case Study'}</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="language" className="form-label">{t('language') || 'Language'}</label>
                    <select
                        id="language"
                        name="language"
                        className="form-select"
                        value={formData.language || ''}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        disabled={isSubmitting}
                    >
                        <option value="">{t('selectLanguage') || 'Select language'}</option>
                        <option value="turkish">{t('turkish') || 'Turkish'}</option>
                        <option value="english">{t('english') || 'English'}</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="doi" className="form-label">{t('doi') || 'DOI'}</label>
                    <input
                        type="text"
                        id="doi"
                        name="doi"
                        className="form-input"
                        value={formData.doi || ''}
                        onChange={(e) => setFormData({...formData, doi: e.target.value})}
                        placeholder={t('enterDoi') || 'Enter DOI'}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="file_path" className="form-label">{t('file') || 'File'}</label>
                    <input
                        type="file"
                        id="file_path"
                        name="file_path"
                        className="form-input"
                        onChange={handleFileChange}
                        accept=".docx"
                        disabled={isSubmitting}
                    />
                    {formData.file_path && (
                        <div className="current-file">
                            <a href={`/api${formData.file_path}`} target="_blank" rel="noopener noreferrer">
                                {t('currentFile') || 'Current File'}
                            </a>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="full_pdf" className="form-label">{t('fullPdf') || 'Full PDF'}</label>
                    <input
                        type="file"
                        id="full_pdf"
                        name="full_pdf"
                        className="form-input"
                        onChange={handleFileChange}
                        accept=".pdf"
                        disabled={isSubmitting}
                    />
                    {formData.full_pdf && (
                        <div className="current-file">
                            <a href={`/api${formData.full_pdf}`} target="_blank" rel="noopener noreferrer">
                                {t('currentFullPdf') || 'Current Full PDF'}
                            </a>
                        </div>
                    )}
                </div>
                
                {isEditorOrAdmin && (
                    <div className="form-group">
                        <label htmlFor="status" className="form-label">{t('status') || 'Status'}</label>
                        <select
                            id="status"
                            name="status"
                            className="form-select"
                            value={formData.status || ''}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            disabled={isSubmitting}
                        >
                            <option value="waiting_for_payment">{t('statusWaitingForPayment') || 'Waiting for Payment'}</option>
                            <option value="waiting_for_editors">{t('statusWaitingForEditors') || 'Waiting for Editors'}</option>
                            <option value="accepted">{t('statusAccepted') || 'Accepted'}</option>
                            <option value="not_accepted">{t('statusNotAccepted') || 'Not Accepted'}</option>
                        </select>
                    </div>
                )}
                
                <div className="form-group" style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('saving') : t('updateEntry') || 'Update Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JournalEditPage; 