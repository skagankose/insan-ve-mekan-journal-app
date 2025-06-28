import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import 'react-toastify/dist/ReactToastify.css';
import axios, { AxiosError } from 'axios';
import './JournalEntryDetailsPage.css';

const AuthorUpdateFormPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    abstract_en: '',
    abstract_tr: '',
    keywords: '',
    keywords_en: '',
    notes: '',
  });
  
  // Store original entry data for comparison
  const [originalEntryData, setOriginalEntryData] = useState({
    title: '',
    abstract_en: '',
    abstract_tr: '',
    keywords: '',
    keywords_en: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toast notification state
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  
  useEffect(() => {
    const fetchEntryData = async () => {
          if (!entryId) {
      setToastMessage(language === 'tr' ? 'Makale ID bulunamadı' : 'Entry ID not found');
      setToastType('warning');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }
      
      try {
        setIsLoading(true);
        const entryData = await apiService.getEntryById(parseInt(entryId));
        
        // Store original entry data for comparison
        const originalData = {
          title: entryData.title || '',
          abstract_en: entryData.abstract_en || '',
          abstract_tr: entryData.abstract_tr || '',
          keywords: entryData.keywords || '',
          keywords_en: entryData.keywords_en || '',
        };
        
        setOriginalEntryData(originalData);
        
        // Pre-fill form data with entry information
        setFormData({
          ...originalData,
          notes: '', // Keep notes empty as requested
        });
      } catch (error) {
        console.error('Error fetching entry data:', error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setError('Entry not found');
        } else {
          setToastMessage(language === 'tr' ? 'Makale verisi yüklenirken hata oluştu' : 'Error fetching entry data');
          setToastType('warning');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEntryData();
  }, [entryId, t]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const maxSize = 100 * 1024 * 1024; // 100MB

      if (file.size > maxSize) {
        setToastMessage(t('fileTooLarge') || 'File size cannot exceed 100 MB.');
        setToastType('warning');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        e.target.value = '';
        return;
      }

      if (!file.name.toLowerCase().endsWith('.docx')) {
        setToastMessage(language === 'tr' ? 'Sadece .docx dosyalarına izin verilir' : 'Only .docx files are allowed');
        setToastType('warning');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entryId) {
      setToastMessage(language === 'tr' ? 'Makale ID bulunamadı' : 'Entry ID not found');
      setToastType('warning');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }
    

    
    setIsSubmitting(true);
    
    try {
      // Compare current form data with original entry data to identify changes
      const changedFields: { [key: string]: string } = {};
      
      // Check each field for changes (excluding notes which should always be included if not empty)
      const fieldsToCheck = ['title', 'abstract_en', 'abstract_tr', 'keywords', 'keywords_en'] as const;
      
      fieldsToCheck.forEach(field => {
        const currentValue = formData[field] || '';
        const originalValue = originalEntryData[field] || '';
        
        // Only include field if it has changed from the original
        if (currentValue !== originalValue) {
          changedFields[field] = currentValue;
        }
      });
      
      // Always include notes if provided (notes are not compared as they're always new)
      if (formData.notes) {
        changedFields.notes = formData.notes;
      }
      
      // Check if notes are provided (now required)
      if (!formData.notes) {
        setToastMessage(language === 'tr' ? 'Notlar alanı zorunludur.' : 'Notes field is required.');
        setToastType('warning');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
      
      // Check if we have any changes or a file to upload
      const hasChanges = Object.keys(changedFields).length > 0 || selectedFile;
      
      if (!hasChanges) {
        setToastMessage(language === 'tr' ? 'Hiçbir değişiklik algılanmadı. Lütfen en az bir alanı değiştirin veya dosya yükleyin.' : 'No changes detected. Please modify at least one field or upload a file.');
        setToastType('warning');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
      
      // Create FormData object for file upload with only changed fields
      const uploadData = new FormData();
      
      // Add only changed fields to FormData
      Object.entries(changedFields).forEach(([key, value]) => {
        if (value) { // Only append non-empty values
          uploadData.append(key, value);
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        uploadData.append('file', selectedFile);
      }
      
      // Create the author update with only changed data
      await apiService.createAuthorUpdateWithFile(parseInt(entryId), uploadData);
      
      // Then, update the entry itself with the same changed information
      const entryUpdateData = {
        title: changedFields.title || undefined,
        abstract_en: changedFields.abstract_en || undefined,
        abstract_tr: changedFields.abstract_tr || undefined,
        keywords: changedFields.keywords || undefined,
        keywords_en: changedFields.keywords_en || undefined,
      };
      
      // Only include fields that have values to avoid overwriting with empty strings
      const filteredEntryUpdateData = Object.fromEntries(
        Object.entries(entryUpdateData).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      // Update the entry if there are any fields to update
      if (Object.keys(filteredEntryUpdateData).length > 0) {
        await apiService.updateEntry(parseInt(entryId), filteredEntryUpdateData);
      }
      
      // If there's a file, update the entry's file as well
      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);
        await apiService.uploadEntryFile(parseInt(entryId), fileFormData);
      }
      
      navigate(`/entries/${entryId}/updates?authorUpdated=true`);
    } catch (error: unknown) {
      console.error('Error submitting author update:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      setToastMessage(language === 'tr' ? 'Güncelleme gönderilirken hata oluştu' : 'Error submitting update');
      setToastType('warning');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <>
        <div className="page-title-section">
          <h1 style={{textAlign: 'center'}}>{language === 'tr' ? 'Yazar Güncellemesi Ekle' : 'Add Author Update'}</h1>
        </div>
        <div className="page-content-section">
          <div className="loading">{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
        </div>
      </>
    );
  }

  if (error === 'Entry not found') {
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
            }}>{language === 'tr' ? 'Bu makale için güncelleme eklenemez veya makale mevcut değil.' : 'Cannot add update for this entry or entry does not exist.'}</p>
            
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
        <h1>{language === 'tr' ? 'Yazar Güncellemesi Ekle' : 'Add Author Update'}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section">
        <div className="register-form-container" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="title" className="form-label">{language === 'tr' ? 'Başlık' : 'Title'} *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder={language === 'tr' ? 'Başlığı girin' : 'Enter title'}
                required
                maxLength={300}
                title={`${t('maxCharacters')}: 300`}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="abstract_tr" className="form-label">{language === 'tr' ? 'Özet (Türkçe)' : 'Abstract (Turkish)'}</label>
              <textarea
                id="abstract_tr"
                name="abstract_tr"
                value={formData.abstract_tr}
                onChange={handleChange}
                className="form-textarea"
                placeholder={language === 'tr' ? 'Türkçe özet girin' : 'Enter abstract in Turkish'}
                rows={4}
                maxLength={500}
                title={`${t('maxCharacters')}: 500`}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="abstract_en" className="form-label">{language === 'tr' ? 'Özet (İngilizce)' : 'Abstract (English)'}</label>
              <textarea
                id="abstract_en"
                name="abstract_en"
                value={formData.abstract_en}
                onChange={handleChange}
                className="form-textarea"
                placeholder={language === 'tr' ? 'İngilizce özet girin' : 'Enter abstract in English'}
                rows={4}
                maxLength={1000}
                title={`${t('maxCharacters')}: 1000`}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords" className="form-label">{language === 'tr' ? 'Anahtar Kelimeler (Türkçe)' : 'Keywords (Turkish)'}</label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                className="form-input"
                placeholder={language === 'tr' ? 'Anahtar kelimeleri virgülle ayırın' : 'Separate keywords with commas'}
                maxLength={100}
                title={`${t('maxCharacters')}: 100`}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords_en" className="form-label">{language === 'tr' ? 'Anahtar Kelimeler (İngilizce)' : 'Keywords (English)'}</label>
              <input
                type="text"
                id="keywords_en"
                name="keywords_en"
                value={formData.keywords_en}
                onChange={handleChange}
                className="form-input"
                placeholder={language === 'tr' ? 'İngilizce anahtar kelimeleri virgülle ayırın' : 'Separate English keywords with commas'}
                maxLength={100}
                title={`${t('maxCharacters')}: 100`}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes" className="form-label">{language === 'tr' ? 'Notlar' : 'Notes'} *</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                placeholder={language === 'tr' ? 'Ek notlar girin' : 'Enter any additional notes'}
                rows={4}
                maxLength={1000}
                title={`${t('maxCharacters')}: 1000`}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="file" className="form-label">
                {language === 'tr' ? 'Dosya Yükle' : 'Upload File'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  className="form-input"
                  accept=".docx"
                  required={!formData.title}
                  disabled={isSubmitting}
                  style={{
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
                  textAlign: 'center' as const,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%'
                }}>
                  <span style={{ fontSize: '16px', color: '#2563EB' }}>📄</span>
                  {selectedFile 
                    ? selectedFile.name 
                    : (language === 'tr' ? 'Dosya Seç (.docx)' : 'Choose File (.docx)')
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
                {language === 'tr' ? 'DOCX dosyası yükleyin' : 'Upload a DOCX file'}
              </small>
            </div>
            
            <div style={{ 
              display: 'flex',
              gap: 'var(--spacing-3)',
              marginTop: 'var(--spacing-6)'
            }}>
              <button 
                type="button" 
                onClick={() => navigate(`/entries/${entryId}/updates`)} 
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
                disabled={isSubmitting}
                style={{
                  flex: '2'
                }}
              >
                {isSubmitting 
                  ? (language === 'tr' ? 'Gönderiliyor...' : 'Submitting...') 
                  : (language === 'tr' ? 'Güncellemeyi Gönder' : 'Submit Update')}
              </button>
            </div>
          </form>
        </div>
      </div>

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

export default AuthorUpdateFormPage; 