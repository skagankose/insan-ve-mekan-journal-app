import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { Journal, JournalEntryRead } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface JournalWithEntries extends Journal {
    entries: JournalEntryRead[];
    isExpanded: boolean;
    isLoading: boolean;
}

const ArchivedJournalsPage: React.FC = () => {
    const [journalsWithEntries, setJournalsWithEntries] = useState<JournalWithEntries[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchPublishedJournals = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedJournals = await apiService.getPublishedJournals();
                
                // Sort journals by publication date in descending order
                const sortedJournals = [...fetchedJournals].sort((a, b) => 
                    new Date(b.publication_date || b.date).getTime() - new Date(a.publication_date || a.date).getTime()
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
                console.error("Failed to fetch published journals:", err);
                setError(err.response?.data?.detail || t('failedToLoadPublishedJournals') || 'Failed to load published journals.');
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedJournals();
    }, [t]);

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
            const entries = await apiService.getPublishedJournalEntries(journalId);
            // Filter for accepted entries only
            const acceptedEntries = entries.filter(entry => entry.status === "accepted");
            setJournalsWithEntries(prevJournals => {
                return prevJournals.map(journal => {
                    if (journal.id === journalId) {
                        return {
                            ...journal,
                            entries: acceptedEntries,
                            isLoading: false
                        };
                    }
                    return journal;
                });
            });
        } catch (err) {
            console.error(`Failed to load entries for journal ${journalId}:`, err);
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

    if (loading) {
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

            {journalsWithEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🗄️</div>
                    <h3>{t('noPublishedJournals') || 'No published journals found.'}</h3>
                </div>
            ) : (
                <div className="accordion journals-accordion" style={{ 
                    padding: '16px 0',
                    maxWidth: '100%',
                    margin: '0 auto'
                }}>
                    {journalsWithEntries.map((journal) => (
                        <div key={journal.id} className="accordion-item" style={{ 
                            marginBottom: '8px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-light)',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                        }}>
                            <div 
                                className={`accordion-header ${journal.isExpanded ? 'expanded' : ''}`} 
                                onClick={() => toggleJournalExpansion(journal.id)}
                                style={{ 
                                    padding: '16px 20px',
                                    backgroundColor: 'var(--color-background-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    position: 'relative',
                                    userSelect: 'none',
                                    borderBottom: journal.isExpanded 
                                        ? '1px solid var(--color-border-light)' 
                                        : 'none'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ 
                                        margin: 0, 
                                        fontSize: 'var(--font-size-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: 'var(--color-text-primary)'
                                    }}>
                                        <span className="chevron" style={{
                                            display: 'inline-flex',
                                            width: '24px',
                                            height: '24px',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: '12px',
                                            transition: 'transform 0.3s ease',
                                            transform: journal.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                        }}>
                                            ›
                                        </span>
                                        {journal.title}
                                    </h3>
                                    <div style={{ 
                                        display: 'flex', 
                                        marginTop: '8px',
                                        color: 'var(--color-text-secondary)',
                                        fontSize: 'var(--font-size-sm)'
                                    }}>
                                        <span style={{ marginRight: '16px' }}>{t('issue')}: {journal.issue}</span>
                                        <span>{t('publicationDate')}: {journal.publication_date ? new Date(journal.publication_date).toLocaleDateString() : t('notAvailable') || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="journal-actions" style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Link 
                                        to={`/journals/${journal.id}`}
                                        className="btn btn-small btn-outline"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ 
                                            padding: '4px 12px',
                                            fontSize: 'var(--font-size-sm)'
                                        }}
                                    >
                                        {t('viewJournal') || 'View Journal'}
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="accordion-content" style={{ 
                                maxHeight: journal.isExpanded ? '2000px' : '0',
                                opacity: journal.isExpanded ? '1' : '0',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                backgroundColor: 'var(--color-background-secondary)'
                            }}>
                                <div className="accordion-body" style={{ 
                                    padding: '20px',
                                    opacity: journal.isExpanded ? '1' : '0',
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    <h4 style={{ 
                                        marginTop: 0, 
                                        marginBottom: '16px', 
                                        fontSize: 'var(--font-size-lg)',
                                        color: 'var(--color-text-primary)',
                                        borderBottom: '1px solid var(--color-border-light)',
                                        paddingBottom: '8px'
                                    }}>
                                        {t('acceptedEntries') || 'Accepted Entries'}
                                    </h4>
                                    
                                    {journal.isLoading ? (
                                        <div className="loading-small" style={{ 
                                            padding: '24px 0',
                                            textAlign: 'center',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {t('loadingEntries') || 'Loading entries...'}
                                        </div>
                                    ) : journal.entries.length === 0 ? (
                                        <div className="no-entries-message" style={{ 
                                            backgroundColor: 'var(--color-background-primary)',
                                            borderRadius: '6px',
                                            padding: '24px',
                                            textAlign: 'center',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            <p>{t('noPublishedEntries') || 'No published entries in this journal.'}</p>
                                        </div>
                                    ) : (
                                        <div className="entries-list" style={{ 
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                            gap: '16px',
                                            margin: '0'
                                        }}>
                                            {journal.entries.map(entry => (
                                                <Link 
                                                    key={entry.id} 
                                                    to={`/entries/${entry.id}`}
                                                    className="entry-item hover-effect"
                                                    style={{ 
                                                        backgroundColor: 'var(--color-background-primary)',
                                                        borderRadius: '6px',
                                                        padding: '16px',
                                                        boxShadow: 'var(--shadow-sm)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        height: '100%',
                                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                        cursor: 'pointer',
                                                        textDecoration: 'none',
                                                        color: 'inherit'
                                                    }}
                                                >
                                                    <h5 style={{ 
                                                        marginTop: 0, 
                                                        marginBottom: '8px',
                                                        fontSize: 'var(--font-size-base)',
                                                        color: 'var(--color-text-primary)'
                                                    }}>{entry.title}</h5>
                                                    
                                                    <p className="entry-abstract" style={{ 
                                                        color: 'var(--color-text-secondary)',
                                                        fontSize: 'var(--font-size-sm)',
                                                        marginBottom: '12px',
                                                        flexGrow: 1,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>{entry.abstract_tr}</p>
                                                    
                                                    <div className="entry-meta" style={{ 
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '12px',
                                                        fontSize: 'var(--font-size-xs)',
                                                        color: 'var(--color-text-tertiary)'
                                                    }}>
                                                        <div className="entry-date">
                                                            {entry.date ? new Date(entry.date).toLocaleString() : new Date(entry.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArchivedJournalsPage; 