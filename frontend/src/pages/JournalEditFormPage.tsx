import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { FaImage, FaFileWord, FaFilePdf, FaFileAlt, FaList, FaFolder } from 'react-icons/fa';
import './JournalEntryDetailsPage.css'; // Import toast styles
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

interface JournalFormData {
    title: string;
    title_en?: string;
    issue: string;
    is_published: boolean;
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
        title_en: '',
        issue: '',
        is_published: false,
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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    // Add deletion section state
    const [isDeletionSectionExpanded, setIsDeletionSectionExpanded] = useState<boolean>(false);
    const [isDateInput, setIsDateInput] = useState(false);
    
    // Toast notification state
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'warning'>('success');
    
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { language } = useLanguage();

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
                    title_en: journal.title_en || '',
                    issue: journal.issue,
                    is_published: journal.is_published,
                    publication_date: journal.publication_date ? journal.publication_date.split('T')[0] : undefined,
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
            // Clean up form data before submission, ensuring publication_date is set to 08:00
            const cleanedFormData = {
                ...formData,
                publication_date: formData.publication_date ? 
                    (() => {
                        const date = new Date(formData.publication_date);
                        date.setHours(8, 0, 0, 0); // Set time to 08:00:00 as required
                        return date.toISOString();
                    })() : undefined,
            };
            
            // First update the journal data
            await apiService.updateJournal(journalId, cleanedFormData);

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

            navigate(`/journals/${journalId}?updated=true`);
        } catch (err: any) {
            console.error('Error updating journal:', err);
            setSubmitError(err.message || (language === 'tr' ? 'Dergi güncellenemedi' : 'Failed to update journal'));
            setToastMessage(err.message || (language === 'tr' ? 'Dergi güncellenirken hata oluştu' : 'Error updating journal'));
            setToastType('warning');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJournal = () => {
        if (isNaN(journalId)) {
            setError("Invalid journal ID for deletion.");
            return;
        }

        if (journalId === 1) {
            setToastMessage(language === 'tr' 
                ? 'Varsayılan dergi silinemez (ID: 1)' 
                : 'Cannot delete the default journal (ID: 1)');
            setToastType('warning');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
            return;
        }

        setIsConfirmModalOpen(true);
    };

    const confirmDeleteJournal = async () => {
        setIsConfirmModalOpen(false);
        setIsDeleting(true);
        try {
            await apiService.deleteJournal(journalId);
            navigate('/?deleted=true');
        } catch (err: any) {
            console.error("Failed to delete journal:", err);
            if (err.response?.data?.detail?.includes("Cannot delete journal with ID 1")) {
                setToastMessage(language === 'tr' 
                    ? 'Varsayılan dergi silinemez (ID: 1)' 
                    : 'Cannot delete the default journal (ID: 1)');
                setToastType('warning');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
            } else {
                setToastMessage(err.response?.data?.detail || (language === 'tr' 
                    ? 'Dergi silinemedi' 
                    : 'Failed to delete journal'));
                setToastType('warning');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
            }
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{language === 'tr' ? 'Dergi Düzenle' : 'Edit Journal'}</h1>
                </div>
                <div className="page-content-section">
                    <div className="loading">{language === 'tr' ? 'Dergi yükleniyor...' : 'Loading journal...'}</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className="page-title-section">
                    <h1 style={{textAlign: 'center'}}>{language === 'tr' ? 'Dergi Düzenle' : 'Edit Journal'}</h1>
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
                <h1>{language === 'tr' ? 'Dergi Düzenle' : 'Edit Journal'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                <div className="register-form-container" style={{ marginBottom: '2rem' }}>
                    
                    <form onSubmit={handleSubmit} className="register-form">
                        {submitError && <div className="error-message">{submitError}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">{language === 'tr' ? 'Başlık' : 'Title'}</label>
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
                                placeholder={language === 'tr' ? 'Dergi başlığını girin' : 'Enter journal title'}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="title_en" className="form-label">{language === 'tr' ? 'Başlık (İngilizce)' : 'Title (English)'}</label>
                            <input
                                type="text"
                                id="title_en"
                                name="title_en"
                                className="form-input"
                                value={formData.title_en || ''}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                maxLength={300}
                                placeholder={language === 'tr' ? 'İngilizce dergi başlığını girin' : 'Enter journal title in English'}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="issue" className="form-label">{language === 'tr' ? 'Sayı' : 'Issue'}</label>
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
                                placeholder={language === 'tr' ? 'Sayı numarasını girin' : 'Enter issue number'}
                            />
                        </div>
                        

                        

                        
                        <div className="form-group">
                            <label htmlFor="publication_date" className="form-label">
                                {language === 'tr' ? 'Yayın Tarihi' : 'Publication Date'}
                                {!isAdminOrOwner && (
                                    <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                        ({language === 'tr' ? 'Sadece admin' : 'Admin only'})
                                    </small>
                                )}
                            </label>
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
                                onChange={(e) => setFormData(prev => ({...prev, publication_date: e.target.value}))}
                                onFocus={() => setIsDateInput(true)}
                                onBlur={() => setIsDateInput(false)}
                                placeholder="DD/MM/YYYY"
                                disabled={isSubmitting || !isAdminOrOwner}
                                style={{
                                    opacity: !isAdminOrOwner ? 0.6 : 1,
                                    cursor: !isAdminOrOwner ? 'not-allowed' : 'text'
                                }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="publication_place" className="form-label">
                                {language === 'tr' ? 'Yayın Yeri' : 'Publication Place'}
                                {!isAdminOrOwner && (
                                    <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                        ({language === 'tr' ? 'Sadece admin' : 'Admin only'})
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
                                placeholder={language === 'tr' ? 'Yayın yerini girin' : 'Enter publication place'}
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
                                label: language === 'tr' ? 'Kapak Fotoğrafı' : 'Cover Photo',
                                accept: '.png,.jpg,.jpeg',
                                description: language === 'tr' ? 'PNG veya JPEG görsel dosyası yükleyin' : 'Upload a PNG or JPEG image file',
                                icon: FaImage,
                                color: '#8B5CF6'
                            },
                            {
                                key: 'meta_files',
                                label: language === 'tr' ? 'Meta Dosyalar' : 'Meta Files',
                                accept: '.docx',
                                description: language === 'tr' ? 'DOCX dosyası yükleyin' : 'Upload a DOCX file',
                                icon: FaFileWord,
                                color: '#06B6D4'
                            },
                            {
                                key: 'editor_notes',
                                label: language === 'tr' ? 'Editör Notları' : 'Editor Notes',
                                accept: '.docx',
                                description: language === 'tr' ? 'DOCX dosyası yükleyin' : 'Upload a DOCX file',
                                icon: FaFileAlt,
                                color: '#F59E0B'
                            },
                            {
                                key: 'full_pdf',
                                label: language === 'tr' ? 'Tam PDF' : 'Full PDF',
                                accept: '.pdf',
                                description: language === 'tr' ? 'PDF dosyası yükleyin' : 'Upload a PDF file',
                                icon: FaFilePdf,
                                color: '#EF4444'
                            },
                            {
                                key: 'index_section',
                                label: language === 'tr' ? 'İçindekiler Bölümü' : 'Index Section',
                                accept: '.docx',
                                description: language === 'tr' ? 'DOCX dosyası yükleyin' : 'Upload a DOCX file',
                                icon: FaList,
                                color: '#10B981'
                            },
                            {
                                key: 'file_path',
                                label: language === 'tr' ? 'Dosya Yolu' : 'File Path',
                                accept: '.docx',
                                description: language === 'tr' ? 'DOCX dosyası yükleyin' : 'Upload a DOCX file',
                                icon: FaFolder,
                                color: '#6366F1'
                            }
                        ].map(({ key, label, accept, description, icon: IconComponent, color }) => (
                            <div className="form-group" key={key}>
                                <label htmlFor={key} className="form-label">
                                    {label}
                                    {!isAdminOrOwner && (
                                        <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                            ({language === 'tr' ? 'Sadece admin' : 'Admin only'})
                                        </small>
                                    )}
                                </label>
                                {(formData as any)[key] && (
                                    <div style={{ 
                                        marginBottom: 'var(--spacing-2)', 
                                        padding: 'var(--spacing-2)', 
                                        background: `${color}15`, 
                                        borderRadius: '8px',
                                        border: `1px solid ${color}30`,
                                        textAlign: 'center'
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
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-1)'
                                            }}
                                        >
                                            <IconComponent size={16} />
                                            {language === 'tr' ? `Mevcut ${label}` : `Current ${label}`}
                                        </a>
                                    </div>
                                )}
                                <div style={{ position: 'relative' }}>
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
                                        cursor: isAdminOrOwner ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s ease',
                                        color: '#6B7280',
                                        textAlign: 'center' as const,
                                        opacity: !isAdminOrOwner ? 0.6 : 1
                                    }}>
                                        {selectedFiles[key as keyof typeof selectedFiles] 
                                            ? selectedFiles[key as keyof typeof selectedFiles]?.name 
                                            : (language === 'tr' ? 'Dosya Seç' : 'Choose File')
                                        }
                                    </div>
                                </div>
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
                        
                        {/* Publication Status Section */}
                        <div className="form-group">
                            <label className="form-label">
                                {language === 'tr' ? 'Yayın Durumu' : 'Publication Status'}
                                {!isAdminOrOwner && (
                                    <small style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginLeft: 'var(--spacing-1)' }}>
                                        ({language === 'tr' ? 'Sadece admin' : 'Admin only'})
                                    </small>
                                )}
                            </label>
                            <div style={{ 
                                display: 'flex', 
                                gap: 'var(--spacing-2)', 
                                marginTop: 'var(--spacing-2)' 
                            }}>
                                {/* Publish Option */}
                                <div 
                                    onClick={() => isAdminOrOwner && !isSubmitting && setFormData({...formData, is_published: true})}
                                    style={{
                                        flex: '1',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        border: formData.is_published ? '3px solid #14B8A6' : '2px solid #E2E8F0',
                                        background: formData.is_published 
                                            ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)'
                                            : 'rgba(249, 250, 251, 0.8)',
                                        cursor: isAdminOrOwner && !isSubmitting ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'center',
                                        opacity: !isAdminOrOwner ? 0.6 : 1
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '1.5rem', 
                                        marginBottom: '4px',
                                        color: formData.is_published ? '#14B8A6' : '#9CA3AF'
                                    }}>
                                        ✓
                                    </div>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        fontSize: '0.9rem',
                                        color: formData.is_published ? '#14B8A6' : '#6B7280'
                                    }}>
                                        {language === 'tr' ? 'Yayınlandı' : 'Published'}
                                    </div>
                                </div>

                                {/* Unpublish Option */}
                                <div 
                                    onClick={() => isAdminOrOwner && !isSubmitting && setFormData({...formData, is_published: false})}
                                    style={{
                                        flex: '1',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        border: !formData.is_published ? '3px solid #F59E0B' : '2px solid #E2E8F0',
                                        background: !formData.is_published 
                                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
                                            : 'rgba(249, 250, 251, 0.8)',
                                        cursor: isAdminOrOwner && !isSubmitting ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'center',
                                        opacity: !isAdminOrOwner ? 0.6 : 1
                                    }}
                                >
                                    <div style={{ 
                                        fontSize: '1.5rem', 
                                        marginBottom: '4px',
                                        color: !formData.is_published ? '#F59E0B' : '#9CA3AF'
                                    }}>
                                        ⏸
                                    </div>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        fontSize: '0.9rem',
                                        color: !formData.is_published ? '#F59E0B' : '#6B7280'
                                    }}>
                                        {language === 'tr' ? 'Taslak Durumunda' : 'Unpublished'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ 
                            display: 'flex',
                            gap: 'var(--spacing-3)',
                            marginTop: 'var(--spacing-6)'
                        }}>
                            <button 
                                type="button" 
                                onClick={() => navigate(`/journals/${journalId}`)} 
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
                                {language === 'tr' ? 'İptal' : 'Cancel'}
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
                                    ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') 
                                    : (language === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes')}
                            </button>
                        </div>
                    </form>
                        </div>

                {/* Journal Deletion Section */}
                        {isAdminOrOwner && (
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
                                {language === 'tr' ? 'Dergiyi Sil' : 'Delete Journal'}
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
                                    ? 'Bu işlem dergiyi kalıcı olarak silecektir ve geri alınamaz. Dergi ile ilgili tüm makaleler varsayılan dergiye (ID: 1) taşınacaktır.'
                                    : 'This action will permanently delete this journal and cannot be undone. All entries will be reassigned to the default journal (ID: 1).'}
                            </p>
                            
                                <button 
                                    type="button"
                                className="btn"
                                    onClick={handleDeleteJournal}
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
                                    : (language === 'tr' ? 'Dergiyi Sil' : 'Delete Journal')}
                                </button>
                            </div>
                        )}
                </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteJournal}
                title={language === 'tr' ? 'Dergiyi Sil' : 'Delete Journal'}
                message={language === 'tr' 
                    ? 'Bu dergiyi silmek istediğinizden emin misiniz? İlgili tüm makaleler varsayılan dergiye (ID: 1) taşınacaktır. Bu işlem geri alınamaz.'
                    : 'Are you sure you want to delete this journal? All related entries will be reassigned to the default journal (ID: 1). This action cannot be undone.'}
                confirmText={language === 'tr' ? 'Dergiyi Sil' : 'Delete Journal'}
                cancelText={language === 'tr' ? 'İptal' : 'Cancel'}
                variant="danger"
                icon="⚠"
            />

            {/* Toast Notification */}
            {showToast && (
                <div className="toast-notification">
                    <div className={`toast-content toast-${toastType}`}>
                        <div className="toast-icon">
                            {toastType === 'success' ? '✓' : '⚠'}
                        </div>
                        <span className="toast-message">{toastMessage}</span>
                        <button 
                            className="toast-close" 
                            onClick={() => setShowToast(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default JournalEditFormPage; 