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
    if (!formData.title && !formData.abstract_en && !formData.abstract_tr && 
        !formData.keywords && !formData.notes && !selectedFile) {
      toast.error(t('pleaseCompleteAtLeastOneField') || 'Please complete at least one field');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const uploadData = new FormData();
      
      // Add form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        uploadData.append(key, value);
      });
      
      // Add file if selected
      if (selectedFile) {
        uploadData.append('file', selectedFile);
      }
      
      // First, create the author update
      console.log('Submitting author update with data:', formData, 'and file:', selectedFile?.name);
      await apiService.createAuthorUpdateWithFile(parseInt(entryId), uploadData);
      
      // Then, update the entry itself with the same information
      const entryUpdateData = {
        title: formData.title || undefined,
        abstract_en: formData.abstract_en || undefined,
        abstract_tr: formData.abstract_tr || undefined,
        keywords: formData.keywords || undefined,
      };
      
      // Only include fields that have values to avoid overwriting with empty strings
      const filteredEntryUpdateData = Object.fromEntries(
        Object.entries(entryUpdateData).filter(([_, value]) => value !== undefined)
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
    return <div className="loading">{t('loading') || 'Loading...'}</div>;
  }
  
  return (
    <div className="form-container">
      <h1>{t('addAuthorUpdate') || 'Add Author Update'}</h1>
      
      <form onSubmit={handleSubmit} className="update-form" encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="title">{t('title') || 'Title'} *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="abstract_tr">{t('abstractTr') || 'Abstract (Turkish)'}</label>
          <textarea
            id="abstract_tr"
            name="abstract_tr"
            value={formData.abstract_tr}
            onChange={handleChange}
            className="form-control"
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="abstract_en">{t('abstractEn') || 'Abstract (English)'}</label>
          <textarea
            id="abstract_en"
            name="abstract_en"
            value={formData.abstract_en}
            onChange={handleChange}
            className="form-control"
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="keywords">{t('keywords') || 'Keywords'}</label>
          <input
            type="text"
            id="keywords"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            className="form-control"
            placeholder={t('keywordsSeparatedByCommas') || 'Separate keywords with commas'}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">{t('notes') || 'Notes'}</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-control"
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="file">{t('fileUpload') || 'Upload File'} *</label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            className="form-control"
            accept=".docx"
            required={!formData.title}
          />
          <small className="text-muted">
            {t('uploadFileDescription') || 'Upload a .docx file'}
          </small>
        </div>
        
        <div className="form-buttons">
          <button 
            type="button" 
            onClick={() => navigate(`/entries/${entryId}/updates`)} 
            className="cancel-button"
            disabled={isSubmitting}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (t('submitting') || 'Submitting...') 
              : (t('submitUpdate') || 'Submit Update')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthorUpdateFormPage; 