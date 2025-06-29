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
    const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'owner');
    const isEditorOrAdmin = isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner');
    const [isDateInput, setIsDateInput] = useState(false);
    
    // State to track journal and its editors
    const [journal, setJournal] = useState<apiService.Journal | null>(null);
    const [journalEditors, setJournalEditors] = useState<apiService.UserRead[]>([]);
    const [editorInChief, setEditorInChief] = useState<apiService.UserRead | null>(null);
    
    // Check if current user is editor-in-chief of the related journal
    const isEditorInChief = isAuthenticated && user && journal && 
      journal.editor_in_chief_id === user.id;
    
    // Check if current user is an editor of the related journal
    const isJournalEditor = isAuthenticated && user && 
      journalEditors.some(editor => editor.id === user.id);
    
    // Main access control: Can user edit this entry?
    const canEditEntry = isAuthenticated && user && (
      isAdmin || // Admin/Owner access
      isEditorInChief || // Editor-in-chief of related journal
      isJournalEditor // Editor of related journal
    );

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
                
                // Fetch journal data if entry belongs to a journal
                if (entry.journal_id) {
                    try {
                        let journalData = null;
                        
                        // Try to get journal data
                        try {
                            journalData = await apiService.getJournalById(entry.journal_id);
                        } catch (journalErr) {
                            // If that fails, try published journals
                            const publishedJournals = await apiService.getPublishedJournals();
                            journalData = publishedJournals.find(j => j.id === entry.journal_id);
                        }
                        
                        if (journalData) {
                            setJournal(journalData);
                            
                            // Fetch journal editors and editor-in-chief
                            try {
                                const editorLinksData = await apiService.getPublicJournalEditors(journalData.id);
                                if (editorLinksData.length > 0) {
                                    const editorsData = await Promise.all(
                                        editorLinksData.map(link => apiService.getPublicUserInfo(link.user_id.toString()))
                                    );
                                    setJournalEditors(editorsData);
                                }
                                
                                if (journalData.editor_in_chief_id) {
                                    const editorInChiefData = await apiService.getPublicUserInfo(journalData.editor_in_chief_id.toString());
                                    setEditorInChief(editorInChiefData);
                                }
                            } catch (err) {
                                console.error("Failed to fetch journal editors:", err);
                            }
                        }
                    } catch (journalErr) {
                        console.error("Failed to fetch journal data:", journalErr);
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch entry for editing:", err);
                setError(err.response?.data?.detail || "Failed to load entry data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntry();
    }, [id, entryId]);

    // Check access control after data is loaded
    useEffect(() => {
        if (formData.title && !isLoading) {
            // After entry data is loaded, check if user has access
            if (!canEditEntry) {
                setError(t('accessDeniedNotAuthorizedToEditEntry') || 'Access denied: You are not authorized to edit this entry.');
            }
        }
    }, [formData.title, journal, journalEditors, editorInChief, canEditEntry, isLoading, t]);

    const validateFileType = (file: File, allowedTypes: string[]): boolean => {
        const fileType = file.name.split('.').pop()?.toLowerCase();
        return fileType ? allowedTypes.includes(fileType) : false;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            const file = files[0];
            const maxSize = 100 * 1024 * 1024; // 100MB

            if (file.size > maxSize) {
                setSubmitError(t('fileTooLarge') || 'File size cannot exceed 100 MB.');
                e.target.value = ''; // Clear the input
                return;
            }
            
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
                    (() => {
                        const date = new Date(formData.publication_date);
                        date.setHours(8, 0, 0, 0); // Set time to 08:00:00 as required
                        return date.toISOString();
                    })() : undefined,
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
            <div style={{
                minHeight: '70vh',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                marginLeft: '60px'
            }}>
                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '32px',
                    padding: '48px',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                    border: '1px solid rgba(226, 232, 240, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-30%',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        zIndex: 0
                    }}></div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto 32px',
                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                            borderRadius: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            boxShadow: '0 20px 40px rgba(20, 184, 166, 0.2)',
                            animation: 'bounceIn 0.8s ease-out'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
                                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#1E293B',
                            marginBottom: '16px',
                            letterSpacing: '-0.025em',
                            background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>{language === 'tr' ? 'Makale Bulunamadı!' : 'Entry Not Found!'}</h1>
                        
                        <p style={{
                            fontSize: '18px',
                            color: '#64748B',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                            fontWeight: '500'
                        }}>{language === 'tr' ? 'Bu makale düzenlenemez veya mevcut değil.' : 'This entry cannot be edited or does not exist.'}</p>
                        
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => navigate('/archive')}
                                style={{
                                    padding: '16px 32px',
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(20, 184, 166, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {language === 'tr' ? 'Arşive Dön' : 'Browse Archive'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>{`
                    @keyframes bounceIn {
                        0% {
                            opacity: 0;
                            transform: scale(0.3);
                        }
                        50% {
                            opacity: 1;
                            transform: scale(1.05);
                        }
                        70% {
                            transform: scale(0.9);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>
            </div>
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
                                title={`${t('maxCharacters')}: 300`}
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
                                title={`${t('maxCharacters')}: 300`}
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
                                title={`${t('maxCharacters')}: 500`}
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
                                title={`${t('maxCharacters')}: 100`}
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
                                placeholder={language === 'tr' ? 'İngilizce genişletilmiş özeti giriniz' : 'Enter an extended summary in English'}
                                disabled={isSubmitting}
                                rows={3}
                                maxLength={1000}
                                title={`${t('maxCharacters')}: 1000`}
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
                                title={`${t('maxCharacters')}: 100`}
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
                                placeholder={language === 'tr' ? 'Sayfa numarası giriniz (örn: 1-15)' : 'Enter page number (e.g., 1-15)'}
                                disabled={isSubmitting}
                                maxLength={20}
                                title={`${t('maxCharacters')}: 20`}
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
                                placeholder={language === 'tr' ? 'DOI giriniz' : 'Enter DOI'}
                                disabled={isSubmitting}
                                maxLength={100}
                                title={`${t('maxCharacters')}: 100`}
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
                                <div style={{ position: 'relative' }}>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status || ''}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '12px 16px',
                                            border: '2px solid #E2E8F0',
                                            borderRadius: '12px',
                                            background: 'rgba(249, 250, 251, 0.8)',
                                            backgroundColor: 'rgba(249, 250, 251, 0.8)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            color: '#374151',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            width: '100%',
                                            appearance: 'none' as const,
                                            WebkitAppearance: 'none' as const,
                                            MozAppearance: 'none' as const,
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 12px center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '16px',
                                            fontFamily: 'var(--font-family-sans)',
                                            outline: 'none',
                                            boxSizing: 'border-box' as const,
                                            minHeight: '48px',
                                            display: 'block'
                                        } as React.CSSProperties}
                                        onFocus={(e) => {
                                            e.target.style.setProperty('border-color', '#6A9DA1', 'important');
                                            e.target.style.setProperty('box-shadow', '0 0 0 3px rgba(106, 157, 161, 0.1)', 'important');
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.setProperty('border-color', '#E2E8F0', 'important');
                                            e.target.style.setProperty('box-shadow', 'none', 'important');
                                        }}
                                        ref={(element) => {
                                            if (element) {
                                                // Force override any CSS with !important
                                                element.style.setProperty('padding', '12px 16px', 'important');
                                                element.style.setProperty('border', '2px solid #E2E8F0', 'important');
                                                element.style.setProperty('border-radius', '12px', 'important');
                                                element.style.setProperty('background', 'rgba(249, 250, 251, 0.8)', 'important');
                                                element.style.setProperty('cursor', 'pointer', 'important');
                                                element.style.setProperty('color', '#374151', 'important');
                                                element.style.setProperty('font-size', '1rem', 'important');
                                                element.style.setProperty('font-weight', '500', 'important');
                                                element.style.setProperty('width', '100%', 'important');
                                                element.style.setProperty('appearance', 'none', 'important');
                                                element.style.setProperty('-webkit-appearance', 'none', 'important');
                                                element.style.setProperty('-moz-appearance', 'none', 'important');
                                                element.style.setProperty('background-image', `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 'important');
                                                element.style.setProperty('background-position', 'right 12px center', 'important');
                                                element.style.setProperty('background-repeat', 'no-repeat', 'important');
                                                element.style.setProperty('background-size', '16px', 'important');
                                                element.style.setProperty('outline', 'none', 'important');
                                                element.style.setProperty('min-height', '48px', 'important');
                                            }
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