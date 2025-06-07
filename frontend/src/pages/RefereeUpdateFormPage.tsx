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
    <>
      {/* Title Section */}
      <div className="page-title-section">
        <h1 style={{textAlign: 'center'}}>{t('addRefereeUpdate') || 'Add Referee Update'}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section">
        <div className="register-form-container">
          <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="notes" className="form-label">{t('notes') || 'Notes'}</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                placeholder={t('enterNotes') || 'Enter your review notes and feedback'}
                rows={6}
                maxLength={1000}
                disabled={isSubmitting}
              />
              <small style={{ 
                display: 'block', 
                marginTop: '8px', 
                color: '#64748B', 
                fontSize: '0.875rem' 
              }}>
                {t('reviewNotesDescription') || 'Provide detailed feedback and review comments for the authors'}
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="file" className="form-label">{t('fileUpload') || 'Upload File'}</label>
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleFileChange}
                className="form-input"
                accept=".docx"
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
                {t('uploadFileDescription') || 'Upload a .docx file with detailed review comments (optional)'}
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
                  : (t('submitUpdate') || 'Submit Review')}
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

export default RefereeUpdateFormPage; 