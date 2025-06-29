import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';
import Footer from '../components/Footer';
import { HiMail, HiUser, HiCalendar, HiLocationMarker, HiUserGroup, HiDocumentText, HiAcademicCap } from 'react-icons/hi';
import { PiSubtitlesFill } from "react-icons/pi";
import './JournalEntryUpdateDetailsPage.css'; // Import toast styles

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

const JournalDetailsPage: React.FC = () => {
    const { journalId } = useParams<{ journalId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [journal, setJournal] = useState<apiService.Journal | null>(null);
    const [entries, setEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editorInChief, setEditorInChief] = useState<apiService.UserRead | null>(null);
    const [editors, setEditors] = useState<apiService.UserRead[]>([]);
    
    // Toast notification state
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'warning'>('success');
    
    const { isAuthenticated, user } = useAuth();
    const { t, language } = useLanguage();
    const { activeJournal, setActiveJournal } = useActiveJournal();
    const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'owner');
    const isEditor = isAuthenticated && user && user.role === 'editor';
    const isEditorOrAdmin = isAuthenticated && user && (isEditor || isAdmin);
    
    // Check if current user is the editor-in-chief of this journal
    const isEditorInChief = isAuthenticated && user && journal && journal.editor_in_chief_id === user.id;
    
    // Admin/Owner only access
    const isAdminOnly = isAdmin;
    
    // Admin/Owner/Editor-in-Chief of this journal access
    const canManageJournal = isAdmin || isEditorInChief;
    
    // Check if current user can view journal files (admin/owner or editor related to this journal)
    // Note: This is now only used for viewing journal files that regular editors can access
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
    const [editorSearchQuery, setEditorSearchQuery] = useState<string>('');
    const [isMerging, setIsMerging] = useState<boolean>(false);
    const [mergeError, setMergeError] = useState<string | null>(null);

    // User details modal state
    const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<apiService.UserRead | null>(null);
    const [selectedUserRole, setSelectedUserRole] = useState<'editor-in-chief' | 'editor' | null>(null);

    // Check for success parameter and show toast
    useEffect(() => {
        const created = searchParams.get('created');
        const updated = searchParams.get('updated');
        const deleted = searchParams.get('deleted');
        
        if (created === 'true') {
            setToastMessage(t('journalCreatedSuccessfully') || 'Journal created successfully!');
            setToastType('success');
            setShowToast(true);
            
            // Remove the parameter from URL
            searchParams.delete('created');
            setSearchParams(searchParams, { replace: true });
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
        } else if (updated === 'true') {
            setToastMessage(language === 'tr' 
                ? 'Dergi başarıyla güncellendi' 
                : 'Journal updated successfully');
            setToastType('success');
            setShowToast(true);
            
            // Remove the parameter from URL
            searchParams.delete('updated');
            setSearchParams(searchParams, { replace: true });
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
        } else if (deleted === 'true') {
            setToastMessage(language === 'tr' 
                ? 'Dergi başarıyla silindi. Tüm makaleler varsayılan dergiye taşındı.' 
                : 'Journal deleted successfully. All entries have been reassigned to the default journal.');
            setToastType('success');
            setShowToast(true);
            
            // Remove the parameter from URL
            searchParams.delete('deleted');
            setSearchParams(searchParams, { replace: true });
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
        }
    }, [searchParams, setSearchParams, t, language]);

    useEffect(() => {
        const fetchJournalAndEntries = async () => {
            if (!journalId) return;
            
            setLoading(true);
            setError(null);
            try {
                let journalData;
                let entriesData;

                if (isAdmin) {
                    // Admins can see all journals
                    const [journalsData, fetchedEntries] = await Promise.all([
                        apiService.getJournals(),
                        apiService.getEntriesByJournal(parseInt(journalId))
                    ]);
                    journalData = journalsData.find(j => j.id === parseInt(journalId));
                    entriesData = fetchedEntries;
                } else if (isEditor) {
                    // Editors can see journals they're assigned to OR any published journal
                    try {
                        // First try to get the journal from their assigned journals
                        const editorJournalsData = await apiService.getEditorJournals();
                        journalData = editorJournalsData.find(j => j.id === parseInt(journalId));
                        
                        if (journalData) {
                            // Editor has access to this journal, get all entries
                            const fetchedEntries = await apiService.getEntriesByJournal(parseInt(journalId));
                            entriesData = fetchedEntries;
                        } else {
                            // Not in their assigned journals, check if it's a published journal
                            const [publishedJournals, publishedEntries] = await Promise.all([
                                apiService.getPublishedJournals(),
                                apiService.getPublishedJournalEntries(parseInt(journalId))
                            ]);
                            journalData = publishedJournals.find(j => j.id === parseInt(journalId));
                            entriesData = publishedEntries;
                            
                            if (!journalData) {
                                // Journal doesn't exist or is not published and editor is not assigned
                                throw new Error('Access denied: You are not assigned to this journal and it is not published');
                            }
                        }
                    } catch (err: any) {
                        // If there's an API error, fall back to checking published journals only
                        const [publishedJournals, publishedEntries] = await Promise.all([
                            apiService.getPublishedJournals(),
                            apiService.getPublishedJournalEntries(parseInt(journalId))
                        ]);
                        journalData = publishedJournals.find(j => j.id === parseInt(journalId));
                        entriesData = publishedEntries;
                        
                        if (!journalData) {
                            throw new Error('Access denied: You are not assigned to this journal and it is not published');
                        }
                    }
                } else if (isAuthenticated) {
                    // Other authenticated users can only see published journals
                    const [journals, entries] = await Promise.all([
                        apiService.getPublishedJournals(),
                        apiService.getPublishedJournalEntries(parseInt(journalId))
                    ]);
                    journalData = journals.find(j => j.id === parseInt(journalId));
                    entriesData = entries;
                } else {
                    // Unauthenticated users can only see published journals
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
                if (err.message === 'Access denied: You are not assigned to this journal and it is not published') {
                    setError(t('accessDeniedNotAssignedToJournal') || 'Access denied: You are not assigned to this journal and it is not published');
                } else if (err.message === 'Access denied: You are not assigned to this journal') {
                    setError(t('accessDeniedNotAssignedToJournal') || 'Access denied: You are not assigned to this journal');
                } else {
                    setError(err.response?.data?.detail || t('failedToLoadJournalData') || 'Failed to load journal data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchJournalAndEntries();
    }, [journalId, isEditor, isAdmin, isAuthenticated, t]);

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
        const isModalOpen = showEditorInChiefModal || showEditorsModal || showUserDetailsModal;
        
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showEditorInChiefModal, showEditorsModal, showUserDetailsModal]);

    // Handle ESC key to close modals
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showUserDetailsModal) {
                    setShowUserDetailsModal(false);
                } else if (showEditorInChiefModal && !isSubmittingEditors) {
                    setShowEditorInChiefModal(false);
                } else if (showEditorsModal && !isSubmittingEditors) {
                    setShowEditorsModal(false);
                }
            }
        };

        if (showEditorInChiefModal || showEditorsModal || showUserDetailsModal) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showEditorInChiefModal, showEditorsModal, showUserDetailsModal, isSubmittingEditors]);

    // Reset editor search when modal closes
    useEffect(() => {
        if (!showEditorsModal) {
            setEditorSearchQuery('');
        }
    }, [showEditorsModal]);

    // Filter editors based on search query
    const filteredEditorUsers = editorUsers.filter(editor =>
        editor.name.toLowerCase().includes(editorSearchQuery.toLowerCase())
    );

    const handleSetActive = async () => {
        if (!journal) return;
        
        try {
            await apiService.updateSettings({ active_journal_id: journal.id });
            setActiveJournal(journal);
            
            // Show success toast
            setToastMessage(language === 'tr' 
                ? 'Dergi aktif dergi olarak ayarlandı' 
                : 'Journal set as active successfully');
            setToastType('success');
            setShowToast(true);
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
        } catch (err: any) {
            console.error("Failed to set active journal:", err);
            setError(err.response?.data?.detail || 'Failed to set active journal.');
            
            // Show error toast
            setToastMessage(err.response?.data?.detail || (language === 'tr' 
                ? 'Dergi aktif olarak ayarlanamadı' 
                : 'Failed to set journal as active'));
            setToastType('warning');
            setShowToast(true);
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
        }
    };

    // Handle clicking on editor-in-chief or editor to show details
    const handleUserClick = (user: apiService.UserRead, role: 'editor-in-chief' | 'editor') => {
        setSelectedUser(user);
        setSelectedUserRole(role);
        setShowUserDetailsModal(true);
    };

    const handleGoToProfile = (userId: number) => {
        navigate(`/admin/users/profile/${userId}`);
        setShowUserDetailsModal(false);
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
            
            // Show success toast
            setToastMessage(language === 'tr' 
                ? 'Dergi dosyaları başarıyla birleştirildi' 
                : 'Journal files merged successfully');
            setToastType('success');
            setShowToast(true);
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
            
        } catch (err: any) {
            console.error('Failed to merge journal files:', err);
            setMergeError(err.response?.data?.detail || t('failedToMergeFiles') || 'Failed to merge journal files.');
            
            // Show error toast
            setToastMessage(err.response?.data?.detail || (language === 'tr' 
                ? 'Dergi dosyaları birleştirilemedi' 
                : 'Failed to merge journal files'));
            setToastType('warning');
            setShowToast(true);
            
            // Hide toast after 4 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 4000);
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
                    {/* Background Pattern */}
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
                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                            borderRadius: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            boxShadow: '0 20px 40px rgba(20, 184, 166, 0.2)',
                            animation: 'bounceIn 0.8s ease-out'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V9A2 2 0 0 1 6 7H18A2 2 0 0 1 20 9V17H6.5A2.5 2.5 0 0 0 4 19.5Z" 
                                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 11H16M8 15H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#1E293B',
                            marginBottom: '16px',
                            letterSpacing: '-0.025em',
                            background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>{language === 'en' ? 'Journal Not Found!' : 'Aradığınız Dergi Bulunamadı!'}</h1>
                        
                        <p style={{
                            fontSize: '18px',
                            color: '#64748B',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                            fontWeight: '500'
                        }}>{t('failedToLoadJournalData') || 'Failed to load journal data.'}</p>
                        
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={() => navigate('/archive')}
                                style={{
                                    padding: '16px 32px',
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(20, 184, 166, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('backToArchive') || 'Back to Archive'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>{`
                    @keyframes bounceIn {
                        0% {
                            opacity: 0;
                            transform: scale(0.3);
                        }
                        50% {
                            opacity: 1;
                            transform: scale(1.05);
                        }
                        70% {
                            transform: scale(0.9);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>
            </div>
        );
    }

    if (!journal) {
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
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-30%',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        zIndex: 0
                    }}></div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto 32px',
                            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                            borderRadius: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            boxShadow: '0 20px 40px rgba(20, 184, 166, 0.2)',
                            animation: 'bounceIn 0.8s ease-out'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V9A2 2 0 0 1 6 7H18A2 2 0 0 1 20 9V17H6.5A2.5 2.5 0 0 0 4 19.5Z" 
                                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 11H16M8 15H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#1E293B',
                            marginBottom: '16px',
                            letterSpacing: '-0.025em',
                            background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>{language === 'en' ? 'Journal Not Found!' : 'Aradığınız Dergi Bulunamadı!'}</h1>
                        
                        <p style={{
                            fontSize: '18px',
                            color: '#64748B',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                            fontWeight: '500'
                        }}>The journal you're looking for doesn't exist or may have been moved. Let's get you back on track!</p>
                        
                        <div style={{
                            padding: '20px',
                            background: 'rgba(20, 184, 166, 0.05)',
                            borderRadius: '16px',
                            border: '1px solid rgba(20, 184, 166, 0.2)',
                            marginBottom: '32px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: '#0D9488',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('journalNotFound') || 'This journal could not be found in our database'}
                            </div>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={() => navigate('/archive')}
                                style={{
                                    padding: '16px 32px',
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(20, 184, 166, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('backToArchive') || 'Browse Archive'}
                            </button>
                            
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    padding: '16px 32px',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    color: '#64748B',
                                    border: '2px solid rgba(100, 116, 139, 0.2)',
                                    borderRadius: '16px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)';
                                    e.currentTarget.style.borderColor = '#64748B';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" 
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('goHome') || 'Go Home'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>{`
                    @keyframes bounceIn {
                        0% {
                            opacity: 0;
                            transform: scale(0.3);
                        }
                        50% {
                            opacity: 1;
                            transform: scale(1.05);
                        }
                        70% {
                            transform: scale(0.9);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <>
            {/* Title Section */}
            <div className="page-title-section" style={{ marginLeft: '60px' }}>
                <div className="page-title-header">
                    <div className="page-title-back-button">
                        <button 
                            onClick={() => navigate(journal?.is_published ? '/archive' : (isEditorOrAdmin ? '/editor/journals' : '/archive'))} 
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
                            {journal?.is_published ? (t('backToArchive') || 'Back to Archive') : (isEditorOrAdmin ? (t('backToJournals') || 'Back to Journals') : (t('backToArchive') || 'Back to Archive'))}
                        </button>
                    </div>
                    
                    <div className="page-title-actions">
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
                        
                        {/* Set as Active button - Admin/Owner only */}
                        {isAdminOnly && activeJournal?.id !== journal.id && (
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
                        
                        {/* Merge and Edit buttons - Admin/Owner/Editor-in-Chief only */}
                        {canManageJournal && (
                            <>
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
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 12px 12px 0' }}>
                            {language === 'en' && journal.title_en ? journal.title_en : journal.title}
                            <span style={{
                                fontSize: '21px',
                                fontWeight: '500',
                                color: '#64748B',
                                letterSpacing: '0.25px',
                                marginLeft: '8px'
                            }}>
                                • {journal.issue}
                            </span>
                        </h1>
                    </div>
                </div>
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

                {/* Editor-in-Chief and Editors Section - Side by Side */}
                <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.5fr',
                        gap: '24px',
                        marginBottom: '32px'
                    }}>
                        {/* Editor-in-Chief Section */}
                        <div style={{
                            padding: '32px',
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100%',
                                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f1f5f9" fill-opacity="0.3"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
                                opacity: 0.3,
                                zIndex: 0
                            }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                                                <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <HiAcademicCap size={16} color="white" />
                        </div>
                                        <h3 style={{
                                            fontSize: '24px',
                                            fontWeight: '800',
                                            color: '#0F172A',
                                            margin: 0,
                                            letterSpacing: '-0.025em',
                                            background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}>{t('editorInChief') || 'Editor-in-Chief'}</h3>
                                    </div>
                                    {isAdminOnly && (
                                        <button
                                            onClick={() => setShowEditorInChiefModal(true)}
                                            style={{
                                                padding: '8px 12px',
                                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {language === 'tr' ? 'Baş Editörü Değiştir' : 'Change Editor-in-Chief'}
                                        </button>
                                    )}
                                </div>
                                <div style={{
                                    width: '50px',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
                                    borderRadius: '2px',
                                    marginLeft: '44px',
                                    marginBottom: '20px'
                                }}></div>
                                
                                {editorInChief ? (
                                    <div 
                                        onClick={() => handleUserClick(editorInChief, 'editor-in-chief')}
                                        style={{
                                            padding: '20px',
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(226, 232, 240, 0.6)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                                            e.currentTarget.style.borderColor = '#8B5CF6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Subtle background pattern */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            right: '-30%',
                                            width: '120px',
                                            height: '120px',
                                            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                                            borderRadius: '50%',
                                            zIndex: 0
                                        }}></div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, zIndex: 1 }}>
                                            {/* User Avatar/Icon */}
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'rgba(100, 116, 139, 0.1)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                border: '1px solid rgba(100, 116, 139, 0.2)'
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            {/* User Info */}
                                                                        <div style={{ flex: 1 }}>
                                <div style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#1E293B'
                                }}>{editorInChief.name}</div>
                                {editorInChief.title && (
                                    <p style={{
                                        fontSize: '13px',
                                        color: '#64748B',
                                        margin: '4px 0 0 0',
                                        fontWeight: '500'
                                    }}>
                                        {editorInChief.title}
                                    </p>
                                )}
                            </div>
                                        </div>
                                        

                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '12px 20px',
                                        textAlign: 'center',
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        borderRadius: '16px',
                                        border: '2px dashed #E2E8F0'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            margin: '0 auto 8px',
                                            background: '#F1F5F9',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '18px'
                                        }}><HiAcademicCap size={20} color="#64748B" /></div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#64748B'
                                        }}>{language === 'tr' ? 'Baş Editör Atanmamıştır' : 'No Editor-in-Chief Assigned'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Publication Details Section */}
                        <div style={{
                            padding: '32px',
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100%',
                                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f1f5f9" fill-opacity="0.3"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
                                opacity: 0.3,
                                zIndex: 0
                            }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M8 2V5M16 2V5M3.5 9H20.5M21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '800',
                                        color: '#0F172A',
                                        margin: 0,
                                        letterSpacing: '-0.025em',
                                        background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>{language === 'tr' ? 'Yayın Bilgileri' : 'Publication Information'}</h3>
                                </div>
                                <div style={{
                                    width: '50px',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)',
                                    borderRadius: '2px',
                                    marginLeft: '44px',
                                    marginBottom: '20px'
                                }}></div>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 0.5fr))',
                                    gap: '16px'
                                }}>
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
                                                background: 'rgba(100, 116, 139, 0.1)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <HiCalendar size={20} color="#64748B" />
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
                                                background: 'rgba(100, 116, 139, 0.1)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <HiLocationMarker size={20} color="#64748B" />
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
                                    
                                    {/* Empty state if no publication info */}
                                    {!journal.publication_date && !journal.publication_place && (
                                        <div style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            background: 'rgba(255, 255, 255, 0.6)',
                                            borderRadius: '16px',
                                            border: '2px dashed #E2E8F0'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                margin: '0 auto 8px',
                                                background: '#F1F5F9',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px'
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M8 2V5M16 2V5M3.5 9H20.5M21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: '#64748B'
                                            }}>{language === 'tr' ? 'Yayın bilgisi mevcut değil' : 'No publication information available'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Full Width Editors Section */}
                <div style={{
                    padding: '32px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(226, 232, 240, 0.6)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f1f5f9" fill-opacity="0.3"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
                        opacity: 0.3,
                        zIndex: 0
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: '#0F172A',
                                    margin: 0,
                                    letterSpacing: '-0.025em',
                                    background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>{t('editors') || 'Editors'}</h3>
                            </div>
                            {isAdminOnly && (
                                <button
                                    onClick={() => setShowEditorsModal(true)}
                                    style={{
                                        padding: '8px 12px',
                                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {t('manageEditors') || 'Manage Editors'}
                                </button>
                            )}
                        </div>
                        <div style={{
                            width: '50px',
                            height: '3px',
                            background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)',
                            borderRadius: '2px',
                            marginLeft: '44px',
                            marginBottom: '20px'
                        }}></div>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '16px'
                        }}>
                            {editors.length > 0 ? (
                                editors.map(editor => (
                                    <div 
                                        key={editor.id} 
                                        onClick={() => handleUserClick(editor, 'editor')}
                                        style={{
                                            padding: '20px',
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(226, 232, 240, 0.6)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                                            e.currentTarget.style.borderColor = '#3B82F6';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Subtle background pattern */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            right: '-30%',
                                            width: '120px',
                                            height: '120px',
                                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                                            borderRadius: '50%',
                                            zIndex: 0
                                        }}></div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, zIndex: 1 }}>
                                            {/* User Avatar/Icon */}
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'rgba(100, 116, 139, 0.1)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                border: '1px solid rgba(100, 116, 139, 0.2)'
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            
                                            {/* User Info */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: '600', 
                                                    color: '#1E293B'
                                                }}>{editor.name}</div>
                                                {editor.title && (
                                                    <p style={{
                                                        fontSize: '13px',
                                                        color: '#64748B',
                                                        margin: '4px 0 0 0',
                                                        fontWeight: '500'
                                                    }}>
                                                        {editor.title}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    borderRadius: '16px',
                                    border: '2px dashed #E2E8F0'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        margin: '0 auto 16px',
                                        background: '#F1F5F9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                    }}><HiUserGroup size={28} color="#64748B" /></div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        color: '#64748B'
                                    }}>{language === 'tr' ? 'Dergiye Editör Atanmamıştır' : 'No Editors Assigned to this Journal'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Publication Details Section */}
                {canManageJournal && (
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
                                fontSize: '24px',
                                fontWeight: '800',
                                color: '#0F172A',
                                margin: 0,
                                letterSpacing: '-0.025em',
                                background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>{t('publicationDetails') || 'Publication Details'}</h3>
                        </div>
                        <div style={{
                            width: '60px',
                            height: '4px',
                            background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)',
                            borderRadius: '2px',
                            marginLeft: '52px'
                        }}></div>
                    </div>
                    
                    {/* Publication Information Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '20px',
                        position: 'relative',
                        zIndex: 1
                    }}>
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
                                                background: 'rgba(100, 116, 139, 0.1)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <HiCalendar size={20} color="#64748B" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontSize: '13px', 
                                        fontWeight: '600',
                                                    color: '#64748B',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '4px'
                                                }}>{t('creationDate')}</div>
                                                <div style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: '600', 
                                                    color: '#1E293B'
                                                }}>{journal.created_date ? new Date(journal.created_date).toLocaleDateString() : t('notSet')}</div>
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
                                            border: '1px solid rgba(226, 232, 240, 0.6)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                background: journal.is_published 
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : '#FDE68A',
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
                                                        <path d="M12 6V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                                                    color: journal.is_published ? '#059669' : '#92400E',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: journal.is_published ? '#10B981' : '#FDE68A'
                                        }}></div>
                                        {journal.is_published ? (t('published') || 'Published') : (t('inProgress') || 'In Progress')}
                                    </div>
                                </div>
                                                                                </div>
                                                                        </>
                                )}
                    </div>
                </div>
                )}

                {/* Publication Files Section */}
                {canManageJournal && (
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
                                        <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M13 2V9H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: '#0F172A',
                                    margin: 0,
                                    letterSpacing: '-0.025em',
                                    background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>{t('publicationFiles') || 'Publication Files'}</h3>
                            </div>
                            <div style={{
                                width: '60px',
                                height: '4px',
                                background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)',
                                borderRadius: '2px',
                                marginLeft: '52px'
                            }}></div>
                        </div>
                        
                        {/* Files Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '16px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {journal.cover_photo && (
                                <button 
                                    onClick={() => window.open(`/api${journal.cover_photo}`, '_blank')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                        e.currentTarget.style.borderColor = '#8B5CF6';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
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
                                            <path d="M4 16L4 10C4 7.79086 5.79086 6 8 6L16 6C18.2091 6 20 7.79086 20 10L20 16M4 16C4 18.2091 5.79086 20 8 20L16 20C18.2091 20 20 18.2091 20 16M4 16L8.5 10.5L13 15L15.5 12.5L20 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}>{t('coverPhoto')}</div>
                                    </div>
                                </button>
                            )}
                            
                            {journal.meta_files && (
                                <a 
                                    href={`/api${journal.meta_files}`}
                                    download
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                                        e.currentTarget.style.borderColor = '#06B6D4';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(6, 182, 212, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
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
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}>{t('metaFiles')}</div>
                                    </div>
                                </a>
                            )}
                            
                            {canManageJournal && journal.editor_notes && (
                                <a 
                                    href={`/api${journal.editor_notes}`}
                                    download
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                                        e.currentTarget.style.borderColor = '#F59E0B';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}>{t('editorNotes')}</div>
                                    </div>
                                </a>
                            )}
                            
                            {journal.full_pdf && (
                                <a 
                                    href={`/api${journal.full_pdf}`}
                                    download
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.borderColor = '#EF4444';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}>{t('fullPdf')}</div>
                                    </div>
                                </a>
                            )}
                            
                            {journal.index_section && (
                                <a 
                                    href={`/api${journal.index_section}`}
                                    download
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                        e.currentTarget.style.borderColor = '#10B981';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
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
                                            <path d="M6 2V22M18 7V22M4 7H8M4 12H8M4 17H8M16 12H20M16 17H20M11 7H13M11 12H13M11 17H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}>{t('indexSection')}</div>
                                    </div>
                                </a>
                            )}
                            
                            {journal.file_path && (
                                <a 
                                    href={`/api${journal.file_path}`}
                                    download
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                        e.currentTarget.style.borderColor = '#3B82F6';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
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
                                            <path d="M16 2V8H22L16 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9H15V2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            color: '#1E293B',
                                            letterSpacing: '0.5px'
                                        }}>{t('mergedFile')}</div>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Editor-in-Chief and Editors Section - Side by Side */}


                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        color: '#0F172A',
                        margin: 0,
                        marginBottom: '20px',
                        letterSpacing: '-0.025em',
                        background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
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
                            }}><HiDocumentText size={36} color="#64748B" /></div>
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
                                        {(language === 'en' && entry.keywords_en ? entry.keywords_en : entry.keywords) ? (
                                            <>
                                                <span style={{ 
                                                    fontWeight: '600', 
                                                    color: '#475569',
                                                    marginRight: '8px'
                                                }}>{language === 'tr' ? 'Anahtar Kelimeler:' : 'Keywords:'}</span>
                                                {language === 'en' && entry.keywords_en ? entry.keywords_en : entry.keywords}
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
                                                    <span>{entry.doi ? entry.doi : t('notAvailable')}</span>
                                                </div>
                                            ) : entry.status ? (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    background: entry.status === 'accepted' ? '#10B981' :
                                                               entry.status === 'not_accepted' ? '#FCA5A5' : 
                                                               entry.status === 'waiting_for_payment' ? '#FDE68A' : 
                                                               entry.status === 'waiting_for_authors' ? '#FED7AA' :
                                                               entry.status === 'waiting_for_referees' ? '#DDD6FE' :
                                                               entry.status === 'waiting_for_editors' ? '#BFDBFE' :
                                                               entry.status === 'rejected' ? '#FCA5A5' : 
                                                               entry.status === 'pending' ? '#FDE68A' : '#D1D5DB',
                                                    color: entry.status === 'accepted' ? 'white' :
                                                          entry.status === 'not_accepted' ? '#991B1B' : 
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
                                                    <span>{entry.doi ? entry.doi : t('notAvailable')}</span>
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
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: '0',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '80vh',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '32px 32px 0 32px',
                            borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1E293B',
                                letterSpacing: '-0.025em'
                            }}>{t('selectEditorInChief') || 'Select Editor-in-Chief'}</h3>
                            <button 
                                onClick={() => setShowEditorInChiefModal(false)}
                                disabled={isSubmittingEditors}
                                style={{
                                    background: 'rgba(148, 163, 184, 0.1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                    fontSize: '20px',
                                    color: '#64748B',
                                    transition: 'all 0.3s ease',
                                    marginBottom: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.color = '#EF4444';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                                        e.currentTarget.style.color = '#64748B';
                                    }
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ 
                            padding: '32px',
                            maxHeight: '50vh', 
                            overflowY: 'auto'
                        }}>
                            {adminUsers.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#64748B'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        margin: '0 auto 16px',
                                        background: '#F1F5F9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                    }}>👥</div>
                                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                                        {t('noAdminUsers') || 'No admin users found'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {adminUsers.map(admin => (
                                        <label 
                                            key={admin.id} 
                                            htmlFor={`admin-${admin.id}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px 20px',
                                                background: selectedEditorInChiefId === admin.id 
                                                    ? 'rgba(139, 92, 246, 0.1)' 
                                                    : 'rgba(255, 255, 255, 0.5)',
                                                borderRadius: '16px',
                                                border: `2px solid ${selectedEditorInChiefId === admin.id 
                                                    ? '#8B5CF6' 
                                                    : 'rgba(226, 232, 240, 0.5)'}`,
                                                cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.3s ease',
                                                opacity: isSubmittingEditors ? 0.7 : 1
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSubmittingEditors && selectedEditorInChiefId !== admin.id) {
                                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                                                    e.currentTarget.style.borderColor = '#8B5CF6';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSubmittingEditors && selectedEditorInChiefId !== admin.id) {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                                                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                                                }
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                id={`admin-${admin.id}`}
                                                name="editorInChief"
                                                value={admin.id}
                                                checked={selectedEditorInChiefId === admin.id}
                                                onChange={() => setSelectedEditorInChiefId(admin.id)}
                                                disabled={isSubmittingEditors}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    accentColor: '#8B5CF6'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: '#1E293B',
                                                    marginBottom: '4px'
                                                }}>{admin.name}</div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#64748B'
                                                }}>{admin.email}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{
                            padding: '24px 32px 32px 32px',
                            borderTop: '1px solid rgba(226, 232, 240, 0.5)',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowEditorInChiefModal(false)}
                                disabled={isSubmittingEditors}
                                style={{
                                    padding: '12px 24px',
                                    background: 'rgba(148, 163, 184, 0.1)',
                                    color: '#64748B',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: isSubmittingEditors ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                                        e.currentTarget.style.borderColor = '#94A3B8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                                    }
                                }}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleSetEditorInChief}
                                disabled={!selectedEditorInChiefId || isSubmittingEditors}
                                style={{
                                    padding: '12px 24px',
                                    background: (!selectedEditorInChiefId || isSubmittingEditors) 
                                        ? '#94A3B8' 
                                        : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: (!selectedEditorInChiefId || isSubmittingEditors) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (!selectedEditorInChiefId || isSubmittingEditors) 
                                        ? 'none' 
                                        : '0 4px 12px rgba(139, 92, 246, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedEditorInChiefId && !isSubmittingEditors) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedEditorInChiefId && !isSubmittingEditors) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                                    }
                                }}
                            >
                                {isSubmittingEditors ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showEditorsModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: '0',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '80vh',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '32px 32px 0 32px',
                            borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1E293B',
                                letterSpacing: '-0.025em'
                            }}>{t('manageEditors') || 'Manage Editors'}</h3>
                            <button 
                                onClick={() => setShowEditorsModal(false)}
                                disabled={isSubmittingEditors}
                                style={{
                                    background: 'rgba(148, 163, 184, 0.1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                    fontSize: '20px',
                                    color: '#64748B',
                                    transition: 'all 0.3s ease',
                                    marginBottom: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.color = '#EF4444';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                                        e.currentTarget.style.color = '#64748B';
                                    }
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ 
                            padding: '32px',
                            maxHeight: '50vh', 
                            overflowY: 'auto'
                        }}>
                            {/* Search Input */}
                            <div style={{
                                marginBottom: '24px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#64748B',
                                    zIndex: 1
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder={language === 'tr' ? 'Editörlerin isimlerini ara...' : 'Search editors by name...'}
                                    value={editorSearchQuery}
                                    onChange={(e) => setEditorSearchQuery(e.target.value)}
                                    disabled={isSubmittingEditors}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        border: '2px solid rgba(226, 232, 240, 0.5)',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#1E293B',
                                        outline: 'none',
                                        transition: 'all 0.3s ease',
                                        opacity: isSubmittingEditors ? 0.7 : 1
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#3B82F6';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            
                            {editorUsers.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#64748B'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        margin: '0 auto 16px',
                                        background: '#F1F5F9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                                        {language === 'tr' ? 'Editör kullanıcısı bulunamadı' : 'No editor users found'}
                                    </p>
                                </div>
                            ) : filteredEditorUsers.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#64748B'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        margin: '0 auto 16px',
                                        background: '#F1F5F9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                                                         }}>
                                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                             <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                         </svg>
                                     </div>
                                     <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                                         {language === 'tr' ? `"${editorSearchQuery}" ile eşleşen editör bulunamadı` : `No editors found matching "${editorSearchQuery}"`}
                                    </p>
                                    <button
                                        onClick={() => setEditorSearchQuery('')}
                                        style={{
                                            marginTop: '12px',
                                            padding: '8px 16px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: '#3B82F6',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                            e.currentTarget.style.borderColor = '#3B82F6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                        }}
                                    >
                                                                                 {language === 'tr' ? 'Aramayı Temizle' : 'Clear Search'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {filteredEditorUsers.map(editor => (
                                        <label
                                            key={editor.id}
                                            htmlFor={`editor-${editor.id}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px 20px',
                                                background: selectedEditorIds.includes(editor.id)
                                                    ? 'rgba(59, 130, 246, 0.1)'
                                                    : 'rgba(255, 255, 255, 0.5)',
                                                borderRadius: '16px',
                                                border: `2px solid ${selectedEditorIds.includes(editor.id)
                                                    ? '#3B82F6'
                                                    : 'rgba(226, 232, 240, 0.5)'}`,
                                                cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.3s ease',
                                                opacity: isSubmittingEditors ? 0.7 : 1
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSubmittingEditors && !selectedEditorIds.includes(editor.id)) {
                                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                                    e.currentTarget.style.borderColor = '#3B82F6';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSubmittingEditors && !selectedEditorIds.includes(editor.id)) {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                                                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                                                }
                                            }}
                                        >
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
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    accentColor: '#3B82F6'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: '#1E293B',
                                                    marginBottom: '4px'
                                                }}>{editor.name}</div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#64748B'
                                                }}>{editor.email}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{
                            padding: '24px 32px 32px 32px',
                            borderTop: '1px solid rgba(226, 232, 240, 0.5)',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowEditorsModal(false)}
                                disabled={isSubmittingEditors}
                                style={{
                                    padding: '12px 24px',
                                    background: 'rgba(148, 163, 184, 0.1)',
                                    color: '#64748B',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: isSubmittingEditors ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                                        e.currentTarget.style.borderColor = '#94A3B8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                                    }
                                }}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleUpdateEditors}
                                disabled={isSubmittingEditors}
                                style={{
                                    padding: '12px 24px',
                                    background: isSubmittingEditors 
                                        ? '#94A3B8' 
                                        : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isSubmittingEditors ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isSubmittingEditors 
                                        ? 'none' 
                                        : '0 4px 12px rgba(59, 130, 246, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSubmittingEditors) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                                    }
                                }}
                            >
                                {isSubmittingEditors ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserDetailsModal && selectedUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
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
                            background: selectedUserRole === 'editor-in-chief' 
                                ? 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}></div>

                        {/* Header */}
                        <div style={{
                            padding: '32px 32px 24px 32px',
                            borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: selectedUserRole === 'editor-in-chief' 
                                            ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                                            : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: selectedUserRole === 'editor-in-chief' 
                                            ? '0 8px 16px rgba(139, 92, 246, 0.3)'
                                            : '0 8px 16px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: '#1E293B',
                                        margin: 0,
                                        letterSpacing: '-0.025em'
                                    }}>{language === 'tr' ? 'Editör Detayları' : 'User Details'}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {/* Go to Profile Button - Only for Admin users */}
                                    {isAdminOnly && (
                                        <button
                                            onClick={() => handleGoToProfile(selectedUser.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '10px 12px',
                                                backgroundColor: selectedUserRole === 'editor-in-chief' ? '#8B5CF6' : '#3B82F6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: selectedUserRole === 'editor-in-chief' 
                                                    ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                                                    : '0 4px 12px rgba(59, 130, 246, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = selectedUserRole === 'editor-in-chief' ? '#7C3AED' : '#1D4ED8';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = selectedUserRole === 'editor-in-chief' 
                                                    ? '0 8px 20px rgba(139, 92, 246, 0.4)'
                                                    : '0 8px 20px rgba(59, 130, 246, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = selectedUserRole === 'editor-in-chief' ? '#8B5CF6' : '#3B82F6';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = selectedUserRole === 'editor-in-chief' 
                                                    ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                                                    : '0 4px 12px rgba(59, 130, 246, 0.3)';
                                            }}
                                            title={t('goToProfile') || 'Go to Profile'}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            {language === 'tr' ? 'Profile Git' : 'View Profile'}
                                        </button>
                                    )}
                        <button
                            onClick={() => setShowUserDetailsModal(false)}
                            style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                border: 'none',
                                            background: 'rgba(148, 163, 184, 0.1)',
                                            color: '#64748B',
                                fontSize: '20px',
                                            fontWeight: '500',
                                cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                            justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                                e.currentTarget.style.color = '#64748B';
                            }}
                        >
                            ×
                        </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{
                            padding: '32px',
                            position: 'relative',
                            zIndex: 1,
                            overflowY: 'auto',
                            maxHeight: 'calc(80vh - 140px)'
                        }}>
                            <div style={{
                                display: 'grid',
                                gap: '24px'
                            }}>
                                {/* Name */}
                                <div style={{
                                    padding: '24px',
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(226, 232, 240, 0.6)'
                                }}>
                                    <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <HiUser size={16} color="#64748B" />
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#64748B',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>{t('name') || 'Name'}</div>
                                </div>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: '#1E293B',
                                        letterSpacing: '-0.025em'
                                    }}>{selectedUser.name}</div>
                                </div>

                                {/* Title */}
                                    {selectedUser.title && (
                                    <div style={{
                                        padding: '24px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '8px'
                                        }}>
                                            <PiSubtitlesFill size={16} color="#64748B" />
                                            <div style={{
                                            fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#64748B',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>{t('title') || 'Title'}</div>
                                </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            color: '#374151'
                                        }}>{selectedUser.title}</div>
                            </div>
                                )}

                                {/* Bio */}
                                {selectedUser.bio && (
                                    <div style={{
                                        padding: '24px',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.6)'
                                    }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                            marginBottom: '8px'
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12H15M9 16H15M17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H12.586C12.8512 3.00006 13.1055 3.10545 13.293 3.293L18.707 8.707C18.8946 8.8945 18.9999 9.14884 19 9.414V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                                color: '#64748B',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>{t('biography') || 'Biography'}</div>
                                        </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: '400',
                                            color: '#374151',
                                            lineHeight: '1.6'
                                        }}>{selectedUser.bio}</div>
                                    </div>
                                )}

                                                                 {/* Contact Information */}
                                 {selectedUser.email && (
                                     <div style={{
                                         padding: '20px',
                                         background: 'rgba(255, 255, 255, 0.7)',
                                         borderRadius: '16px',
                                         border: '1px solid rgba(226, 232, 240, 0.6)'
                                     }}>
                                         <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                             gap: '8px',
                                             marginBottom: '8px'
                                         }}>
                                             <HiMail size={16} color="#64748B" />
                                             <div style={{
                                                 fontSize: '14px',
                                                 fontWeight: '600',
                                                 color: '#64748B',
                                                 textTransform: 'uppercase',
                                                 letterSpacing: '0.05em'
                                             }}>{t('email') || 'Email'}</div>
                                         </div>
                                         <div style={{
                                             fontSize: '14px',
                                             fontWeight: '500',
                                             color: '#374151',
                                             wordBreak: 'break-word'
                                         }}>{selectedUser.email}</div>
                                     </div>
                                 )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="toast-notification">
                    <div className={`toast-content toast-${toastType}`}>
                        <div className="toast-icon">
                            {toastType === 'success' ? '✓' : '⚠'}
                        </div>
                        <div className="toast-message">
                            {toastMessage}
                        </div>
                        <button className="toast-close" onClick={() => setShowToast(false)}>
                            ×
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default JournalDetailsPage; 