import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Helper function to replace lodash.isEqual for array comparison
const arraysEqual = (a?: number[], b?: number[]): boolean => {
    if (a === b) return true;
    if (!a || !b) return !a && !b;
    if (a.length !== b.length) return false;
    
    // Compare each element
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

export interface JournalFormData {
    title: string;
    abstract_tr: string;
    abstract_en?: string;
    keywords?: string;
    article_type?: string;
    language?: string;
    journal_id?: number;
    authors_ids?: number[];
    referees_ids?: number[];
}

interface JournalFormProps {
    initialData?: JournalFormData;
    onSubmit: (data: JournalFormData) => Promise<void>;
    isSubmitting: boolean;
    submitError: string | null;
    submitButtonText?: string;
}

const JournalForm: React.FC<JournalFormProps> = ({
    initialData = { 
        title: '', 
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        article_type: '',
        language: ''
    },
    onSubmit,
    isSubmitting,
    submitError,
    submitButtonText = 'Submit Entry',
}) => {
    const [formData, setFormData] = useState<JournalFormData>(initialData);
    const { t } = useLanguage();

    useEffect(() => {
        const titleChanged = initialData.title !== formData.title;
        const abstractTrChanged = initialData.abstract_tr !== formData.abstract_tr;
        const abstractEnChanged = initialData.abstract_en !== formData.abstract_en;
        const keywordsChanged = initialData.keywords !== formData.keywords;
        const articleTypeChanged = initialData.article_type !== formData.article_type;
        const languageChanged = initialData.language !== formData.language;
        const journalIdChanged = initialData.journal_id !== formData.journal_id;
        const authorsIdsChanged = !arraysEqual(initialData.authors_ids, formData.authors_ids);
        const refereesIdsChanged = !arraysEqual(initialData.referees_ids, formData.referees_ids);

        if (titleChanged || abstractTrChanged || abstractEnChanged || 
            keywordsChanged || articleTypeChanged || languageChanged || 
            journalIdChanged || authorsIdsChanged || refereesIdsChanged) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            {submitError && <div className="error-message">{submitError}</div>}
            
            <div className="form-group">
                <label htmlFor="title" className="form-label">{t('title')}</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t('enterTitle')}
                    required
                    disabled={isSubmitting}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="abstract_tr" className="form-label">{t('abstractTurkish') || 'Abstract (Turkish)'}</label>
                <textarea
                    id="abstract_tr"
                    name="abstract_tr"
                    className="form-textarea"
                    value={formData.abstract_tr}
                    onChange={handleChange}
                    placeholder={t('enterAbstractTr') || 'Enter a brief summary in Turkish...'}
                    rows={3}
                    required
                    disabled={isSubmitting}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="abstract_en" className="form-label">{t('abstractEnglish') || 'Abstract (English)'}</label>
                <textarea
                    id="abstract_en"
                    name="abstract_en"
                    className="form-textarea"
                    value={formData.abstract_en || ''}
                    onChange={handleChange}
                    placeholder={t('enterAbstractEn') || 'Enter a brief summary in English...'}
                    rows={3}
                    disabled={isSubmitting}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="keywords" className="form-label">{t('keywords') || 'Keywords'}</label>
                <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    className="form-input"
                    value={formData.keywords || ''}
                    onChange={handleChange}
                    placeholder={t('enterKeywords') || 'Enter keywords, separated by commas...'}
                    disabled={isSubmitting}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="article_type" className="form-label">{t('articleType') || 'Article Type'}</label>
                <select
                    id="article_type"
                    name="article_type"
                    className="form-select"
                    value={formData.article_type || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                >
                    <option value="">{t('selectArticleType') || '-- Select Article Type --'}</option>
                    <option value="theory">{t('articleTypeTheory') || 'Theory'}</option>
                    <option value="research">{t('articleTypeResearch') || 'Research'}</option>
                </select>
            </div>
            
            <div className="form-group">
                <label htmlFor="language" className="form-label">{t('language') || 'Language'}</label>
                <select
                    id="language"
                    name="language"
                    className="form-select"
                    value={formData.language || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                >
                    <option value="">{t('selectLanguage') || '-- Select Language --'}</option>
                    <option value="tr">{t('turkish') || 'Turkish'}</option>
                    <option value="en">{t('english') || 'English'}</option>
                </select>
            </div>
            
            <div className="form-group" style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? t('saving') : submitButtonText}
                </button>
            </div>
        </form>
    );
};

export default JournalForm; 