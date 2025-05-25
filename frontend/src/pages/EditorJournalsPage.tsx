import React, { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';
import { Journal } from '../services/apiService';

interface JournalWithEntries extends Journal {
    entries: apiService.JournalEntryRead[];
    isExpanded: boolean;
    isLoading: boolean;
}

const styles = `
    .hover-effect:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
`;

const EditorJournalsPage: React.FC = () => {
    const [journalsWithEntries, setJournalsWithEntries] = useState<JournalWithEntries[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { t } = useLanguage();
    const { activeJournal } = useActiveJournal();

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    useEffect(() => {
        if (!authLoading && isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner')) {
            const fetchEditorJournals = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Use the editor-specific endpoint to get only related journals
                    const fetchedJournals = await apiService.getEditorJournals();
                    // Sort journals by date in descending order
                    const sortedJournals = [...fetchedJournals].sort((a, b) => 
                        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
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
                    console.error("Failed to fetch editor journals:", err);
                    if (err.response?.status === 401) {
                        setError("Authentication error. Please log in again.");
                    } else {
                        setError('Failed to load journals.');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchEditorJournals();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
            setJournalsWithEntries([]);
        }
    }, [isAuthenticated, authLoading, user]);

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
    
    // Not authenticated or not an editor state
    if (!isAuthenticated || !user || (user.role !== 'editor' && user.role !== 'admin' && user.role !== 'owner')) {
        return (
            <div className="card">
                <p>{t('editorAccessRequired')}</p>
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
                <h1 className="page-title">{t('myJournals')}</h1>
            </div>

            {journalsWithEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>{t('noJournalsAssigned')}</h3>
                    <p>{t('contactAdminForJournalAssignment')}</p>
                </div>
            ) : (
                <div className="accordion journals-accordion" style={{ 
                    padding: '16px 0',
                    maxWidth: '100%',
                    margin: '0 auto'
                }}>
                    {journalsWithEntries.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).map((journal, _index) => (
                        <div key={journal.id} className="accordion-item" style={{ 
                            marginBottom: '8px',
                            borderRadius: '8px',
                            border: activeJournal?.id === journal.id 
                                ? '2px solid var(--color-primary)' 
                                : '1px solid var(--color-border-light)',
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
                                        {activeJournal?.id === journal.id && (
                                            <span className="active-badge" style={{
                                                marginLeft: '12px',
                                                fontSize: 'var(--font-size-xs)',
                                                backgroundColor: 'var(--color-primary)',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '12px'
                                            }}>
                                                {t('active') || 'Active'}
                                            </span>
                                        )}
                                    </h3>
                                    <div style={{ 
                                        display: 'flex', 
                                        marginTop: '8px',
                                        color: 'var(--color-text-secondary)',
                                        fontSize: 'var(--font-size-sm)'
                                    }}>
                                        <span style={{ marginRight: '16px' }}>{t('issue')}: {journal.issue}</span>
                                        <span>{t('date')}: {new Date(journal.created_date).toLocaleDateString()}</span>
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
                                        {t('entriesInJournal') || 'Entries in this journal'}
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
                                            <p>{t('noEntriesInJournal') || 'No entries in this journal yet.'}</p>
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
                                                        color: 'var(--color-text-primary)',
                                                        wordWrap: 'break-word',
                                                        overflowWrap: 'break-word',
                                                        maxWidth: '100%',
                                                        whiteSpace: 'pre-wrap'
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
                                                            {new Date(entry.created_date).toLocaleString()}
                                                        </div>
                                                        {entry.status && (
                                                            <div className="entry-status">
                                                                <span className={`badge badge-${entry.status.toLowerCase()}`} style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    fontSize: 'var(--font-size-xs)'
                                                                }}>
                                                                    {t(entry.status) || entry.status}
                                                                </span>
                                                            </div>
                                                        )}
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

export default EditorJournalsPage; 