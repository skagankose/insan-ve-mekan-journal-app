import React, { useState } from 'react';
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
    file_path: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entryId) {
      toast.error(t('entryIdNotFound') || 'Entry ID not found');
      return;
    }
    
    // Make sure at least one field is filled
    if (!formData.title && !formData.abstract_en && !formData.abstract_tr && 
        !formData.keywords && !formData.notes && !formData.file_path) {
      toast.error(t('pleaseCompleteAtLeastOneField') || 'Please complete at least one field');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting author update with data:', formData);
      await apiService.createAuthorUpdate(parseInt(entryId), formData);
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
  
  return (
    <div className="form-container">
      <h1>{t('addAuthorUpdate') || 'Add Author Update'}</h1>
      
      <form onSubmit={handleSubmit} className="update-form">
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
          <label htmlFor="file_path">{t('filePath') || 'File Reference'} *</label>
          <input
            type="text"
            id="file_path"
            name="file_path"
            value={formData.file_path}
            onChange={handleChange}
            className="form-control"
            placeholder={t('enterFilePath') || 'Enter file path or URL'}
            required
          />
          <small className="text-muted">
            {t('enterFileReference') || 'Enter a reference to your file (URL, DOI, or file name)'}
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