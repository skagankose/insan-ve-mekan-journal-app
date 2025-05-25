import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios, { AxiosError } from 'axios';

const RefereeUpdateFormPage: React.FC = () => {
  const { t } = useLanguage();
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    notes: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    if (!formData.notes && !selectedFile) {
      toast.error(t('pleaseProvideNotesOrFile') || 'Please provide either notes or a file.');
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
      
      await apiService.createRefereeUpdateWithFile(parseInt(entryId), uploadData);
      toast.success(t('refereeUpdateSubmitted') || 'Referee update submitted successfully');
      navigate(`/entries/${entryId}/updates`);
    } catch (error: unknown) {
      console.error('Error submitting referee update:', error);
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
      <h1>{t('addRefereeUpdate') || 'Add Referee Update'}</h1>
      
      <form onSubmit={handleSubmit} className="update-form" encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="notes">{t('notes') || 'Notes'}</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-control"
            rows={6}
            maxLength={1000}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="file">{t('fileUpload') || 'Upload File'}</label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            className="form-control"
            accept=".docx"
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

export default RefereeUpdateFormPage; 