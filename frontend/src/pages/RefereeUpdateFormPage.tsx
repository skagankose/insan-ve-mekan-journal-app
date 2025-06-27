import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import 'react-toastify/dist/ReactToastify.css';
import axios, { AxiosError } from 'axios';
import './JournalEntryDetailsPage.css';

const RefereeUpdateFormPage: React.FC = () => {
  const { language } = useLanguage();
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    notes: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast notification state
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
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
    
    // Make sure notes are provided (now required)
    if (!formData.notes) {
      setToastMessage(language === 'tr' ? 'Değerlendirme notları alanı zorunludur.' : 'Review notes field is required.');
      setToastType('warning');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
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
      navigate(`/entries/${entryId}/updates?refereeUpdated=true`);
    } catch (error: unknown) {
      console.error('Error submitting referee update:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      setToastMessage(language === 'tr' ? 'Değerlendirme gönderilirken hata oluştu' : 'Error submitting update');
      setToastType('warning');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {/* Title Section */}
      <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
        <h1>{language === 'tr' ? 'Hakem Değerlendirmesi Ekle' : 'Add Referee Update'}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section">
        <div className="register-form-container" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="notes" className="form-label">{language === 'tr' ? 'Değerlendirme Notları' : 'Review Notes'} *</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                placeholder={language === 'tr' ? 'Değerlendirme notlarınız ve geri bildirimlerinizi girin' : 'Enter your review notes and feedback'}
                rows={6}
                maxLength={1000}
                disabled={isSubmitting}
                required
              />
              <small style={{ 
                color: 'var(--color-text-tertiary)', 
                fontSize: '0.8rem',
                fontStyle: 'italic',
                marginTop: 'var(--spacing-1)',
                display: 'block'
              }}>
                {language === 'tr' ? 'Yazarlar için detaylı geri bildirim ve değerlendirme yorumları sağlayın' : 'Provide detailed feedback and review comments for the authors'}
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="file" className="form-label">
                {language === 'tr' ? 'Dosya Yükle (Opsiyonel)' : 'Upload File (Optional)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  className="form-input"
                  accept=".docx"
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
                {language === 'tr' ? 'Detaylı değerlendirme yorumları içeren DOCX dosyası yükleyin (opsiyonel)' : 'Upload a DOCX file with detailed review comments (optional)'}
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
                  : (language === 'tr' ? 'Değerlendirmeyi Gönder' : 'Submit Review')}
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

export default RefereeUpdateFormPage; 