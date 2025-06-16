import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios, { AxiosError } from 'axios';

const AuthorUpdateFormPage: React.FC = () => {
  const { t } = useLanguage();
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchEntryData = async () => {
      if (!entryId) {
        toast.error(t('entryIdNotFound') || 'Entry ID not found');
        return;
      }
      
      try {
        setIsLoading(true);
        const entryData = await apiService.getEntryById(parseInt(entryId));
        
        // Pre-fill form data with entry information
        setFormData({
          title: entryData.title || '',
          abstract_en: entryData.abstract_en || '',
          abstract_tr: entryData.abstract_tr || '',
          keywords: entryData.keywords || '',
          keywords_en: entryData.keywords_en || '',
          notes: '', // Keep notes empty as requested
        });
      } catch (error) {
        console.error('Error fetching entry data:', error);
        toast.error(t('errorFetchingEntry') || 'Error fetching entry data');
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
      if (!file.name.toLowerCase().endsWith('.docx')) {
        toast.error(t('onlyDocxAllowed') || 'Only .docx files are allowed');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entryId) {
      toast.error(t('entryIdNotFound') || 'Entry ID not found');
      return;
    }
    
    // Make sure at least one field is filled or a file is selected
    const hasAnyContent = formData.title || formData.abstract_en || formData.abstract_tr || 
                         formData.keywords || formData.keywords_en || formData.notes || selectedFile;
    
    if (!hasAnyContent) {
      toast.error(t('pleaseCompleteAtLeastOneField') || 'Please complete at least one field');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const uploadData = new FormData();
      
      // Add form fields to FormData - ensure all fields including keywords_en are included
      Object.entries(formData).forEach(([key, value]) => {
        if (value) { // Only append non-empty values
          uploadData.append(key, value);
          // console.log(`Added to FormData: ${key} = "${value}"`);
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        uploadData.append('file', selectedFile);
      }
      
      // Debug: Log all FormData entries
      // console.log('FormData contents:');
      // for (let [key, value] of uploadData.entries()) {
      //   console.log(`${key}: ${value}`);
      // }
      
      // First, create the author update
      // console.log('Submitting author update with data:', formData, 'keywords_en:', formData.keywords_en, 'and file:', selectedFile?.name);
      await apiService.createAuthorUpdateWithFile(parseInt(entryId), uploadData);
      
      // Then, update the entry itself with the same information
      const entryUpdateData = {
        title: formData.title || undefined,
        abstract_en: formData.abstract_en || undefined,
        abstract_tr: formData.abstract_tr || undefined,
        keywords: formData.keywords || undefined,
        keywords_en: formData.keywords_en || undefined,
      };
      
      // Only include fields that have values to avoid overwriting with empty strings
      const filteredEntryUpdateData = Object.fromEntries(
        Object.entries(entryUpdateData).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      // console.log('Entry update data includes keywords_en:', filteredEntryUpdateData.keywords_en);
      
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
      
      toast.success(t('authorUpdateSubmitted') || 'Author update submitted successfully');
      navigate(`/entries/${entryId}/updates`);
    } catch (error: unknown) {
      console.error('Error submitting author update:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      toast.error(t('errorSubmittingUpdate') || 'Error submitting update');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <>
        <div className="page-title-section">
          <h1 style={{textAlign: 'center'}}>{t('addAuthorUpdate') || 'Add Author Update'}</h1>
        </div>
        <div className="page-content-section">
          <div className="loading">{t('loading') || 'Loading...'}</div>
        </div>
      </>
    );
  }
  
  return (
    <>
      {/* Title Section */}
      <div className="page-title-section">
        <h1 style={{textAlign: 'center'}}>{t('addAuthorUpdate') || 'Add Author Update'}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section">
        <div className="register-form-container">
          <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="title" className="form-label">{t('title') || 'Title'} *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder={t('enterTitle') || 'Enter title'}
                required
                maxLength={300}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="abstract_tr" className="form-label">{t('abstractTr') || 'Abstract (Turkish)'}</label>
              <textarea
                id="abstract_tr"
                name="abstract_tr"
                value={formData.abstract_tr}
                onChange={handleChange}
                className="form-textarea"
                placeholder={t('enterAbstractTr') || 'Enter abstract in Turkish'}
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="abstract_en" className="form-label">{t('abstractEn') || 'Abstract (English)'}</label>
              <textarea
                id="abstract_en"
                name="abstract_en"
                value={formData.abstract_en}
                onChange={handleChange}
                className="form-textarea"
                placeholder={t('enterAbstractEn') || 'Enter abstract in English'}
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords" className="form-label">{t('keywords') || 'Keywords (Turkish)'}</label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                className="form-input"
                placeholder={t('keywordsSeparatedByCommas') || 'Separate keywords with commas'}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords_en" className="form-label">{t('keywordsEn') || 'Keywords (English)'}</label>
              <input
                type="text"
                id="keywords_en"
                name="keywords_en"
                value={formData.keywords_en}
                onChange={handleChange}
                className="form-input"
                placeholder={t('keywordsSeparatedByCommasEn') || 'Separate English keywords with commas'}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes" className="form-label">{t('notes') || 'Notes'}</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                placeholder={t('enterNotes') || 'Enter any additional notes'}
                rows={4}
                maxLength={1000}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="file" className="form-label">{t('fileUpload') || 'Upload File'} *</label>
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
                  padding: '12px 16px',
                  border: '2px dashed #E2E8F0',
                  borderRadius: '12px',
                  background: 'rgba(249, 250, 251, 0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
              <small style={{ 
                display: 'block', 
                marginTop: '8px', 
                color: '#64748B', 
                fontSize: '0.875rem' 
              }}>
                {t('uploadFileDescription') || 'Upload a .docx file'}
              </small>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginTop: '32px',
              flexDirection: 'column'
            }}>
              <button 
                type="submit" 
                className="register-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (t('submitting') || 'Submitting...') 
                  : (t('submitUpdate') || 'Submit Update')}
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate(`/entries/${entryId}/updates`)} 
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'transparent',
                  color: '#64748B',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.025em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#94A3B8';
                  e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AuthorUpdateFormPage; 