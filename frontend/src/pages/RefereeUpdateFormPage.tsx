import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import { toast } from 'react-toastify';

const RefereeUpdateFormPage: React.FC = () => {
  const { t } = useLanguage();
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    notes: '',
    file_path: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entryId) {
      toast.error(t('entryIdNotFound') || 'Entry ID not found');
      return;
    }
    
    if (!formData.notes && !formData.file_path) {
        toast.error(t('pleaseProvideNotesOrFile') || 'Please provide either notes or a file reference.');
        return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData = {
        notes: formData.notes,
        file_path: formData.file_path,
      };
      
      await apiService.createRefereeUpdate(parseInt(entryId), updateData);
      toast.success(t('refereeUpdateSubmitted') || 'Referee update submitted successfully');
      navigate(`/entries/${entryId}/updates`);
    } catch (error) {
      console.error('Error submitting referee update:', error);
      toast.error(t('errorSubmittingUpdate') || 'Error submitting update');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="form-container">
      <h1>{t('addRefereeUpdate') || 'Add Referee Update'}</h1>
      
      <form onSubmit={handleSubmit} className="update-form">
        <div className="form-group">
          <label htmlFor="notes">{t('notes') || 'Notes'}</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-control"
            rows={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="file_path">{t('fileReference') || 'File Reference'}</label>
          <input
            type="text"
            id="file_path"
            name="file_path"
            value={formData.file_path}
            onChange={handleChange}
            className="form-control"
            placeholder={t('enterFilePathOrURL') || 'Enter file path or URL'}
          />
          <small className="text-muted">
            {t('provideFileReference') || 'Provide a reference (e.g., filename, URL, DOI) to your review file.'}
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

export default RefereeUpdateFormPage; 