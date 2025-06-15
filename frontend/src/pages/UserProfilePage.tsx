import React, { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MdEmail, 
    MdLocationOn, 
    MdNumbers,
    MdMenuBook, 
    MdPerson, 
    MdCalendarToday, 
    MdLink, 
    MdArrowForward, 
    MdKeyboardArrowDown,
    MdEdit,
    MdLibraryBooks,
    MdArticle 
} from 'react-icons/md';
import './UserProfilePage.css';

const UserProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { id: userId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [userEntries, setUserEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [refereeEntries, setRefereeEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [profileUser, setProfileUser] = useState<apiService.UserRead | null>(null);
    const [editorJournals, setEditorJournals] = useState<apiService.Journal[]>([]);
    const [showRejectedUserEntries, setShowRejectedUserEntries] = useState<boolean>(false);
    const [showRejectedRefereeEntries, setShowRejectedRefereeEntries] = useState<boolean>(false);
    const [showActiveEntries, setShowActiveEntries] = useState<boolean>(true);
    const [showAcceptedEntries, setShowAcceptedEntries] = useState<boolean>(true);
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
                // First, determine if we're viewing our own profile or someone else's
                if (!userId) {
                    // Viewing own profile
                    if (!user) {
                        navigate('/login');
                        return;
                    }
                    setProfileUser(user);
                    
                    // Fetch own data
                    try {
                        const [entries, refEntries] = await Promise.all([
                            apiService.getMyJournalEntries(),
                            apiService.getMyRefereeEntries()
                        ]);
                        
                        setUserEntries(entries);
                        setRefereeEntries(refEntries);
                        
                        // Fetch editor journals if user is editor or admin (owner users should not see any journals)
                        if (user.role === 'editor' || user.role === 'admin') {
                            try {
                                // For admin users, we need to filter journals where they are specifically assigned as editor-in-chief or editor
                                if (user.role === 'admin') {
                                    // Get all journals and editor links to filter user's edited journals
                                    const [allJournals, editorLinks] = await Promise.all([
                                        apiService.getAllJournals(),
                                        apiService.getAllJournalEditorLinks()
                                    ]);
                                    
                                    // Find journals where this admin user is an editor or editor-in-chief
                                    const userEditorLinks = editorLinks.filter(link => link.user_id === user.id);
                                    const userJournalIds = userEditorLinks.map(link => link.journal_id);
                                    const userEditorJournals = allJournals.filter(journal => 
                                        userJournalIds.includes(journal.id) || journal.editor_in_chief_id === user.id
                                    );
                                    
                                    setEditorJournals(userEditorJournals);
                                } else {
                                    // For regular editors, use the existing API
                                    const journals = await apiService.getEditorJournals();
                                    setEditorJournals(journals);
                                }
                            } catch (err) {
                                console.error("Failed to fetch editor journals:", err);
                            }
                        }
                        // Owner users should not see any journals since they can't be editors or editor-in-chief
                    } catch (err: any) {
                        console.error("Failed to fetch user data:", err);
                        setError("Failed to load your profile data.");
                    }
                } else {
                    // Admin viewing someone else's profile
                    // Load all necessary data
                    try {
                        const [users, entries, journalEntryAuthorLinks, journalEntryRefereeLinks] = 
                            await Promise.all([
                                apiService.getAllUsers(),
                                apiService.getAllJournalEntries(),
                                apiService.getAllJournalEntryAuthorLinks(),
                                apiService.getAllJournalEntryRefereeLinks()
                            ]);
                        
                        // Find the user we want to display
                        const targetUser = users.find(u => u.id === Number(userId));
                        if (targetUser) {
                            setProfileUser(targetUser);
                            
                            // Helper function to populate authors for entries
                            const populateAuthorsForEntries = (entryList: apiService.JournalEntryRead[]) => {
                                return entryList.map(entry => {
                                    // Find all author links for this entry
                                    const entryAuthorLinks = journalEntryAuthorLinks.filter(
                                        link => link.journal_entry_id === entry.id
                                    );
                                    
                                    // Get author information from users
                                    const authors = entryAuthorLinks.map(link => {
                                        const author = users.find(u => u.id === link.user_id);
                                        return author || null;
                                    }).filter(author => author !== null) as apiService.UserRead[];
                                    
                                    return {
                                        ...entry,
                                        authors: authors
                                    };
                                });
                            };
                            
                            // Filter entries for this user
                            // 1. Find author links for this user
                            const authorLinks = journalEntryAuthorLinks.filter(
                                link => link.user_id === Number(userId)
                            );
                            
                            // 2. Use those links to find their entries
                            const userAuthorEntries = entries.filter(entry => 
                                authorLinks.some(link => link.journal_entry_id === entry.id)
                            );
                            
                            // 3. Populate authors for user entries
                            const userAuthorEntriesWithAuthors = populateAuthorsForEntries(userAuthorEntries);
                            setUserEntries(userAuthorEntriesWithAuthors);
                            
                            // 4. Find referee links for this user
                            const refereeLinks = journalEntryRefereeLinks.filter(
                                link => link.user_id === Number(userId)
                            );
                            
                            // 5. Use those links to find their referee entries
                            const userRefereeEntries = entries.filter(entry => 
                                refereeLinks.some(link => link.journal_entry_id === entry.id)
                            );
                            
                            // 6. Populate authors for referee entries
                            const userRefereeEntriesWithAuthors = populateAuthorsForEntries(userRefereeEntries);
                            setRefereeEntries(userRefereeEntriesWithAuthors);
                            
                            // 7. Fetch editor journals if the target user is an editor or admin (owner users won't have journals but section should still be shown)
                            if (targetUser.role === 'editor' || targetUser.role === 'admin') {
                                try {
                                    // Get all journals and editor links to filter user's edited journals
                                    const [allJournals, editorLinks] = await Promise.all([
                                        apiService.getAllJournals(),
                                        apiService.getAllJournalEditorLinks()
                                    ]);
                                    
                                    // Find journals where this user is an editor or editor-in-chief
                                    const userEditorLinks = editorLinks.filter(link => link.user_id === Number(userId));
                                    const userJournalIds = userEditorLinks.map(link => link.journal_id);
                                    const userEditorJournals = allJournals.filter(journal => 
                                        userJournalIds.includes(journal.id) || journal.editor_in_chief_id === Number(userId)
                                    );
                                    
                                    setEditorJournals(userEditorJournals);
                                } catch (err) {
                                    console.error("Failed to fetch editor journals for user:", err);
                                }
                            }
                            // Owner users should not see any journals since they can't be editors or editor-in-chief
                        } else {
                            setError('User not found');
                        }
                    } catch (err: any) {
                        console.error("Failed to fetch admin data:", err);
                        setError("Failed to load user profile data.");
                    }
                }
            } catch (err: any) {
                console.error("Error in profile setup:", err);
                setError("An error occurred while loading the profile.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [userId, user, navigate]);

    if (loading) {
        return <div className="loading">{t('loadingUserData') || 'Loading user data...'}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!profileUser) {
        return <div className="loading">{t('userNotFound') || 'User not found.'}</div>;
    }

    // Helper function to render entry item
    const renderEntryItem = (entry: apiService.JournalEntryRead) => {
        return (
            <div 
                key={entry.id} 
                style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backgroundImage: 'url(/pattern_transparent.png)',
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
                            }}>Keywords:</span>
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
                                           entry.status === 'waiting_for_authors' ? '#BFDBFE' :
                                           entry.status === 'waiting_for_referees' ? '#DDD6FE' :
                                           entry.status === 'waiting_for_editors' ? '#FED7AA' :
                                           entry.status === 'rejected' ? '#FCA5A5' : 
                                           entry.status === 'pending' ? '#FDE68A' : '#D1D5DB',
                                color: entry.status === 'not_accepted' ? '#991B1B' : 
                                      entry.status === 'waiting_for_payment' ? '#92400E' : 
                                      entry.status === 'waiting_for_authors' ? '#1E40AF' :
                                      entry.status === 'waiting_for_referees' ? '#6B21A8' :
                                      entry.status === 'waiting_for_editors' ? '#C2410C' :
                                      entry.status === 'rejected' ? '#991B1B' : 
                                      entry.status === 'pending' ? '#92400E' : '#374151',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                {entry.status === 'not_accepted' ? (t('notAccepted') || 'Not Accepted') :
                                 entry.status === 'waiting_for_payment' ? (t('waitingForPayment') || 'Waiting for Payment') :
                                 entry.status === 'waiting_for_authors' ? (t('waitingForAuthors') || 'Waiting for Authors') :
                                 entry.status === 'waiting_for_referees' ? (t('waitingForReferees') || 'Waiting for Referees') :
                                 entry.status === 'waiting_for_editors' ? (t('waitingForEditors') || 'Waiting for Editors') :
                                 entry.status === 'rejected' ? (t('rejected') || 'Rejected') :
                                 entry.status === 'pending' ? (t('pending') || 'Pending') :
                                 entry.status === 'accepted' ? (t('accepted') || 'Accepted') :
                                 (t(entry.status) || entry.status)}
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
                                <span>{new Date(entry.created_date).toLocaleDateString()}</span>
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
                    backgroundImage: 'url(/pattern_transparent.png)',
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
                                <span>{new Date(journal.publication_date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                        ) : (
                            <span style={{
                                padding: '4px 8px',
                                background: '#F59E0B',
                                color: 'white',
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

    // Helper function to render grouped journals with separate sections for published and draft journals
    const renderGroupedJournals = (
        allJournals: apiService.Journal[],
        emptyMessage: string,
        showPublished: boolean,
        setShowPublished: React.Dispatch<React.SetStateAction<boolean>>,
        showDraft: boolean,
        setShowDraft: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        // Separate published and draft journals
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
                
                {/* Draft journals section - Collapsible */}
                {draftJournals.length > 0 && (
                    <div className="draft-journals-section" style={{ marginBottom: draftJournals.length > 0 ? '32px' : '0' }}>
                        <div className="section-header active">
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
                                    e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.08)';
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
                                        color: '#0D9488',
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

                {/* Published journals section - Collapsible */}
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

    // Helper function to render grouped entries with separate sections for active, accepted, and rejected entries
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
        // Get rejected entries
        const rejectedEntries = getRejectedEntries(allEntries);
        const rejectedCount = rejectedEntries.length;
        
        // Separate accepted entries from active entries
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
                {/* Active entries section - Collapsible */}
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
                                    e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.08)';
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
                                        color: '#0D9488',
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

                {/* Accepted entries section - Collapsible */}
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
                
                {/* Rejected entries section - Collapsed by default */}
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
                
                {/* Add fadeInUp animation */}
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
            <div className="page-content-section" style={{ marginLeft: '60px' }}>
                {/* User Information Card */}
                <div className="user-info-card">
                    {/* Profile actions in top right corner */}
                    <div className="profile-actions-corner">
                        {/* Edit Profile button shown only when viewing own profile and not an editor or referee */}
                        {!userId && user && user.role !== 'editor' && user.role !== 'referee' && (
                            <button 
                                onClick={() => navigate(`/profile/edit`)} 
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                <MdEdit size={14} />
                                {language === 'tr' ? 'Düzenle' : 'Edit Profile'}
                            </button>
                        )}
                        {/* Admin actions for other user profiles */}
                        {userId && (user?.role === 'admin' || user?.role === 'owner') && (
                            <button 
                                onClick={() => navigate(`/admin/users/edit/${userId}`)} 
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <MdEdit size={14} />
                                {language === 'tr' ? 'Düzenle' : 'Edit User'}
                            </button>
                        )}
                    </div>
                    <div className="user-info-header">
                        <div className="user-avatar">
                            {profileUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                    <h2>{profileUser.name}</h2>
                            {profileUser.title && (
                                <div className="profile-title">
                                    <p>{profileUser.title}</p>
                                </div>
                            )}
                            <div className="profile-badges">
                                <span className={`badge badge-${profileUser.role}`}>
                                    {t(profileUser.role) || profileUser.role}
                                </span>
                                {profileUser.is_auth && (
                                    <span className="badge badge-verified">
                                        {t('verified') || 'Verified'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Bio Section */}
                    {profileUser.bio && (
                        <div className="bio-section">
                            <h3>{t('biography') || 'Biography'}</h3>
                            <p>{profileUser.bio}</p>
                        </div>
                    )}
                    
                    {/* User Contact Information */}
                    <div className="user-contact-info">
                        <div className="contact-grid">
                            <div className="contact-item">
                                <div className="contact-icon">
                                    <MdEmail />
                                </div>
                                <div className="contact-info">
                                    <span className="contact-label">{t('email') || 'Email'}</span>
                                    <span className="contact-value">{profileUser.email}</span>
                                </div>
                            </div>
                            
                            {profileUser.location && (
                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <MdLocationOn />
                                    </div>
                                    <div className="contact-info">
                                        <span className="contact-label">{t('location') || 'Location'}</span>
                                        <span className="contact-value">{profileUser.location}</span>
                                    </div>
                                </div>
                            )}
                            
                            {profileUser.science_branch && (
                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <MdMenuBook />
                                    </div>
                                    <div className="contact-info">
                                        <span className="contact-label">{t('scienceBranch') || 'Science Branch'}</span>
                                        <span className="contact-value">{profileUser.science_branch}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Academic IDs */}
                        {(profileUser.yoksis_id || profileUser.orcid_id) && (
                            <div className="academic-ids">
                                {profileUser.yoksis_id && (
                                    <div className="academic-id-item">
                                        <span className="academic-id-label">YÖKSİS ID:</span>
                                        <span className="academic-id-value">{profileUser.yoksis_id}</span>
                                    </div>
                                )}
                                {profileUser.orcid_id && (
                                    <div className="academic-id-item">
                                        <span className="academic-id-label">ORCID ID:</span>
                                        <span className="academic-id-value">{profileUser.orcid_id}</span>
                                    </div>
                                )}
                        </div>
                    )}
                    </div>
                </div>

            {/* Show editor journals section only if user has editor journals */}
            {(profileUser.role === 'editor' || profileUser.role === 'admin' || profileUser.role === 'owner') && editorJournals.length > 0 && (
                <div className="entries-section">
                    <h2>{userId ? (language === 'tr' ? 'Editör Dergileri' : 'Editor Journals') : (language === 'tr' ? 'Editör Olduğum Dergiler' : 'Editor Journals')}</h2>
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
            {(profileUser.role === 'author' || profileUser.role === 'admin' || profileUser.role === 'owner') && userEntries.length > 0 && (
                    <div className="entries-section">
                    <h2>{userId ? (language === 'tr' ? 'Yazar Makaleleri' : 'Author Entries') : (language === 'tr' ? 'Yazar Olduğum Makalelerim' : 'My Journal Entries')}</h2>
                    {renderGroupedEntries(
                        userEntries,
                        language === 'tr' ? 'Makale Bulunamadı' : 'No Entries Found', 
                        showRejectedUserEntries,
                        setShowRejectedUserEntries,
                        showActiveEntries,
                        setShowActiveEntries,
                        showAcceptedEntries,
                        setShowAcceptedEntries
                    )}
                </div>
            )}

            {/* Show referee entries section only if user has referee entries */}
            {(profileUser.role === 'referee' || profileUser.role === 'admin' || profileUser.role === 'owner') && refereeEntries.length > 0 && (
                    <div className="entries-section">
                    <h2>{userId ? (language === 'tr' ? 'Hakem Makaleleri' : 'Referee Entries') : (language === 'tr' ? 'Hakem Olduğum Makaleler' : 'Entries I Referee')}</h2>
                    {renderGroupedEntries(
                        refereeEntries,
                        language === 'tr' ? 'Makale Bulunamadı' : 'No Entries Found', 
                        showRejectedRefereeEntries,
                        setShowRejectedRefereeEntries,
                        showActiveEntries,
                        setShowActiveEntries,
                        showAcceptedEntries,
                        setShowAcceptedEntries
                    )}
                </div>
            )}
        </div>
        </>
    );
};

export default UserProfilePage; 