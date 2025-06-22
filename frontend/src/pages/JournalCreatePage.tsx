import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import JournalForm, { JournalFormData } from '../components/JournalForm';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';

const JournalCreatePage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();
    const { activeJournal } = useActiveJournal();

    const initialFormData = useMemo(() => ({
        title: '', 
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        keywords_en: '',
        authors_ids: [],
        referees_ids: []
    }), []);

    const handleCreateSubmit = useCallback(async (formData: JournalFormData) => {
        if (!isAuthenticated) {
            setSubmitError(t('mustBeLoggedIn') || "You must be logged in to create an entry.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const submitData: apiService.JournalEntryCreate = {
                title: formData.title,
                abstract_tr: formData.abstract_tr,
                abstract_en: formData.abstract_en,
                keywords: formData.keywords,
                keywords_en: formData.keywords_en,
                authors_ids: formData.authors_ids || [],
                referees_ids: formData.referees_ids || [],
                status: 'waiting_for_payment'
            };
            
            if (activeJournal) {
                submitData.journal_id = activeJournal.id;
            }
            
            if (user && (!submitData.authors_ids || !submitData.authors_ids.includes(user.id))) {
                submitData.authors_ids = [...(submitData.authors_ids || []), user.id];
            }
            
            const createdEntry = await apiService.createEntry(submitData);
            navigate(`/entries/${createdEntry.id}?created=true`);
        } catch (err: any) {
            console.error("Failed to create entry:", err);
            setSubmitError(err.response?.data?.detail || t('failedToCreateEntry') || "Failed to create entry.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isAuthenticated, navigate, activeJournal, user, t]);

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px', paddingRight: '30px' }}>
                <h1>{t('createNewJournalEntry') || 'Create New Journal Entry'}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section">
                {!activeJournal && (
                    <div style={{
                        backgroundColor: 'rgba(255, 243, 205, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px',
                        boxShadow: '0 4px 12px rgba(255, 193, 7, 0.1)',
                        maxWidth: '800px',
                        margin: '0 auto 30px auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                        }}>
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                            <h4 style={{ 
                                margin: 0, 
                                color: '#856404',
                                fontSize: '16px',
                                fontWeight: '600'
                            }}>
                                {t('noActiveJournalSelected') || 'No Active Journal Selected'}
                            </h4>
                        </div>
                        <p style={{ 
                            margin: 0, 
                            color: '#856404',
                            lineHeight: '1.5'
                        }}>
                            {t('noActiveJournalMessage') || 'No active journal selected. '}
                            <Link 
                                to="/journals" 
                                style={{ 
                                    color: '#0D9488',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    borderBottom: '1px solid #0D9488'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#14B8A6';
                                    e.currentTarget.style.borderBottomColor = '#14B8A6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#0D9488';
                                    e.currentTarget.style.borderBottomColor = '#0D9488';
                                }}
                            >
                                {t('selectAJournal') || 'Select a journal'}
                            </Link>
                            {' '}{t('toAssociateWithEntry') || 'to associate with this entry.'}
                        </p>
                    </div>
                )}
                
                <div className="register-form-container">
                    <JournalForm
                        initialData={initialFormData}
                        onSubmit={handleCreateSubmit}
                        isSubmitting={isSubmitting}
                        submitError={submitError}
                        submitButtonText={t('createEntry') || 'Create Entry'}
                    />
                </div>
                
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '24px',
                    marginBottom: '40px'
                }}>
                    <p style={{
                        color: '#64748B',
                        fontSize: '14px',
                        fontStyle: 'italic',
                        margin: 0,
                        opacity: 0.8
                    }}>
                        {t('entrySavedSecurelyMessage') || 'Your entry will be saved securely and reviewed by our editorial team'}
                    </p>
                </div>
            </div>
        </>
    );
};

export default JournalCreatePage; 