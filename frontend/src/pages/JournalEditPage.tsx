import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { FaFileWord, FaFilePdf } from 'react-icons/fa';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

interface JournalFormData {
    title: string;
    title_en?: string;
    abstract_tr: string;
    abstract_en?: string;
    keywords?: string;
    keywords_en?: string;
    page_number?: string;
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
    const { t, language } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const isEditorOrAdmin = isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner');
    const [isDateInput, setIsDateInput] = useState(false);

    const [formData, setFormData] = useState<JournalFormData>({
        title: '',
        title_en: '',
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        keywords_en: '',
        page_number: '',
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
    
    // Deletion section state
    const [isDeletionSectionExpanded, setIsDeletionSectionExpanded] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

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
                    title_en: entry.title_en,
                    abstract_tr: entry.abstract_tr,
                    abstract_en: entry.abstract_en,
                    keywords: entry.keywords,
                    keywords_en: entry.keywords_en,
                    page_number: entry.page_number,
                    doi: entry.doi,
                    file_path: entry.file_path,
                    full_pdf: entry.full_pdf,
                    status: entry.status,
                    authors_ids: entry.authors?.map((author: apiService.UserRead) => author.id),
                    referees_ids: entry.referees?.map((referee: apiService.UserRead) => referee.id),
                    publication_date: entry.publication_date ? new Date(entry.publication_date).toISOString().slice(0, 10) : ''
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
            
            // Different validation for full_pdf
            if (name === 'full_pdf') {
                if (!validateFileType(file, ['pdf'])) {
                    setSubmitError(t('onlyPdfAllowed') || 'Only PDF files are allowed');
                    e.target.value = '';
                    return;
                }
            } else {
                if (!validateFileType(file, ['docx'])) {
                    setSubmitError(t('onlyDocxAllowed') || 'Only DOCX files are allowed');
                    e.target.value = '';
                    return;
                }
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
            // Clean up form data before submission
            const cleanedFormData = {
                ...formData,
                abstract_en: formData.abstract_en?.trim() || undefined,
                keywords: formData.keywords?.trim() || undefined,
                keywords_en: formData.keywords_en?.trim() || undefined,
                page_number: formData.page_number?.trim() || undefined,
                doi: formData.doi?.trim() || undefined,
                publication_date: formData.publication_date ? 
                    new Date(formData.publication_date).toISOString() : undefined,
                authors_ids: formData.authors_ids?.filter(id => id != null) || [],
                referees_ids: formData.referees_ids?.filter(id => id != null) || []
            };

            // Remove undefined values
            Object.keys(cleanedFormData).forEach(key => {
                if (cleanedFormData[key as keyof JournalFormData] === undefined) {
                    delete cleanedFormData[key as keyof JournalFormData];
                }
            });

            // First update the entry data
            await apiService.updateEntry(Number(id), cleanedFormData);

            // Then handle file uploads if any files were selected
            if (selectedFiles.file_path) {
                const fileData = new FormData();
                fileData.append('file', selectedFiles.file_path);
                await apiService.uploadEntryFile(Number(id), fileData);
            }
            
            if (selectedFiles.full_pdf) {
                const pdfData = new FormData();
                pdfData.append('file', selectedFiles.full_pdf);
                await apiService.uploadEntryFullPdf(Number(id), pdfData);
            }

            navigate(`/entries/${id}?updated=true`);
        } catch (error) {
            console.error('Error updating entry:', error);
            setSubmitError(t('errorUpdatingEntry') || 'Error updating entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEntry = () => {
        // Just open the modal, don't perform the action yet
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteEntry = async () => {
        if (isNaN(entryId)) {
            setError("Invalid entry ID for deletion.");
            return;
        }

        setIsConfirmModalOpen(false); // Close the modal first
        setIsDeleting(true);
        try {
            await apiService.deleteEntry(entryId);
            navigate('/archive?deleted=true');
        } catch (err: any) {
            console.error("Failed to delete entry:", err);
            setError(err.response?.data?.detail || "Failed to delete entry.");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{t('editEntry') || 'Edit Entry'}</h1>
                </div>
                <div className="page-content-section">
                    <div className="loading">{t('loadingEntry') || 'Loading entry...'}</div>
                </div>
            </>
        );
    }
    
    if (error) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{t('editEntry') || 'Edit Entry'}</h1>
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
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
                <h1>{t('editEntry') || 'Edit Entry'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                {/* Entry Edit Form */}
                <div className="register-form-container" style={{ marginBottom: '2rem' }}>
                    
                    <form onSubmit={handleSubmit} className="register-form">
                        {submitError && <div className="error-message">{submitError}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">{t('entryTitle') || 'Title'}</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="form-input"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder={t('enterEntryTitle') || 'Enter title'}
                                required
                                disabled={isSubmitting}
                                maxLength={300}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="title_en" className="form-label">{t('entryTitleEn') || 'Title (English)'}</label>
                            <input
                                type="text"
                                id="title_en"
                                name="title_en"
                                className="form-input"
                                value={formData.title_en || ''}
                                onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                                placeholder={t('enterEntryTitleEn') || 'Enter title in English'}
                                disabled={isSubmitting}
                                maxLength={300}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="publication_date" className="form-label">{t('publicationDate') || 'Publication Date'}</label>
                            <input
                                type={isDateInput ? 'date' : 'text'}
                                id="publication_date"
                                name="publication_date"
                                className="form-input"
                                value={
                                    isDateInput
                                        ? (formData.publication_date || '')
                                        : (formData.publication_date ? formatDateToDDMMYYYY(formData.publication_date) : '')
                                }
                                onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                                onFocus={() => setIsDateInput(true)}
                                onBlur={() => setIsDateInput(false)}
                                placeholder="DD/MM/YYYY"
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
                                placeholder={t('enterAbstractTurkish') || 'Enter a brief summary in Turkish...'}
                                required
                                disabled={isSubmitting}
                                rows={3}
                                maxLength={500}
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
                                placeholder={t('enterKeywordsComma') || 'Enter keywords, separated by commas...'}
                                disabled={isSubmitting}
                                maxLength={100}
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
                                placeholder={t('enterAbstractEnglish') || 'Enter a brief summary in English...'}
                                disabled={isSubmitting}
                                rows={3}
                                maxLength={500}
                            />
                        </div>
                        
                        
                        
                        <div className="form-group">
                            <label htmlFor="keywords_en" className="form-label">{t('keywordsEn') || 'Keywords (English)'}</label>
                            <input
                                type="text"
                                id="keywords_en"
                                name="keywords_en"
                                className="form-input"
                                value={formData.keywords_en || ''}
                                onChange={(e) => setFormData({...formData, keywords_en: e.target.value})}
                                placeholder={t('keywordsSeparatedByCommasEn') || 'Separate English keywords with commas'}
                                disabled={isSubmitting}
                                maxLength={100}
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
                                placeholder={t('enterPageNumber') || 'Enter page number (e.g., 1-15)'}
                                disabled={isSubmitting}
                                maxLength={20}
                            />
                        </div>
                        

                        
                        <div className="form-group">
                            <label htmlFor="doi" className="form-label">{'DOI'}</label>
                            <input
                                type="text"
                                id="doi"
                                name="doi"
                                className="form-input"
                                value={formData.doi || ''}
                                onChange={(e) => setFormData({...formData, doi: e.target.value})}
                                placeholder={t('enterDoi') || 'Enter DOI (e.g., 10.1000/xyz123)'}
                                disabled={isSubmitting}
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="file_path" className="form-label">{language === 'tr' ? 'DOCX Dosyası' : 'DOCX File'}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    id="file_path"
                                    name="file_path"
                                    className="form-input"
                                    onChange={handleFileChange}
                                    accept=".docx"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '12px 16px',
                                        border: '2px dashed #E2E8F0',
                                        borderRadius: '12px',
                                        background: 'rgba(249, 250, 251, 0.8)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        opacity: 0,
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                                <div style={{
                                    padding: '12px 16px',
                                    border: '2px dashed #E2E8F0',
                                    borderRadius: '12px',
                                    background: 'rgba(249, 250, 251, 0.8)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    color: '#6B7280',
                                    textAlign: 'center' as const
                                }}>
                                    {selectedFiles.file_path 
                                        ? selectedFiles.file_path.name 
                                        : (language === 'tr' ? 'Dosya Seç' : 'Choose File')
                                    }
                                </div>
                            </div>
                            {formData.file_path && (
                                <div style={{ 
                                    marginTop: 'var(--spacing-2)', 
                                    padding: 'var(--spacing-2)', 
                                    background: 'rgba(20, 184, 166, 0.1)', 
                                    borderRadius: '8px',
                                    border: '1px solid rgba(20, 184, 166, 0.3)',
                                    textAlign: 'center'
                                }}>
                                    <a 
                                        href={`/api${formData.file_path}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            color: '#0D9488',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            fontSize: '0.9rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FaFileWord size={16} />
                                        {language === 'tr' ? 'Mevcut DOCX Dosyası' : 'Current DOCX File'}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="full_pdf" className="form-label">{language === 'tr' ? 'PDF Dosyası' : 'PDF File'}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    id="full_pdf"
                                    name="full_pdf"
                                    className="form-input"
                                    onChange={handleFileChange}
                                    accept=".pdf"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '12px 16px',
                                        border: '2px dashed #E2E8F0',
                                        borderRadius: '12px',
                                        background: 'rgba(249, 250, 251, 0.8)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        opacity: 0,
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                                <div style={{
                                    padding: '12px 16px',
                                    border: '2px dashed #E2E8F0',
                                    borderRadius: '12px',
                                    background: 'rgba(249, 250, 251, 0.8)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    color: '#6B7280',
                                    textAlign: 'center' as const
                                }}>
                                    {selectedFiles.full_pdf 
                                        ? selectedFiles.full_pdf.name 
                                        : (language === 'tr' ? 'Dosya Seç' : 'Choose File')
                                    }
                                </div>
                            </div>
                            {formData.full_pdf && (
                                <div style={{ 
                                    marginTop: 'var(--spacing-2)', 
                                    padding: 'var(--spacing-2)', 
                                    background: 'rgba(59, 130, 246, 0.1)', 
                                    borderRadius: '8px',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    textAlign: 'center'
                                }}>
                                    <a 
                                        href={`/api${formData.full_pdf}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            color: '#2563EB',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            fontSize: '0.9rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FaFilePdf size={16} />
                                        {language === 'tr' ? 'Mevcut PDF Dosyası' : 'Current PDF File'}
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
                                    className="form-input"
                                    value={formData.status || ''}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '12px 16px',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: '12px',
                                        background: 'rgba(249, 250, 251, 0.8)',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '16px'
                                    }}
                                >
                                    <option value="waiting_for_payment">{t('statusWaitingForPayment') || 'Waiting for Payment'}</option>
                                    <option value="waiting_for_authors">{t('statusWaitingForAuthors') || 'Waiting for Authors'}</option>
                                    <option value="waiting_for_referees">{t('statusWaitingForReferees') || 'Waiting for Referees'}</option>
                                    <option value="waiting_for_editors">{t('statusWaitingForEditors') || 'Waiting for Editors'}</option>
                                    <option value="accepted">{t('statusAccepted') || 'Accepted'}</option>
                                    <option value="not_accepted">{t('statusNotAccepted') || 'Not Accepted'}</option>
                                </select>
                            </div>
                        )}
                        
                        <div style={{ 
                            display: 'flex',
                            gap: 'var(--spacing-3)',
                            marginTop: 'var(--spacing-6)'
                        }}>
                            <button 
                                type="button" 
                                className="btn btn-outline" 
                                onClick={() => navigate(`/entries/${id}`)}
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
                                disabled={isSubmitting}
                                style={{
                                    flex: '2'
                                }}
                            >
                                {isSubmitting ? (t('saving') || 'Saving...') : (t('updateEntry') || 'Update Entry')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Entry Deletion Section */}
                <div className="register-form-container" style={{ 
                    border: '2px solid #FEE2E2', 
                    backgroundColor: 'rgba(254, 226, 226, 0.3)',
                    padding: '0',
                    overflow: 'hidden'
                }}>
                    <div 
                        onClick={() => setIsDeletionSectionExpanded(!isDeletionSectionExpanded)}
                        style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            padding: '1.5rem',
                            backgroundColor: 'rgba(254, 226, 226, 0.5)',
                            borderBottom: isDeletionSectionExpanded ? '2px solid #FCA5A5' : 'none',
                            margin: '0',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(254, 226, 226, 0.7)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(254, 226, 226, 0.5)';
                        }}
                    >
                        <h2 style={{ 
                            margin: '0', 
                            fontSize: '1.5rem', 
                            fontWeight: '600', 
                            color: '#DC2626'
                        }}>
                            {language === 'tr' ? 'Makaleyi Sil' : 'Delete Entry'}
                        </h2>
                        <span style={{ 
                            position: 'absolute',
                            right: '1.5rem',
                            fontSize: '2.5rem',
                            fontWeight: '300',
                            lineHeight: '1',
                            color: '#DC2626',
                            transition: 'transform 0.3s ease',
                            transform: isDeletionSectionExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
                        }}>
                            +
                        </span>
                    </div>
                    
                    {isDeletionSectionExpanded && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'white' }}>
                        
                        <p style={{ 
                            color: '#6B7280', 
                            marginBottom: '2rem',
                            lineHeight: '1.6',
                            fontSize: '1rem'
                        }}>
                            {language === 'tr' 
                                ? 'Bu işlem makaleyi kalıcı olarak silecektir ve geri alınamaz.'
                                : 'This action will permanently delete this entry and cannot be undone.'}
                        </p>
                        
                        <button 
                            type="button" 
                            className="btn"
                            onClick={handleDeleteEntry}
                            disabled={isDeleting}
                            style={{
                                backgroundColor: '#DC2626',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                                opacity: isDeleting ? 0.6 : 1,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                            }}
                            onMouseOver={(e) => {
                                const target = e.target as HTMLButtonElement;
                                if (!target.disabled) {
                                    target.style.backgroundColor = '#B91C1C';
                                    target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.4)';
                                }
                            }}
                            onMouseOut={(e) => {
                                const target = e.target as HTMLButtonElement;
                                if (!target.disabled) {
                                    target.style.backgroundColor = '#DC2626';
                                    target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                                }
                            }}
                        >
                            {isDeleting 
                                ? (language === 'tr' ? 'Siliniyor...' : 'Deleting...') 
                                : (language === 'tr' ? 'Makaleyi Sil' : 'Delete Entry')}
                        </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteEntry}
                title={language === 'tr' ? 'Makaleyi Sil' : 'Delete Entry'}
                message={language === 'tr' ? 'Bu makaleyi silmek istediğinizden emin misiniz? Makale ile ilgili bütün bilgiler silinecektir. Bu işlem geri alınamaz.' : 'Are you sure you want to delete this entry?'}
                confirmText={language === 'tr' ? 'Makaleyi Sil' : 'Delete Entry'}
                cancelText={language === 'tr' ? 'İptal' : 'Cancel'}
                variant="danger"
                icon="⚠"
            />
        </>
    );
};

export default JournalEditPage; 