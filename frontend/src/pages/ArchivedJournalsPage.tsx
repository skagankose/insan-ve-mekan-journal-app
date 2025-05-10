import React, { useState, useEffect } from 'react';
import apiService, { JournalEntryRead, Journal } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

// Extended interface to include entries, expansion state, and loading state
interface ArchivedJournalWithEntries extends Journal {
    entries: JournalEntryRead[];
    isExpanded: boolean;
    isLoadingEntries: boolean; // Renamed from isLoading to be more specific
}

const ArchivedJournalsPage: React.FC = () => {
    const [archivedJournals, setArchivedJournals] = useState<ArchivedJournalWithEntries[]>([]);
    const [loadingJournals, setLoadingJournals] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchPublishedJournals = async () => {
            setLoadingJournals(true);
            setError(null);
            try {
                // Use the public endpoint instead
                const fetchedJournals = await apiService.getPublishedJournals();
                
                const sortedJournals = [...fetchedJournals].sort((a, b) => 
                    new Date(b.publication_date || b.date).getTime() - new Date(a.publication_date || a.date).getTime()
                );
                
                const journalsData = sortedJournals.map(journal => ({
                    ...journal,
                    entries: [],
                    isExpanded: false,
                    isLoadingEntries: false
                }));
                setArchivedJournals(journalsData);
            } catch (err: any) {
                console.error("Failed to fetch published journals:", err);
                setError(err.response?.data?.detail || t('failedToLoadPublishedJournals') || 'Failed to load published journals.');
            } finally {
                setLoadingJournals(false);
            }
        };

        fetchPublishedJournals();
    }, [t]);

    const toggleJournalExpansion = (journalId: number) => {
        setArchivedJournals(prevJournals => 
            prevJournals.map(journal => {
                if (journal.id === journalId) {
                    // If expanding and no entries yet (or they might need a refresh if status can change)
                    // For archive, we assume completed entries don't change often once published.
                    if (!journal.isExpanded && journal.entries.length === 0) { 
                        loadCompletedEntries(journalId);
                    }
                    return { ...journal, isExpanded: !journal.isExpanded };
                }
                return journal;
            })
        );
    };

    const loadCompletedEntries = async (journalId: number) => {
        setArchivedJournals(prevJournals =>
            prevJournals.map(journal =>
                journal.id === journalId ? { ...journal, isLoadingEntries: true } : journal
            )
        );

        try {
            // Use the public endpoint for entries
            const completedEntries = await apiService.getPublishedJournalEntries(journalId);
            
            setArchivedJournals(prevJournals =>
                prevJournals.map(journal =>
                    journal.id === journalId 
                        ? { ...journal, entries: completedEntries, isLoadingEntries: false }
                        : journal
                )
            );
        } catch (err) {
            console.error(`Failed to load completed entries for journal ${journalId}:`, err);
            setError(t('failedToLoadCompletedEntries') || 'Failed to load completed entries.');
            setArchivedJournals(prevJournals =>
                prevJournals.map(journal =>
                    journal.id === journalId ? { ...journal, isLoadingEntries: false } : journal
                )
            );
        }
    };

    if (loadingJournals) {
        return <div className="loading">{t('loadingPublishedJournals') || 'Loading published journals...'}</div>;
    }
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('publishedJournals')}</h1>
            </div>

            {archivedJournals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🗄️</div>
                    <h3>{t('noPublishedJournals') || 'No published journals found.'}</h3>
                </div>
            ) : (
                <div className="journals-list">
                    {archivedJournals.map((journal) => (
                        <div key={journal.id} className="journal-section">
                            <div className="journal-card">
                                <div className="journal-header" onClick={() => toggleJournalExpansion(journal.id)}>
                                    <div>
                                        <h3>
                                            {journal.title} 
                                            <span className="journal-expand-icon">
                                                {journal.isExpanded ? '▼' : '►'}
                                            </span>
                                        </h3>
                                        <p>{t('issue')}: {journal.issue}</p>
                                        <p>{t('publicationDate')}: {journal.publication_date ? new Date(journal.publication_date).toLocaleDateString() : t('notAvailable') || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                {journal.isExpanded && (
                                    <div className="journal-entries-section">
                                        <h4>{t('completedEntries')}</h4>
                                        {journal.isLoadingEntries ? (
                                            <div className="loading-small">{t('loadingEntries') || 'Loading entries...'}</div>
                                        ) : journal.entries.length === 0 ? (
                                            <div className="no-entries-message">
                                                <p>{t('noCompletedEntries') || 'No completed entries in this journal.'}</p>
                                            </div>
                                        ) : (
                                            <div className="entries-list">
                                                {journal.entries.map(entry => (
                                                    <div key={entry.id} className="entry-item">
                                                        <h5>{entry.title}</h5>
                                                        <p className="entry-abstract">{entry.abstract}</p>
                                                        <div className="entry-date">
                                                            {t('completedOn') || 'Completed on'}: {new Date(entry.updated_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArchivedJournalsPage; 