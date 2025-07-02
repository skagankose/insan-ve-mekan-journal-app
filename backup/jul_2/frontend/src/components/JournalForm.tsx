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
    title_en: string;
    abstract_tr: string;
    abstract_en?: string;
    keywords?: string;
    keywords_en?: string;
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
        title_en: '',
        abstract_tr: '',
        abstract_en: '',
        keywords: '',
        keywords_en: ''
    },
    onSubmit,
    isSubmitting,
    submitError,
    submitButtonText,
}) => {
    const [formData, setFormData] = useState<JournalFormData>(initialData);
    const { t } = useLanguage();

    // Use translation for default submit button text
    const defaultSubmitText = submitButtonText || t('submitEntry') || 'Submit Entry';

    useEffect(() => {
        const titleChanged = initialData.title !== formData.title;
        const titleEnChanged = initialData.title_en !== formData.title_en;
        const abstractTrChanged = initialData.abstract_tr !== formData.abstract_tr;
        const abstractEnChanged = initialData.abstract_en !== formData.abstract_en;
        const keywordsChanged = initialData.keywords !== formData.keywords;
        const keywordsEnChanged = initialData.keywords_en !== formData.keywords_en;
        const journalIdChanged = initialData.journal_id !== formData.journal_id;
        const authorsIdsChanged = !arraysEqual(initialData.authors_ids, formData.authors_ids);
        const refereesIdsChanged = !arraysEqual(initialData.referees_ids, formData.referees_ids);

        if (titleChanged || titleEnChanged || abstractTrChanged || abstractEnChanged || 
            keywordsChanged || keywordsEnChanged || 
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
        <form onSubmit={handleSubmit} className="register-form">
            {submitError && <div className="error-message">{submitError}</div>}
            
            <div className="form-group">
                <label htmlFor="title" className="form-label">{t('entryTitle') || 'Title'}</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t('enterEntryTitle') || 'Enter title'}
                    required
                    disabled={isSubmitting}
                    maxLength={300}
                    title={`${t('maxCharacters')}: 300`}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="title_en" className="form-label">{t('entryTitleEn') || 'Title (English)'}</label>
                <input
                    type="text"
                    id="title_en"
                    name="title_en"
                    className="form-input"
                    value={formData.title_en || ''}
                    onChange={handleChange}
                    placeholder={t('enterEntryTitleEn') || 'Enter title in English'}
                    disabled={isSubmitting}
                    maxLength={300}
                    title={`${t('maxCharacters')}: 300`}
                    required
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
                    placeholder={t('enterAbstractTurkish') || 'Enter a brief summary in Turkish...'}
                    rows={3}
                    required
                    disabled={isSubmitting}
                    maxLength={500}
                    title={`${t('maxCharacters')}: 500`}
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
                    placeholder={t('enterAbstractEnglish') || 'Enter a brief summary in English...'}
                    rows={3}
                    disabled={isSubmitting}
                    maxLength={1000}
                    title={`${t('maxCharacters')}: 1000`}
                    required
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
                    placeholder={t('enterKeywordsComma') || 'Enter keywords, separated by commas...'}
                    disabled={isSubmitting}
                    maxLength={100}
                    title={`${t('maxCharacters')}: 100`}
                    required
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="keywords_en" className="form-label">{t('keywordsEn') || 'Keywords (English)'}</label>
                <input
                    type="text"
                    id="keywords_en"
                    name="keywords_en"
                    className="form-input"
                    value={formData.keywords_en || ''}
                    onChange={handleChange}
                    placeholder={t('keywordsSeparatedByCommasEn') || 'Separate English keywords with commas'}
                    disabled={isSubmitting}
                    maxLength={100}
                    title={`${t('maxCharacters')}: 100`}
                    required
                />
            </div>
            
            <button 
                type="submit" 
                className="register-submit-button" 
                disabled={isSubmitting}
                style={{ marginTop: '20px' }}
            >
                {isSubmitting ? (t('saving') || 'Saving...') : defaultSubmitText}
            </button>
        </form>
    );
};

export default JournalForm; 