import React, { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
    MdPerson, 
    MdCalendarToday, 
    MdLink, 
    MdArrowForward, 
    MdKeyboardArrowDown,
    MdLibraryBooks,
    MdArticle,
    MdNumbers
} from 'react-icons/md';
import { formatDate, getStatusTranslation } from '../utils/dateUtils';

import './RecordsPage.css';

// Utility function to get a deterministic background pattern based on ID
const getPatternForId = (id: number) => {
    const patterns = [
        '/pattern_transparent.png',
        '/pattern_v2.png',
        '/pattern_v3.png',
        '/pattern_v4.png'
    ];
    return patterns[id % patterns.length];
};



const RecordsPage: React.FC = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [userEntries, setUserEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [refereeEntries, setRefereeEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editorJournals, setEditorJournals] = useState<apiService.Journal[]>([]);
    const [showRejectedUserEntries, setShowRejectedUserEntries] = useState<boolean>(false);
    const [showRejectedRefereeEntries, setShowRejectedRefereeEntries] = useState<boolean>(false);
    const [showActiveUserEntries, setShowActiveUserEntries] = useState<boolean>(true);
    const [showAcceptedUserEntries, setShowAcceptedUserEntries] = useState<boolean>(true);
    const [showActiveRefereeEntries, setShowActiveRefereeEntries] = useState<boolean>(true);
    const [showAcceptedRefereeEntries, setShowAcceptedRefereeEntries] = useState<boolean>(true);
    const [showPublishedJournals, setShowPublishedJournals] = useState<boolean>(true);
    const [showDraftJournals, setShowDraftJournals] = useState<boolean>(true);
    
    // Get rejected entries separately
    const getRejectedEntries = (entries: apiService.JournalEntryRead[]): apiService.JournalEntryRead[] => {
        return entries.filter(entry => entry.status === 'not_accepted');
    };

    // Fetch all necessary data
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (!user) {
                    navigate('/login');
                    return;
                }
                
                // Fetch own data
                try {
                    const [entries, refEntries] = await Promise.all([
                        apiService.getMyJournalEntries(),
                        apiService.getMyRefereeEntries()
                    ]);
                    
                    setUserEntries(entries);
                    setRefereeEntries(refEntries);
                    
                    // Always try to fetch editor journals
                    try {
                        const journals = await apiService.getMyEditedJournals();
                        setEditorJournals(journals);
                    } catch (err) {
                        console.error("Failed to fetch user's edited journals:", err);
                        try {
                            const [allJournals, editorLinks] = await Promise.all([
                                apiService.getAllJournals(),
                                apiService.getAllJournalEditorLinks()
                            ]);
                            
                            const userEditorLinks = editorLinks.filter(link => link.user_id === user.id);
                            const userJournalIds = userEditorLinks.map(link => link.journal_id);
                            const userEditorJournals = allJournals.filter(journal => 
                                userJournalIds.includes(journal.id) || journal.editor_in_chief_id === user.id
                            );
                            
                            setEditorJournals(userEditorJournals);
                        } catch (fallbackErr) {
                            console.error("Failed to fetch editor journals via fallback:", fallbackErr);
                            try {
                                const journals = await apiService.getEditorJournals();
                                setEditorJournals(journals);
                            } catch (editorErr) {
                                console.error("Failed to fetch editor journals via editor API:", editorErr);
                                setEditorJournals([]);
                            }
                        }
                    }
                } catch (err: any) {
                    console.error("Failed to fetch user data:", err);
                    setError("Failed to load your records data.");
                }
            } catch (err: any) {
                console.error("Error in records setup:", err);
                setError("An error occurred while loading the records.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [user, navigate]);

    if (loading) {
        return <div className="loading">{t('loadingUserData') || 'Loading records...'}</div>;
    }

    if (error) {
        return (
            <div style={{
                minHeight: '70vh',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                marginLeft: '60px'
            }}>
                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '32px',
                    padding: '48px',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                    border: '1px solid rgba(226, 232, 240, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-30%',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        zIndex: 0
                    }}></div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto 32px',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            borderRadius: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.2)'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9V11M12 15H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
                                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#1E293B',
                            marginBottom: '16px',
                            letterSpacing: '-0.025em'
                        }}>{language === 'tr' ? 'Kayıtlar Bulunamadı' : 'Error Loading Record'}</h1>
                        
                        <p style={{
                            fontSize: '18px',
                            color: '#64748B',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                            fontWeight: '500'
                        }}>{language === 'tr' ? 'Kayıtlarınızı şuanda görüntüleyemiyoruz.' : 'We encountered an issue while loading your records. Please try again later.'}</p>
                        
                        <button
                            onClick={() => navigate('/archive')}
                            style={{
                                padding: '16px 32px',
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                margin: '0 auto'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('backToArchive') || 'Browse Archive'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Helper function to render entry item
    const renderEntryItem = (entry: apiService.JournalEntryRead) => {
        return (
            <div 
                key={entry.id} 
                style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backgroundImage: `url(${getPatternForId(entry.id)})`,
                    backgroundSize: '190px 190px',
                    backgroundPosition: '127% -87%',
                    backgroundRepeat: 'no-repeat',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    height: '100%'
                }}
                onClick={() => navigate(`/entries/${entry.id}`)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#14B8A6';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                }}
            >
                <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1E293B',
                    lineHeight: '1.4',
                    letterSpacing: '-0.025em',
                    position: 'relative',
                    zIndex: 1
                }}>{language === 'en' && entry.title_en ? entry.title_en : entry.title}</h4>
                
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
                        <MdPerson size={14} />
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
                    {(language === 'en' && entry.keywords_en ? entry.keywords_en : entry.keywords) ? (
                        <>
                            <span style={{ 
                                fontWeight: '600', 
                                color: '#475569',
                                marginRight: '8px'
                            }}>{language === 'tr' ? 'Anahtar Kelimeler:' : 'Keywords:'}</span>
                            {language === 'en' && entry.keywords_en ? entry.keywords_en : entry.keywords}
                        </>
                    ) : entry.abstract_tr ? (
                        entry.abstract_tr
                    ) : 'No information available.'}
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
                        gap: '8px'
                    }}>
                        {entry.status === 'accepted' ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#94A3B8',
                                fontSize: '12px'
                            }}>
                                <MdLink size={14} />
                                <span>{entry.doi ? entry.doi : 'No DOI available'}</span>
                            </div>
                        ) : entry.status ? (
                            <span style={{
                                padding: '4px 8px',
                                background: entry.status === 'not_accepted' ? '#FCA5A5' : 
                                           entry.status === 'waiting_for_payment' ? '#FDE68A' : 
                                           entry.status === 'waiting_for_authors' ? '#FED7AA' :
                                           entry.status === 'waiting_for_referees' ? '#DDD6FE' :
                                           entry.status === 'waiting_for_editors' ? '#BFDBFE' :
                                           entry.status === 'rejected' ? '#FCA5A5' : 
                                           entry.status === 'pending' ? '#FDE68A' : '#D1D5DB',
                                color: entry.status === 'not_accepted' ? '#991B1B' : 
                                      entry.status === 'waiting_for_payment' ? '#92400E' : 
                                      entry.status === 'waiting_for_authors' ? '#C2410C' :
                                      entry.status === 'waiting_for_referees' ? '#6B21A8' :
                                      entry.status === 'waiting_for_editors' ? '#1E40AF' :
                                      entry.status === 'rejected' ? '#991B1B' : 
                                      entry.status === 'pending' ? '#92400E' : '#374151',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                {getStatusTranslation(entry.status || '', language)}
                            </span>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#94A3B8',
                                fontSize: '12px'
                            }}>
                                <MdCalendarToday size={14} />
                                <span>{formatDate(entry.created_date, language)}</span>
                            </div>
                        )}
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#0D9488',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        <span>{t('readMore') || 'Read More'}</span>
                        <MdArrowForward size={16} />
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to render journal cards
    const renderJournalItem = (journal: apiService.Journal) => {
        return (
            <div 
                key={journal.id} 
                style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backgroundImage: `url(${getPatternForId(journal.id)})`,
                    backgroundSize: '190px 190px',
                    backgroundPosition: '127% -87%',
                    backgroundRepeat: 'no-repeat',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    height: '100%'
                }}
                onClick={() => navigate(`/journals/${journal.id}`)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#14B8A6';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                }}
            >
                <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1E293B',
                    lineHeight: '1.4',
                    letterSpacing: '-0.025em',
                    position: 'relative',
                    zIndex: 1
                }}>{language === 'en' && journal.title_en ? journal.title_en : journal.title}</h4>
                
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <MdNumbers size={14} />
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#64748B'
                    }}>
                        {language === 'tr' ? 'Sayı' : 'Issue'}: {journal.issue}
                    </span>
                </div>
                
                <div style={{
                    color: '#64748B',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    flexGrow: 1,
                    position: 'relative',
                    zIndex: 1
                }}>
                    {journal.publication_place && (
                        <p style={{ margin: '0' }}>
                            <span style={{ fontWeight: '600', color: '#475569' }}>
                                {language === 'tr' ? 'Yayın Yeri:' : 'Publication Place:'} 
                            </span> {journal.publication_place}
                        </p>
                    )}
                </div>
                
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
                        gap: '8px'
                    }}>
                        {journal.publication_date ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#94A3B8',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}>
                                <MdCalendarToday size={14} />
                                <span>{formatDate(journal.publication_date, language)}</span>
                            </div>
                        ) : (
                            <span style={{
                                padding: '4px 8px',
                                background: '#FDE68A',
                                color: '#92400E',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                {language === 'tr' ? 'Devam Ediyor' : 'Draft'}
                            </span>
                        )}
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#0D9488',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        <span>{language === 'tr' ? 'Görüntüle' : 'View'}</span>
                        <MdArrowForward size={16} />
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to render grouped journals
    const renderGroupedJournals = (
        allJournals: apiService.Journal[],
        emptyMessage: string,
        showPublished: boolean,
        setShowPublished: React.Dispatch<React.SetStateAction<boolean>>,
        showDraft: boolean,
        setShowDraft: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        const publishedJournals = allJournals.filter(journal => journal.is_published);
        const draftJournals = allJournals.filter(journal => !journal.is_published);
        
        if (publishedJournals.length === 0 && draftJournals.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <MdLibraryBooks size={48} />
                    </div>
                    <h3>{emptyMessage}</h3>
                </div>
            );
        }
        
        return (
            <div className="entries-section-content">
                {draftJournals.length > 0 && (
                    <div className="draft-journals-section" style={{ marginBottom: draftJournals.length > 0 ? '32px' : '0' }}>
                        <div className="section-header draft">
                            <div 
                                className="section-header-clickable"
                                onClick={() => setShowDraft(!showDraft)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    padding: '16px 8px 16px 28px',
                                    borderRadius: '0 8px 8px 0',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                    marginLeft: '-24px',
                                    marginTop: '-16px',
                                    marginBottom: '-16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <h3>
                                    <div className="section-header-icon">{draftJournals.length}</div>
                                    {language === 'tr' ? 'Taslak Dergiler' : 'Draft Journals'}
                                </h3>
                                <MdKeyboardArrowDown 
                                    className="section-collapse-icon"
                                    size={24}
                                    style={{
                                        color: '#D97706',
                                        transform: showDraft ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {showDraft && (
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '24px'
                            }}>
                                {draftJournals.map((journal, index) => (
                                    <div key={journal.id} style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}>
                                        {renderJournalItem(journal)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {publishedJournals.length > 0 && (
                    <div className="published-journals-section">
                        <div className="section-header accepted">
                            <div 
                                className="section-header-clickable"
                                onClick={() => setShowPublished(!showPublished)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    padding: '16px 8px 16px 28px',
                                    borderRadius: '0 8px 8px 0',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                    marginLeft: '-24px',
                                    marginTop: '-16px',
                                    marginBottom: '-16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <h3>
                                    <div className="section-header-icon">{publishedJournals.length}</div>
                                    {language === 'tr' ? 'Yayınlanmış Dergiler' : 'Published Journals'}
                                </h3>
                                <MdKeyboardArrowDown 
                                    className="section-collapse-icon"
                                    size={24}
                                    style={{
                                        color: '#047857',
                                        transform: showPublished ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {showPublished && (
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '24px'
                            }}>
                                {publishedJournals.map((journal, index) => (
                                    <div key={journal.id} style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}>
                                        {renderJournalItem(journal)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Helper function to render grouped entries
    const renderGroupedEntries = (
        allEntries: apiService.JournalEntryRead[],
        emptyMessage: string, 
        showRejected: boolean,
        setShowRejected: React.Dispatch<React.SetStateAction<boolean>>,
        showActive: boolean,
        setShowActive: React.Dispatch<React.SetStateAction<boolean>>,
        showAccepted: boolean,
        setShowAccepted: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        const rejectedEntries = getRejectedEntries(allEntries);
        const rejectedCount = rejectedEntries.length;
        const acceptedEntries = allEntries.filter(entry => entry.status === 'accepted' || entry.status === 'published');
        const activeEntries = allEntries.filter(entry => 
            entry.status !== 'accepted' && 
            entry.status !== 'published' && 
            entry.status !== 'not_accepted'
        );
        
        if (activeEntries.length === 0 && acceptedEntries.length === 0 && rejectedCount === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <MdArticle size={48} />
                    </div>
                    <h3>{emptyMessage}</h3>
                </div>
            );
        }
        
        return (
            <div className="entries-section-content">
                {activeEntries.length > 0 && (
                    <div className="active-entries-section" style={{ marginBottom: '32px' }}>
                        <div className="section-header active">
                            <div 
                                className="section-header-clickable"
                                onClick={() => setShowActive(!showActive)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    padding: '16px 8px 16px 28px',
                                    borderRadius: '0 8px 8px 0',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                    marginLeft: '-24px',
                                    marginTop: '-16px',
                                    marginBottom: '-16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <h3>
                                    <div className="section-header-icon">{activeEntries.length}</div>
                                    {language === 'tr' ? 'Aktif Makaleler' : 'Active Entries'}
                                </h3>
                                <MdKeyboardArrowDown 
                                    className="section-collapse-icon"
                                    size={24}
                                    style={{
                                        color: '#D97706',
                                        transform: showActive ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {showActive && (
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '24px'
                            }}>
                                {activeEntries.map((entry, index) => (
                                    <div key={entry.id} style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}>
                                        {renderEntryItem(entry)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {acceptedEntries.length > 0 && (
                    <div className="accepted-entries-section" style={{ marginBottom: rejectedCount > 0 ? '32px' : '0' }}>
                        <div className="section-header accepted">
                            <div 
                                className="section-header-clickable"
                                onClick={() => setShowAccepted(!showAccepted)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    padding: '16px 8px 16px 28px',
                                    borderRadius: '0 8px 8px 0',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                    marginLeft: '-24px',
                                    marginTop: '-16px',
                                    marginBottom: '-16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <h3>
                                    <div className="section-header-icon">{acceptedEntries.length}</div>
                                    {language === 'tr' ? 'Kabul Edilen Makaleler' : 'Accepted Entries'}
                                </h3>
                                <MdKeyboardArrowDown 
                                    className="section-collapse-icon"
                                    size={24}
                                    style={{
                                        color: '#047857',
                                        transform: showAccepted ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {showAccepted && (
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '24px'
                            }}>
                                {acceptedEntries.map((entry, index) => (
                                    <div key={entry.id} style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}>
                                        {renderEntryItem(entry)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {rejectedCount > 0 && (
                    <div className="rejected-entries-section">
                        <div className="section-header rejected">
                            <div 
                                className="section-header-clickable"
                                onClick={() => setShowRejected(!showRejected)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    padding: '16px 8px 16px 28px',
                                    borderRadius: '0 8px 8px 0',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                    marginLeft: '-24px',
                                    marginTop: '-16px',
                                    marginBottom: '-16px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <h3>
                                    <div className="section-header-icon">{rejectedCount}</div>
                                    {language === 'tr' ? 'Kabul Edilmeyen Makaleler' : 'Not Accepted Entries'}
                                </h3>
                                <MdKeyboardArrowDown 
                                    className="section-collapse-icon"
                                    size={24}
                                    style={{
                                        color: '#DC2626',
                                        transform: showRejected ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {showRejected && (
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '24px'
                            }}>
                                {rejectedEntries.map((entry, index) => (
                                    <div 
                                        key={entry.id} 
                                        style={{ 
                                            animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                                            opacity: '0.8'
                                        }}
                                    >
                                        {renderEntryItem(entry)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                <style>{`
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
                `}</style>
            </div>
        );
    };
    
    return (
        <>
            <div className="page-title-section" style={{ marginLeft: '60px' }}>
                <h1>{language === 'tr' ? 'Kayıtlarım' : 'My Records'}</h1>
            </div>

            <div className="page-content-section" style={{ marginLeft: '60px' }}>
                {/* Check if user has any records at all */}
                {editorJournals.length === 0 && userEntries.length === 0 && refereeEntries.length === 0 ? (
                    <div className="records-empty-state">
                        <div className="empty-state-icon">
                            <MdLibraryBooks size={64} />
                        </div>
                        <h3>{language === 'tr' ? 'Henüz Kayıt Bulunamadı' : 'No Records Found Yet'}</h3>
                        <p>
                            {language === 'tr' 
                                ? 'Henüz herhangi bir dergi editörlüğü, makale yazarlığı veya hakem görevi bulunmamaktadır. Akademik çalışmalarınız burada görüntülenecektir.'
                                : 'You don\'t have any journal editorships, authored articles, or referee assignments yet. Your academic work will appear here once you get involved.'
                            }
                        </p>
                        <div className="empty-state-actions">
                            <button
                                onClick={() => navigate('/archive')}
                                className="empty-state-button primary"
                            >
                                <MdLibraryBooks size={16} />
                                {language === 'tr' ? 'Arşivi Keşfet' : 'Explore Archive'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Show editor journals section only if user has editor journals */}
                        {editorJournals.length > 0 && (
                            <div className="entries-section">
                                <h2>{language === 'tr' ? 'Editör Olduğum Dergiler' : 'Editor Journals'}</h2>
                                {renderGroupedJournals(
                                    editorJournals,
                                    language === 'tr' ? 'Dergi Bulunamadı' : 'No Journals Found',
                                    showPublishedJournals,
                                    setShowPublishedJournals,
                                    showDraftJournals,
                                    setShowDraftJournals
                                )}
                            </div>
                        )}

                        {/* Show journal entries section only if user has author entries */}
                        {userEntries.length > 0 && (
                            <div className="entries-section">
                                <h2>{language === 'tr' ? 'Yazar Olduğum Makalelerim' : 'Author Entries'}</h2>
                                {renderGroupedEntries(
                                    userEntries,
                                    language === 'tr' ? 'Makale Bulunamadı' : 'No Entries Found', 
                                    showRejectedUserEntries,
                                    setShowRejectedUserEntries,
                                    showActiveUserEntries,
                                    setShowActiveUserEntries,
                                    showAcceptedUserEntries,
                                    setShowAcceptedUserEntries
                                )}
                            </div>
                        )}

                        {/* Show referee entries section only if user has referee entries */}
                        {refereeEntries.length > 0 && (
                            <div className="entries-section">
                                <h2>{language === 'tr' ? 'Hakem Olduğum Makaleler' : 'Referee Entries'}</h2>
                                {renderGroupedEntries(
                                    refereeEntries,
                                    language === 'tr' ? 'Makale Bulunamadı' : 'No Entries Found', 
                                    showRejectedRefereeEntries,
                                    setShowRejectedRefereeEntries,
                                    showActiveRefereeEntries,
                                    setShowActiveRefereeEntries,
                                    showAcceptedRefereeEntries,
                                    setShowAcceptedRefereeEntries
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default RecordsPage; 