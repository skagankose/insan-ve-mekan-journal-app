import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface JournalFormData {
    title: string;
    content: string;
    abstract: string;
    file_path: string;
    status: string;
}

interface JournalFormProps {
    initialData?: JournalFormData; // Optional: for editing existing entries
    onSubmit: (data: JournalFormData) => Promise<void>; // Function to handle submission (create or update)
    isSubmitting: boolean; // To disable button during submission
    submitError: string | null; // To display submission errors
    submitButtonText?: string; // e.g., "Create Entry" or "Update Entry"
}

const JournalForm: React.FC<JournalFormProps> = ({
    initialData = { 
        title: '', 
        content: '', 
        abstract: '',
        file_path: '',
        status: '' // Default status, consider a more appropriate default from your enum if necessary
    }, // Default for new entry
    onSubmit,
    isSubmitting,
    submitError,
    submitButtonText = 'Submit Entry',
}) => {
    const [formData, setFormData] = useState<JournalFormData>(initialData);
    const { t } = useLanguage();

    // Update form if initialData changes (e.g., when switching to edit mode)
    // Only update if the incoming initialData values are actually different 
    // from the current formData to avoid unnecessary resets and input clearing issues.
    useEffect(() => {
        const titleChanged = initialData.title !== formData.title;
        const contentChanged = initialData.content !== formData.content;
        const abstractChanged = initialData.abstract !== formData.abstract;
        const filePathChanged = initialData.file_path !== formData.file_path;
        const statusChanged = initialData.status !== formData.status;

        if (titleChanged || contentChanged || abstractChanged || filePathChanged || statusChanged) {
            // Only update state if the initialData values are different from current form state
            setFormData(initialData);
        }
        // Depend on the specific values from initialData, not the object reference itself.
        // This prevents the effect from running if the parent re-renders and passes a 
        // new initialData object reference with the same content.
    }, [initialData.title, initialData.content, initialData.abstract, initialData.file_path, initialData.status]);

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
                <label htmlFor="abstract" className="form-label">{t('abstract') || 'Abstract'}</label>
                <textarea
                    id="abstract"
                    name="abstract"
                    className="form-textarea"
                    value={formData.abstract}
                    onChange={handleChange}
                    placeholder={t('enterAbstract') || 'Enter a brief summary...'}
                    rows={3}
                    required
                    disabled={isSubmitting}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="content" className="form-label">{t('content')}</label>
                <textarea
                    id="content"
                    name="content"
                    className="form-textarea"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder={t('writeThoughts')}
                    rows={12}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="form-group">
                <label htmlFor="file_path" className="form-label">{t('filePath') || 'File Path'}</label>
                <input
                    type="text"
                    id="file_path"
                    name="file_path"
                    className="form-input"
                    value={formData.file_path}
                    onChange={handleChange}
                    placeholder={t('enterFilePath') || 'Enter file path'}
                    disabled={isSubmitting}
                />
            </div>

            <div className="form-group">
                <label htmlFor="status" className="form-label">{t('status') || 'Status'}</label>
                <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                >
                    <option value="">{t('selectStatus') || '-- Select Status --'}</option>
                    <option value="waiting_for_payment">{t('statusWaitingForPayment') || 'Waiting for Payment'}</option>
                    <option value="waiting_for_writer">{t('statusWaitingForWriter') || 'Waiting for Writer'}</option>
                    <option value="waiting_for_arbitrator">{t('statusWaitingForArbitrator') || 'Waiting for Arbitrator'}</option>
                    <option value="waiting_for_editor">{t('statusWaitingForEditor') || 'Waiting for Editor'}</option>
                    <option value="completed">{t('statusCompleted') || 'Completed'}</option>
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