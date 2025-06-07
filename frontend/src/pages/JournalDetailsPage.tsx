import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';
import Footer from '../components/Footer';

const JournalDetailsPage: React.FC = () => {
    const { journalId } = useParams<{ journalId: string }>();
    const navigate = useNavigate();
    const [journal, setJournal] = useState<apiService.Journal | null>(null);
    const [entries, setEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editorInChief, setEditorInChief] = useState<apiService.UserRead | null>(null);
    const [editors, setEditors] = useState<apiService.UserRead[]>([]);
    const { isAuthenticated, user } = useAuth();
    const { t, language } = useLanguage();
    const { activeJournal, setActiveJournal } = useActiveJournal();
    const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'owner');
    const isEditor = isAuthenticated && user && user.role === 'editor';
    const isEditorOrAdmin = isAuthenticated && user && (isEditor || isAdmin);
    
    // Check if current user can view journal files (admin/owner or editor related to this journal)
    const canViewJournalFiles = isAdmin || 
                               (isEditor && user && (
                                   editors.some(editor => editor.id === user.id) ||
                                   editorInChief?.id === user.id
                               ));
    
    // Modal states for editor management
    const [showEditorInChiefModal, setShowEditorInChiefModal] = useState(false);
    const [showEditorsModal, setShowEditorsModal] = useState(false);
    const [adminUsers, setAdminUsers] = useState<apiService.UserRead[]>([]);
    const [editorUsers, setEditorUsers] = useState<apiService.UserRead[]>([]);
    const [selectedEditorInChiefId, setSelectedEditorInChiefId] = useState<number | null>(null);
    const [selectedEditorIds, setSelectedEditorIds] = useState<number[]>([]);
    const [isSubmittingEditors, setIsSubmittingEditors] = useState(false);
    const [isMerging, setIsMerging] = useState<boolean>(false);
    const [mergeError, setMergeError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJournalAndEntries = async () => {
            if (!journalId) return;
            
            setLoading(true);
            setError(null);
            try {
                let journalData;
                let entriesData;

                if (isEditorOrAdmin) {
                    const [journalsData, fetchedEntries] = await Promise.all([
                        apiService.getJournals(),
                        apiService.getEntriesByJournal(parseInt(journalId))
                    ]);
                    journalData = journalsData.find(j => j.id === parseInt(journalId));
                    entriesData = fetchedEntries;
                } else {
                    const [journals, entries] = await Promise.all([
                        apiService.getPublishedJournals(),
                        apiService.getPublishedJournalEntries(parseInt(journalId))
                    ]);
                    journalData = journals.find(j => j.id === parseInt(journalId));
                    entriesData = entries;
                }

                if (!journalData) {
                    throw new Error('Journal not found');
                }

                setJournal(journalData);
                setEntries(entriesData);

                if (journalData.editor_in_chief_id) {
                    try {
                        const editorInChiefData = await apiService.getPublicUserInfo(journalData.editor_in_chief_id.toString());
                        setEditorInChief(editorInChiefData);
                    } catch (err) {
                        console.error("Failed to fetch editor-in-chief data:", err);
                    }
                }

                try {
                    const editorLinksData = await apiService.getPublicJournalEditors(journalData.id);
                    if (editorLinksData.length > 0) {
                        const editorsData = await Promise.all(
                            editorLinksData.map(link => apiService.getPublicUserInfo(link.user_id.toString()))
                        );
                        setEditors(editorsData);
                    } else {
                        setEditors([]);
                    }
                } catch (err) {
                    console.error("Failed to fetch editors data:", err);
                    setEditors([]);
                }
            } catch (err: any) {
                console.error("Failed to fetch journal data:", err);
                setError(err.response?.data?.detail || t('failedToLoadJournalData') || 'Failed to load journal data.');
            } finally {
                setLoading(false);
            }
        };

        fetchJournalAndEntries();
    }, [journalId, isEditorOrAdmin, t]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAdmin) return;
            
            if (showEditorInChiefModal) {
                try {
                    const admins = await apiService.getAdminUsers();
                    setAdminUsers(admins);
                    if (journal?.editor_in_chief_id) {
                        setSelectedEditorInChiefId(journal.editor_in_chief_id);
                    }
                } catch (err) {
                    console.error('Failed to fetch admin users:', err);
                }
            }
            
            if (showEditorsModal) {
                try {
                    const editorRoleUsers = await apiService.getEditorRoleUsers();
                    setEditorUsers(editorRoleUsers);
                    setSelectedEditorIds(editors.map(editor => editor.id));
                } catch (err) {
                    console.error('Failed to fetch editor users:', err);
                }
            }
        };
        
        fetchUsers();
    }, [showEditorInChiefModal, showEditorsModal, isAdmin, journal, editors]);

    useEffect(() => {
        const isModalOpen = showEditorInChiefModal || showEditorsModal;
        
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showEditorInChiefModal, showEditorsModal]);

    const handleSetActive = async () => {
        if (!journal) return;
        
        try {
            await apiService.updateSettings({ active_journal_id: journal.id });
            setActiveJournal(journal);
        } catch (err: any) {
            console.error("Failed to set active journal:", err);
            setError(err.response?.data?.detail || 'Failed to set active journal.');
        }
    };

    const handleSetEditorInChief = async () => {
        if (!journalId || !selectedEditorInChiefId) return;
        
        try {
            setIsSubmittingEditors(true);
            await apiService.setJournalEditorInChief(parseInt(journalId), selectedEditorInChiefId);
            
            const updatedEditorInChief = await apiService.getUserBasicInfo(selectedEditorInChiefId.toString());
            setEditorInChief(updatedEditorInChief);
            
            if (journal) {
                setJournal({
                    ...journal,
                    editor_in_chief_id: selectedEditorInChiefId
                });
            }
            
            setShowEditorInChiefModal(false);
        } catch (err) {
            console.error('Failed to set editor-in-chief:', err);
        } finally {
            setIsSubmittingEditors(false);
        }
    };

    const handleUpdateEditors = async () => {
        if (!journalId) return;
        
        try {
            setIsSubmittingEditors(true);
            
            const currentEditorIds = editors.map(editor => editor.id);
            const editorsToAdd = selectedEditorIds.filter(id => !currentEditorIds.includes(id));
            const editorsToRemove = currentEditorIds.filter(id => !selectedEditorIds.includes(id));
            
            for (const editorId of editorsToAdd) {
                await apiService.addJournalEditor(parseInt(journalId), editorId);
            }
            
            for (const editorId of editorsToRemove) {
                await apiService.removeJournalEditor(parseInt(journalId), editorId);
            }
            
            try {
                const editorLinksData = await apiService.getPublicJournalEditors(parseInt(journalId));
                if (editorLinksData.length > 0) {
                    const editorsData = await Promise.all(
                        editorLinksData.map(link => apiService.getPublicUserInfo(link.user_id.toString()))
                    );
                    setEditors(editorsData);
                } else {
                    setEditors([]);
                }
            } catch (err) {
                console.error('Failed to fetch updated editors data:', err);
            }
            
            setShowEditorsModal(false);
        } catch (err) {
            console.error('Failed to update editors:', err);
        } finally {
            setIsSubmittingEditors(false);
        }
    };

    const handleMergeJournal = async () => {
        if (!journalId || !journal) return;
        
        try {
            setIsMerging(true);
            setMergeError(null);
            
            await apiService.mergeJournalFiles(parseInt(journalId));
            
            const [journalsData] = await Promise.all([
                apiService.getJournals()
            ]);
            const updatedJournal = journalsData.find(j => j.id === parseInt(journalId));
            if (updatedJournal) {
                setJournal(updatedJournal);
            }
            
        } catch (err: any) {
            console.error('Failed to merge journal files:', err);
            setMergeError(err.response?.data?.detail || t('failedToMergeFiles') || 'Failed to merge journal files.');
        } finally {
            setIsMerging(false);
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
                }}>{t('loadingJournalData') || 'Loading journal data...'}</p>
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
                }}>Error Loading Journal</h3>
                <p style={{
                    fontSize: '16px',
                    color: '#DC2626',
                    lineHeight: '1.6'
                }}>{error}</p>
            </div>
        );
    }

    if (!journal) {
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
                }}>📖</div>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#991B1B',
                    marginBottom: '12px'
                }}>Journal Not Found</h3>
                <p style={{
                    fontSize: '16px',
                    color: '#DC2626',
                    lineHeight: '1.6'
                }}>{t('journalNotFound') || 'Journal not found.'}</p>
            </div>
        );
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section" style={{ marginLeft: '60px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px',
                    marginBottom: '16px'
                }}>
                    <button 
                        onClick={() => navigate(isEditorOrAdmin ? '/editor/journals' : '/archive')} 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(20, 184, 166, 0.2)',
                            borderRadius: '12px',
                            color: '#0D9488',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                            e.currentTarget.style.borderColor = '#14B8A6';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                            e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {isEditorOrAdmin ? (t('backToJournals') || 'Back to Journals') : (t('backToArchive') || 'Back to Archive')}
                    </button>
                    
                    <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', marginRight: '40px' }}>
                        {/* Download PDF Button - Available to all users */}
                        {journal.full_pdf && (
                            <a 
                                href={`/api${journal.full_pdf}`} 
                                download
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('downloadFullPdf') || 'Download PDF'}
                            </a>
                        )}
                        
                    {isEditorOrAdmin && (
                            <>
                            {activeJournal?.id !== journal.id && (
                                <button
                                    onClick={handleSetActive}
                                    style={{
                                        padding: '12px 20px',
                                        background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {t('setAsActive') || 'Set as Active'}
                                </button>
                            )}
                            <button
                                onClick={handleMergeJournal}
                                disabled={isMerging}
                                style={{
                                    padding: '12px 20px',
                                    background: isMerging ? '#94A3B8' : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isMerging ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isMerging) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isMerging) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {isMerging ? (t('mergingFiles') || 'Merging Files...') : (t('mergeAndCreateToc') || 'Merge Journal Files')}
                            </button>
                            <Link 
                                to={`/journals/edit/${journal.id}`} 
                                style={{
                                    padding: '12px 20px',
                                    background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'inline-flex',
                                        alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {t('editJournal') || 'Edit Journal'}
                            </Link>
                            </>
                    )}
                    </div>
                </div>
                <h1>{language === 'en' && journal.title_en ? journal.title_en : journal.title}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section" style={{
                paddingBottom: '0px',
                marginLeft: '60px'
            }}>

                {mergeError && (
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                        borderRadius: '12px',
                        border: '1px solid #FCA5A5',
                        marginBottom: '24px',
                        color: '#DC2626',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        {mergeError}
                    </div>
                )}

                <div style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '40px',
                    marginBottom: '32px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                    border: '1px solid rgba(20, 184, 166, 0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-20%',
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.03) 0%, transparent 70%)',
                        borderRadius: '50%',
                        zIndex: 0
                    }}></div>
                    
                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        marginBottom: '36px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 16px rgba(20, 184, 166, 0.3)'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V9A2 2 0 0 1 6 7H18A2 2 0 0 1 20 9V17H6.5A2.5 2.5 0 0 0 4 19.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 11H16M8 15H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3 style={{
                                fontSize: '28px',
                                fontWeight: '800',
                                color: '#0F172A',
                                margin: 0,
                                letterSpacing: '-0.025em',
                                background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Journal Information</h3>
                        </div>
                        <div style={{
                            width: '60px',
                            height: '4px',
                            background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)',
                            borderRadius: '2px',
                            marginLeft: '52px'
                        }}></div>
                    </div>
                    
                                        {/* Information Cards Grid - Two Rows */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gridTemplateRows: 'auto auto',
                        gap: '20px',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {/* First Row: Issue, Date, Place */}
                                {/* Issue Number */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px 20px',
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(226, 232, 240, 0.6)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            fontWeight: '600', 
                                            color: '#64748B',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>{t('issue') || 'Issue'}</div>
                                        <div style={{ 
                                            fontSize: '18px', 
                            fontWeight: '700',
                            color: '#1E293B',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            #{journal.issue}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Publication Date */}
                                {journal.publication_date && (
                        <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                            </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                color: '#64748B',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                marginBottom: '4px'
                                            }}>{t('publicationDate') || 'Publication Date'}</div>
                                            <div style={{ 
                                                fontSize: '16px', 
                                                fontWeight: '600', 
                                                color: '#1E293B'
                                            }}>{new Date(journal.publication_date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Publication Place */}
                                {journal.publication_place && (
                                <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                color: '#64748B',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                marginBottom: '4px'
                                            }}>{t('publicationPlace') || 'Publication Place'}</div>
                                            <div style={{ 
                                                fontSize: '16px', 
                                                fontWeight: '600', 
                                                color: '#1E293B'
                                            }}>{journal.publication_place}</div>
                                        </div>
                                </div>
                            )}
                            
                                {/* Status and Admin Info */}
                            {isEditorOrAdmin && (
                                    <>
                                        {/* Creation Date */}
                                <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '16px 20px',
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(226, 232, 240, 0.6)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                    <div style={{ 
                                                width: '36px',
                                                height: '36px',
                                                background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontSize: '13px', 
                                        fontWeight: '600',
                                                    color: '#64748B',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '4px'
                                                }}>{t('createdDate') || 'Created Date'}</div>
                                                <div style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: '600', 
                                                    color: '#1E293B'
                                                }}>{new Date(journal.created_date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        
                                        {/* Publication Status */}
                                        <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                            gap: '12px',
                                            padding: '16px 20px',
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '16px',
                                            border: `1px solid ${journal.is_published ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                background: journal.is_published 
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {journal.is_published ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontSize: '13px', 
                                                    fontWeight: '600', 
                                                    color: '#64748B',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '4px'
                                                }}>{t('publicationStatus') || 'Publication Status'}</div>
                                                <div style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: '700', 
                                                    color: journal.is_published ? '#059669' : '#DC2626',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: journal.is_published ? '#10B981' : '#EF4444'
                                        }}></div>
                                        {journal.is_published ? (t('published') || 'Published') : (t('notPublished') || 'Not Published')}
                                    </div>
                                </div>
                                        </div>
                                                                        </>
                                )}
                        
                        {/* Second Row: Editor-in-Chief and Editors */}
                        {/* Editor-in-Chief */}
                        <div style={{
                            padding: '20px',
                            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(13, 148, 136, 0.05) 100%)',
                            borderRadius: '16px',
                            border: '1px solid rgba(20, 184, 166, 0.2)',
                            transition: 'all 0.3s ease',
                            gridColumn: '1 / 2',
                            gridRow: '2'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M9 21V12H15V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '700', 
                                            color: '#0D9488',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>{t('editorInChief') || 'Editor-in-Chief'}</div>
                                    </div>
                                    <div style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '700', 
                                        color: '#1E293B',
                                        marginBottom: '4px'
                                    }}>
                                        {editorInChief ? editorInChief.name : (t('none') || 'None')}
                                    </div>
                                    {editorInChief && (
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#64748B',
                                            fontWeight: '500'
                                        }}>
                                            Chief Editorial Officer
                                        </div>
                                    )}
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowEditorInChiefModal(true)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
                                        }}
                                    >
                                        {t('change') || 'Change'}
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Editors */}
                        <div style={{
                            padding: '20px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(29, 78, 216, 0.05) 100%)',
                            borderRadius: '16px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            transition: 'all 0.3s ease',
                            gridColumn: '2 / 4',
                            gridRow: '2'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '700', 
                                            color: '#1D4ED8',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>{t('editors') || 'Editors'}</div>
                                    </div>
                                    <div style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#1E293B',
                                        lineHeight: '1.5',
                                        marginBottom: '4px'
                                    }}>
                                        {editors.length > 0 ? editors.map(editor => editor.name).join(', ') : (t('none') || 'None')}
                                    </div>
                                    <div style={{ 
                                        fontSize: '14px', 
                                        color: '#64748B',
                                        fontWeight: '500'
                                    }}>
                                        {editors.length > 0 ? `${editors.length} Active Editor${editors.length > 1 ? 's' : ''}` : 'No editors assigned'}
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowEditorsModal(true)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                                        }}
                                    >
                                        {t('manage') || 'Manage'}
                                    </button>
                                )}
                            </div>
                                                </div>
                    </div>

                    {canViewJournalFiles && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#1E293B',
                                marginBottom: '20px',
                                letterSpacing: '-0.025em'
                            }}>{t('journalFiles') || 'Journal Files'}</h3>
                            
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px'
                            }}>
                                {journal.cover_photo && (
                                    <a 
                                        href={`/api${journal.cover_photo}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            color: '#0D9488',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                                            e.currentTarget.style.borderColor = '#14B8A6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M4 16L4 10C4 7.79086 5.79086 6 8 6L16 6C18.2091 6 20 7.79086 20 10L20 16M4 16C4 18.2091 5.79086 20 8 20L16 20C18.2091 20 20 18.2091 20 16M4 16L8.5 10.5L13 15L15.5 12.5L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {t('viewCoverPhoto') || 'Cover Photo'}
                                    </a>
                                )}
                                {journal.meta_files && (
                                    <a 
                                        href={`/api${journal.meta_files}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            color: '#0D9488',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                                            e.currentTarget.style.borderColor = '#14B8A6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {t('viewMetaFiles') || 'Meta Files'}
                                    </a>
                                )}
                                {canViewJournalFiles && journal.editor_notes && (
                                    <a 
                                        href={`/api${journal.editor_notes}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            color: '#0D9488',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                                            e.currentTarget.style.borderColor = '#14B8A6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {t('viewEditorNotes') || 'Editor Notes'}
                                    </a>
                                )}
                                {journal.full_pdf && (
                                    <a 
                                        href={`/api${journal.full_pdf}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            color: '#0D9488',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                                            e.currentTarget.style.borderColor = '#14B8A6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {t('viewFullPdf') || 'Full PDF'}
                                    </a>
                                )}
                                {journal.index_section && (
                                    <a 
                                        href={`/api${journal.index_section}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            color: '#14B8A6',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                                            e.currentTarget.style.borderColor = '#14B8A6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M6 2V22M18 7V22M4 7H8M4 12H8M4 17H8M16 12H20M16 17H20M11 7H13M11 12H13M11 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {t('viewIndexSection') || 'Index Section'}
                                    </a>
                                )}
                                {journal.file_path && (
                                    <a 
                                        href={`/api${journal.file_path}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            color: '#14B8A6',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                                            e.currentTarget.style.borderColor = '#14B8A6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 2V8H22L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9H15V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {t('viewMergedFile') || 'Merged File'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#1E293B',
                        marginBottom: '20px',
                        letterSpacing: '-0.025em'
                    }}>{t('entriesInJournal') || 'Entries in this Journal'}</h3>
                    
                    {entries.length === 0 ? (
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
                            }}>📝</div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#64748B',
                                margin: 0
                            }}>{t('noEntriesInJournal') || 'No entries found in this journal.'}</h3>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '24px'
                        }}>
                            {entries.map((entry, index) => (
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
                                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
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
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2" 
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
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
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2" 
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <span>{entry.doi ? entry.doi : 'No DOI available'}</span>
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
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div style={{ marginTop: '16px', marginBottom: '0px' }}>
                    <div className="transparent-footer">
                        <Footer />
                    </div>
                </div>
            </div>
            
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
                .transparent-footer .footer-content {
                    background: transparent !important;
                    border-top: none !important;
                                 }
             `}</style>

            {showEditorInChiefModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>{t('selectEditorInChief') || 'Select Editor-in-Chief'}</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowEditorInChiefModal(false)}
                                disabled={isSubmittingEditors}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {adminUsers.length === 0 ? (
                                <div className="empty-state">
                                    <p>{t('noAdminUsers') || 'No admin users found'}</p>
                                </div>
                            ) : (
                                <div className="radio-group">
                                    {adminUsers.map(admin => (
                                        <div key={admin.id} className="radio-item">
                                            <input
                                                type="radio"
                                                id={`admin-${admin.id}`}
                                                name="editorInChief"
                                                value={admin.id}
                                                checked={selectedEditorInChiefId === admin.id}
                                                onChange={() => setSelectedEditorInChiefId(admin.id)}
                                                disabled={isSubmittingEditors}
                                            />
                                            <label htmlFor={`admin-${admin.id}`}>{admin.name} ({admin.email})</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowEditorInChiefModal(false)}
                                disabled={isSubmittingEditors}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSetEditorInChief}
                                disabled={!selectedEditorInChiefId || isSubmittingEditors}
                            >
                                {isSubmittingEditors ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showEditorsModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>{t('manageEditors') || 'Manage Editors'}</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowEditorsModal(false)}
                                disabled={isSubmittingEditors}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {editorUsers.length === 0 ? (
                                <div className="empty-state">
                                    <p>{t('noEditorUsers') || 'No editor users found'}</p>
                                </div>
                            ) : (
                                <div className="checkbox-group">
                                    {editorUsers.map(editor => (
                                        <div key={editor.id} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                id={`editor-${editor.id}`}
                                                value={editor.id}
                                                checked={selectedEditorIds.includes(editor.id)}
                                                onChange={() => {
                                                    if (selectedEditorIds.includes(editor.id)) {
                                                        setSelectedEditorIds(selectedEditorIds.filter(id => id !== editor.id));
                                                    } else {
                                                        setSelectedEditorIds([...selectedEditorIds, editor.id]);
                                                    }
                                                }}
                                                disabled={isSubmittingEditors}
                                            />
                                            <label htmlFor={`editor-${editor.id}`}>{editor.name} ({editor.email})</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowEditorsModal(false)}
                                disabled={isSubmittingEditors}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpdateEditors}
                                disabled={isSubmittingEditors}
                            >
                                {isSubmittingEditors ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JournalDetailsPage; 