import React, { useState, useEffect } from 'react';
import apiService, { JournalEntryRead } from '../services/apiService';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';
import { Journal } from '../services/apiService';

interface JournalWithEntries extends Journal {
    entries: JournalEntryRead[];
    isExpanded: boolean;
    isLoading: boolean;
}

const JournalsPage: React.FC = () => {
    const [journalsWithEntries, setJournalsWithEntries] = useState<JournalWithEntries[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { t } = useLanguage();
    const { activeJournal, setActiveJournal } = useActiveJournal();

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            const fetchJournals = async () => {
                setLoading(true);
                setError(null);
                try {
                    const fetchedJournals = await apiService.getJournals();
                    // Sort journals by date in descending order (newest first)
                    const sortedJournals = [...fetchedJournals].sort((a, b) => 
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    // Initialize journals with empty entries array and collapsed state
                    const journalsData = sortedJournals.map(journal => ({
                        ...journal,
                        entries: [],
                        isExpanded: false,
                        isLoading: false
                    }));
                    setJournalsWithEntries(journalsData);
                } catch (err: any) {
                    console.error("Failed to fetch journals:", err);
                    if (err.response?.status === 401) {
                        setError("Authentication error. Please log in again.");
                    } else {
                        setError('Failed to load journals.');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchJournals();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
            setJournalsWithEntries([]);
        }
    }, [isAuthenticated, authLoading]);

    const handleSetActive = async (journal: Journal) => {
            try {
                // Update settings in the backend
                await apiService.updateSettings({ active_journal_id: journal.id });
                // Update local state
                setActiveJournal(journal);
            } catch (err: any) {
                console.error("Failed to set active journal:", err);
                // Optionally show an error message to the user
                setError(err.response?.data?.detail || 'Failed to set active journal.');
            }
    };

    const toggleJournalExpansion = async (journalId: number) => {
        setJournalsWithEntries(prevJournals => {
            return prevJournals.map(journal => {
                if (journal.id === journalId) {
                    // If we're expanding and there are no entries yet, we'll load them
                    if (!journal.isExpanded && journal.entries.length === 0) {
                        loadJournalEntries(journalId);
                    }
                    return {
                        ...journal,
                        isExpanded: !journal.isExpanded
                    };
                }
                return journal;
            });
        });
    };

    const loadJournalEntries = async (journalId: number) => {
        // Set loading state for this journal
        setJournalsWithEntries(prevJournals => {
            return prevJournals.map(journal => {
                if (journal.id === journalId) {
                    return {
                        ...journal,
                        isLoading: true
                    };
                }
                return journal;
            });
        });

        try {
            const entries = await apiService.getEntriesByJournal(journalId);
            
            // Update the journal with entries
            setJournalsWithEntries(prevJournals => {
                return prevJournals.map(journal => {
                    if (journal.id === journalId) {
                        return {
                            ...journal,
                            entries,
                            isLoading: false
                        };
                    }
                    return journal;
                });
            });
        } catch (err) {
            console.error(`Failed to load entries for journal ${journalId}:`, err);
            
            // Update loading state even if there's an error
            setJournalsWithEntries(prevJournals => {
                return prevJournals.map(journal => {
                    if (journal.id === journalId) {
                        return {
                            ...journal,
                            isLoading: false
                        };
                    }
                    return journal;
                });
            });
        }
    };

    // Loading state
    if (authLoading || loading) {
        return <div className="loading">{t('loadingJournals')}</div>;
    }
    
    // Not authenticated state
    if (!isAuthenticated) {
        return (
            <div className="card">
                <p>{t('pleaseLogin')} <Link to="/login">{t('loginText')}</Link></p>
            </div>
        );
    }

    // Error state
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('journals')}</h1>
                {user && (
                    <Link to="/journals/new" className="btn btn-primary">
                        {t('createNewJournal') || 'Create New Journal'}
                    </Link>
                )}
            </div>

            {journalsWithEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>{t('noJournals')}</h3>
                </div>
            ) : (
                <div className="journals-list">
                    {journalsWithEntries.map((journal) => (
                        <div key={journal.id} className="journal-section">
                            <div 
                                className={`journal-card ${activeJournal?.id === journal.id ? 'active-journal' : ''}`}
                            >
                                <div className="journal-header" onClick={() => toggleJournalExpansion(journal.id)}>
                                    <div>
                                        <h3>
                                            {journal.title} 
                                            <span className="journal-expand-icon">
                                                {journal.isExpanded ? '▼' : '►'}
                                            </span>
                                        </h3>
                                        <p>{t('issue')}: {journal.issue}</p>
                                        <p>{t('date')}: {new Date(journal.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="journal-actions">
                                        {activeJournal?.id === journal.id ? (
                                            <span className="active-label">{t('active') || 'Active'}</span>
                                        ) : (
                                            user && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSetActive(journal);
                                                    }}
                                                    className="btn btn-small btn-secondary"
                                                >
                                                    {t('setAsActive') || 'Set as Active'}
                                                </button>
                                            )
                                        )}
                                        {user && user.role === 'admin' && (
                                            <Link 
                                                to={`/journals/edit/${journal.id}`}
                                                className="btn btn-small btn-outline"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ marginLeft: '8px' }}
                                            >
                                                {t('edit') || 'Edit'}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                
                                {journal.isExpanded && (
                                    <div className="journal-entries-section">
                                        <h4>{t('entriesInJournal') || 'Entries in this journal'}</h4>
                                        {journal.isLoading ? (
                                            <div className="loading-small">{t('loadingEntries') || 'Loading entries...'}</div>
                                        ) : journal.entries.length === 0 ? (
                                            <div className="no-entries-message">
                                                <p>{t('noEntriesInJournal') || 'No entries in this journal yet.'}</p>
                                            </div>
                                        ) : (
                                            <div className="entries-list">
                                                {journal.entries.map(entry => (
                                                    <div key={entry.id} className="entry-item">
                                                        <h5>{entry.title}</h5>
                                                        <p className="entry-abstract">{entry.abstract}</p>
                                                        <div className="entry-date">
                                                            {new Date(entry.created_at).toLocaleDateString()}
                                                        </div>
                                                        <Link to={`/entries/edit/${entry.id}`} className="btn btn-small btn-outline">
                                                            {t('viewEdit') || 'View/Edit'}
                                                        </Link>
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

export default JournalsPage; 