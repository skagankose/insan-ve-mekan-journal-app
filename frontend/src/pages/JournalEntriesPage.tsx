import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const JournalEntriesPage: React.FC = () => {
    const { journalId } = useParams<{ journalId: string }>();
    const navigate = useNavigate();
    const [journal, setJournal] = useState<apiService.Journal | null>(null);
    const [entries, setEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchJournalAndEntries = async () => {
            if (!journalId) return;
            
            setLoading(true);
            setError(null);
            try {
                // Fetch both journal and its entries
                const [journalData, entriesData] = await Promise.all([
                    apiService.getPublishedJournals().then(journals => 
                        journals.find(j => j.id === parseInt(journalId))
                    ),
                    apiService.getPublishedJournalEntries(parseInt(journalId))
                ]);

                if (!journalData) {
                    throw new Error('Journal not found');
                }

                setJournal(journalData);
                setEntries(entriesData);
            } catch (err: any) {
                console.error("Failed to fetch journal data:", err);
                setError(err.response?.data?.detail || t('failedToLoadJournalData') || 'Failed to load journal data.');
            } finally {
                setLoading(false);
            }
        };

        fetchJournalAndEntries();
    }, [journalId, t]);

    if (loading) {
        return <div className="loading">{t('loadingJournalData') || 'Loading journal data...'}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!journal) {
        return <div className="error-message">{t('journalNotFound') || 'Journal not found.'}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <button 
                    onClick={() => navigate('/archive')} 
                    className="btn btn-outline back-button"
                >
                    ← {t('backToArchive') || 'Back to Archive'}
                </button>
                <h1 className="page-title">{journal.title}</h1>
                <div className="journal-meta">
                    <p>{t('issue')}: {journal.issue}</p>
                    <p>{t('publicationDate')}: {journal.publication_date ? new Date(journal.publication_date).toLocaleDateString() : t('notAvailable') || 'N/A'}</p>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>{t('noEntriesInJournal') || 'No entries found in this journal.'}</h3>
                </div>
            ) : (
                <div className="entries-list">
                    {entries.map(entry => (
                        <div key={entry.id} className="entry-card" 
                            onClick={() => navigate(`/entries/${entry.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <h3 className="entry-title">{entry.title}</h3>
                            <p className="entry-abstract">{entry.abstract_tr}</p>
                            <div className="entry-meta">
                                <span className="entry-date">
                                    {t('date') || 'Date'}: {entry.publication_date ? new Date(entry.publication_date).toLocaleString() : '-'}
                                </span>
                                {entry.status && (
                                    <span className="entry-status">
                                        <span className={`badge badge-${entry.status.toLowerCase()}`}>
                                            {t(entry.status) || entry.status}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JournalEntriesPage; 