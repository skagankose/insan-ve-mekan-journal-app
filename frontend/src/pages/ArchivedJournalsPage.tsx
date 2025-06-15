import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { Journal, JournalEntryRead } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';
// Using inline SVGs instead of react-icons to avoid import issues

interface JournalWithEntries extends Journal {
    entries: JournalEntryRead[];
    isExpanded: boolean;
    isLoading: boolean;
}

const ArchivedJournalsPage: React.FC = () => {
    const [journalsWithEntries, setJournalsWithEntries] = useState<JournalWithEntries[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { t, language } = useLanguage();
    const { user } = useAuth();

    // Check if user has editor/admin permissions
    const isEditorOrAdmin = user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner');

    useEffect(() => {
        const fetchPublishedJournals = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedJournals = await apiService.getPublishedJournals();
                
                // Sort journals by date in descending order
                const sortedJournals = [...fetchedJournals].sort((a, b) => 
                    new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
                );
                
                // Initialize journals with empty entries array and first one expanded
                const journalsData = sortedJournals.map((journal, index) => ({
                    ...journal,
                    entries: [],
                    isExpanded: index === 0, // First journal expanded by default
                    isLoading: false
                }));
                
                setJournalsWithEntries(journalsData);
                
                // Automatically load entries for the first journal if it exists
                if (sortedJournals.length > 0) {
                    loadJournalEntries(sortedJournals[0].id);
                }
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
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '24px'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '3px solid rgba(20, 184, 166, 0.1)',
                    borderTopColor: '#14B8A6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{
                    fontSize: '16px',
                    color: '#64748B',
                    fontWeight: '500',
                    letterSpacing: '0.025em'
                }}>{t('loadingPublishedJournals') || 'Loading published journals...'}</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '60px auto',
                padding: '32px',
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.1)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 24px',
                    background: '#EF4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'white'
                }}>⚠️</div>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#991B1B',
                    marginBottom: '12px'
                }}>Error Loading Journals</h3>
                <p style={{
                    fontSize: '16px',
                    color: '#DC2626',
                    lineHeight: '1.6'
                }}>{error}</p>
            </div>
        );
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section" style={{ marginLeft: '60px' }}>
                <h1>{t('publishedJournals')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section" style={{
                paddingBottom: '0px'
            }}>
                {journalsWithEntries.length === 0 ? (
                    <div style={{
                        maxWidth: '600px',
                        margin: '40px auto',
                        textAlign: 'center',
                        padding: '60px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto 32px',
                            background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px'
                        }}>🗄️</div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#1E293B',
                            marginBottom: '12px'
                        }}>{t('noPublishedJournals') || 'No published journals found.'}</h3>
                        <p style={{
                            fontSize: '16px',
                            color: '#64748B',
                            lineHeight: '1.6'
                        }}>Check back later for new publications</p>
                    </div>
                ) : (
                    <div style={{
                        margin: '0 auto',
                        marginLeft: '60px'
                    }}>
                        {journalsWithEntries.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).map((journal, index) => (
                            <div
                                key={journal.id}
                                className="journal-card"
                                style={{
                                    marginBottom: '24px',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(0px)',
                                    boxShadow: journal.isExpanded
                                        ? '0 20px 40px rgba(0, 0, 0, 0.2)'
                                        : '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: journal.isExpanded ? 'scale(1.02)' : 'scale(1)',
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                                    cursor: 'pointer',
                                    border: `1px solid ${journal.isExpanded ? '#14B8A6' : 'rgba(20, 184, 166, 0.2)'}`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.025)';
                                    e.currentTarget.style.borderColor = '#14B8A6';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = journal.isExpanded ? 'scale(1.02)' : 'scale(1)';
                                    e.currentTarget.style.borderColor = journal.isExpanded ? '#14B8A6' : 'rgba(20, 184, 166, 0.2)';
                                }}
                            >
                                <div 
                                    onClick={() => toggleJournalExpansion(journal.id)}
                                    style={{
                                        padding: '32px',
                                        background: journal.isExpanded 
                                            ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
                                            : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.4s ease'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, right: 0, width: '300px', height: '300px',
                                        background: journal.isExpanded 
                                            ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                                            : 'radial-gradient(circle, rgba(20,184,166,0.03) 0%, transparent 70%)',
                                        transform: 'translate(50%, -50%)', pointerEvents: 'none'
                                    }}></div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '16px', marginLeft: '-10px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px',
                                                    background: 'transparent',
                                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.3s ease',
                                                    opacity: 0.7
                                                }}>
                                                    {journal.isExpanded ? (
                                                        <svg 
                                                            width="20" 
                                                            height="20" 
                                                            viewBox="0 0 24 24" 
                                                            fill="none"
                                                            style={{
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            <path 
                                                                d="M6 9L12 15L18 9" 
                                                                stroke={journal.isExpanded ? 'rgba(255, 255, 255, 0.9)' : '#64748B'} 
                                                                strokeWidth="2" 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg 
                                                            width="20" 
                                                            height="20" 
                                                            viewBox="0 0 24 24" 
                                                            fill="none"
                                                            style={{
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            <path 
                                                                d="M9 18L15 12L9 6" 
                                                                stroke={journal.isExpanded ? 'rgba(255, 255, 255, 0.9)' : '#64748B'} 
                                                                strokeWidth="2" 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: journal.isExpanded ? 'white' : '#1E293B', letterSpacing: '-0.025em', transition: 'color 0.4s ease' }}>
                                                    {language === 'en' && journal.title_en ? journal.title_en : journal.title}
                                                </h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: journal.isExpanded ? 'rgba(255, 255, 255, 0.9)' : '#64748B', transition: 'color 0.4s ease' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 11H15M9 15H15M17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    <span style={{ fontSize: '14px', fontWeight: '400' }}>{t('issue')}: #{journal.issue}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: journal.isExpanded ? 'rgba(255, 255, 255, 0.9)' : '#64748B', transition: 'color 0.4s ease' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    <span style={{ fontSize: '14px', fontWeight: '400' }}>
                                                        {journal.publication_date ? new Date(journal.publication_date).toLocaleDateString(t('locale'), { 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        }) : t('notAvailable') || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Link 
                                                to={`/journals/${journal.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: journal.isExpanded ? 'white' : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                                    color: journal.isExpanded ? '#14B8A6' : 'white',
                                                    borderRadius: '12px', fontSize: '14px', fontWeight: '600', textDecoration: 'none',
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease',
                                                    boxShadow: 'none',
                                                    transform: 'translateY(0)', letterSpacing: '0.025em'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <span>{t('viewJournal') || 'View Journal'}</span>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Expanded Content */}
                                <div style={{
                                    maxHeight: journal.isExpanded ? '2000px' : '0',
                                    opacity: journal.isExpanded ? '1' : '0',
                                    overflow: 'hidden',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: '#F8FAFC80',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{
                                        padding: '40px',
                                        opacity: journal.isExpanded ? '1' : '0',
                                        transform: journal.isExpanded ? 'translateY(0)' : 'translateY(-20px)',
                                        transition: 'all 0.4s ease 0.2s'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '32px'
                                        }}>
                                            <div style={{
                                                width: '4px',
                                                height: '24px',
                                                background: 'linear-gradient(180deg, #14B8A6 0%, #0D9488 100%)',
                                                borderRadius: '2px'
                                            }}></div>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#1E293B',
                                                letterSpacing: '-0.025em'
                                            }}>
                                                {t('acceptedEntries') || 'Accepted Entries'}
                                            </h4>
                                            {journal.entries.length > 0 && (
                                                <span style={{
                                                    padding: '4px 12px',
                                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                                    color: 'white',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {journal.entries.length}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {journal.isLoading ? (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '60px',
                                                gap: '20px'
                                            }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    border: '3px solid rgba(20, 184, 166, 0.1)',
                                                    borderTopColor: '#14B8A6',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite'
                                                }}></div>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#64748B',
                                                    fontWeight: '500'
                                                }}>{t('loadingEntries') || 'Loading entries...'}</p>
                                            </div>
                                        ) : journal.entries.length === 0 ? (
                                            <div style={{
                                                background: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: '16px',
                                                padding: '48px',
                                                textAlign: 'center',
                                                border: '2px dashed #E2E8F0'
                                            }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    margin: '0 auto 24px',
                                                    background: '#F1F5F9',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '32px'
                                                }}>📄</div>
                                                <p style={{
                                                    fontSize: '16px',
                                                    color: '#64748B',
                                                    fontWeight: '500'
                                                }}>{t('noPublishedEntries') || 'No published entries in this journal.'}</p>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                                gap: '24px'
                                            }}>
                                                {journal.entries.map((entry, entryIndex) => (
                                                    <Link 
                                                        key={entry.id} 
                                                        to={`/entries/${entry.id}`}
                                                        style={{
                                                            display: 'block',
                                                            textDecoration: 'none',
                                                            animation: `fadeInUp 0.6s ease-out ${entryIndex * 0.1}s both`
                                                        }}
                                                    >
                                                        <div style={{
                                                            background: 'rgba(255, 255, 255, 0.8)',
                                                            backgroundImage: 'url(/pattern_transparent.png)',
                                                            backgroundSize: '190px 190px',
                                                            backgroundPosition: '131% -100%',
                                                            backgroundRepeat: 'no-repeat',
                                                            backdropFilter: 'blur(10px)',
                                                            borderRadius: '16px',
                                                            padding: '28px',
                                                            height: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            border: '1px solid #E2E8F0',
                                                            transition: 'all 0.3s ease',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                                                            e.currentTarget.style.borderColor = '#14B8A6';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                                        }}>
                                                            
                                                            <h5 style={{
                                                                margin: '0 0 16px 0',
                                                                fontSize: '18px',
                                                                fontWeight: '700',
                                                                color: '#1E293B',
                                                                lineHeight: '1.4',
                                                                letterSpacing: '-0.025em',
                                                                position: 'relative',
                                                                zIndex: 1
                                                            }}>{language === 'en' && entry.title_en ? entry.title_en : entry.title}</h5>
                                                            
                                                            {entry.authors && entry.authors.length > 0 && (
                                                                <p style={{
                                                                    margin: '0 0 16px 0',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    color: '#64748B',
                                                                    position: 'relative',
                                                                    zIndex: 1,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
                                                                            stroke="currentColor" 
                                                                            strokeWidth="2" 
                                                                            strokeLinecap="round" 
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </svg>
                                                                    <span>{entry.authors.map(author => author.name).join(', ')}</span>
                                                                </p>
                                                            )}
                                                            
                                                            <p style={{
                                                                color: '#64748B',
                                                                fontSize: '14px',
                                                                lineHeight: '1.6',
                                                                marginBottom: '20px',
                                                                flexGrow: 1,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                position: 'relative',
                                                                zIndex: 1
                                                            }}>
                                                                {entry.keywords ? (
                                                                    <>
                                                                        <span style={{ 
                                                                            fontWeight: '600', 
                                                                            color: '#475569',
                                                                            marginRight: '8px'
                                                                        }}>Keywords:</span>
                                                                        {entry.keywords}
                                                                    </>
                                                                ) : 'No keywords available.'}
                                                            </p>
                                                            
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                paddingTop: '20px',
                                                                borderTop: '1px solid #F1F5F9',
                                                                position: 'relative',
                                                                zIndex: 1
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    color: '#94A3B8',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
                                                                            stroke="currentColor" 
                                                                            strokeWidth="2" 
                                                                            strokeLinecap="round"
                                                                        />
                                                                    </svg>
                                                                    <span>{entry.doi ? entry.doi : 'No DOI available'}</span>
                                                                </div>
                                                                
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    color: '#0D9488',
                                                                    fontSize: '14px',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    <span>{t('readMore')}</span>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" 
                                                                            stroke="currentColor" 
                                                                            strokeWidth="2" 
                                                                            strokeLinecap="round" 
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </svg>
                                                                </div>
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
                <div style={{ marginTop: '16px', marginBottom: '0px' }}>
                    <div className="transparent-footer">
                        <Footer />
                    </div>
                </div>
            </div>
            
            {/* CSS Animations (can be moved to a global CSS file if preferred) */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .journal-card {
                    will-change: box-shadow, transform;
                }
                .transparent-footer .footer-content {
                    background: transparent !important;
                    border-top: none !important;
                }
            `}</style>
        </>
    );
};

export default ArchivedJournalsPage; 