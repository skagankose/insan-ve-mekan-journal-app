import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

const JournalEntryDetailsPage: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  
  const [entry, setEntry] = useState<apiService.JournalEntryRead | null>(null);
  const [journal, setJournal] = useState<apiService.Journal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isJournalHovered, setIsJournalHovered] = useState(false);
  const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'owner');
  const isOwner = isAuthenticated && user && user.role === 'owner';
  const isEditor = isAuthenticated && user && user.role === 'editor';
  const isEditorOrAdmin = isAuthenticated && user && (isEditor || isAdmin || isOwner);
  const canViewFullDetails = isEditorOrAdmin;
  
  // Modal states for managing authors and referees
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  const [showRefereesModal, setShowRefereesModal] = useState(false);
  const [authorUsers, setAuthorUsers] = useState<apiService.UserRead[]>([]);
  const [refereeUsers, setRefereeUsers] = useState<apiService.UserRead[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<number[]>([]);
  const [isSubmittingUsers, setIsSubmittingUsers] = useState(false);

  // Author details modal state
  const [showAuthorDetailsModal, setShowAuthorDetailsModal] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<apiService.UserRead | null>(null);

  // Journal selection modal state
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journals, setJournals] = useState<apiService.Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);

  useEffect(() => {
    const fetchEntryDetails = async () => {
      if (!entryId) return;
      
      setLoading(true);
      setError(null);
      try {
        let entryData;
        // Determine if the user has rights to see full details
        if (canViewFullDetails) {
          entryData = await apiService.getEntryById(parseInt(entryId));
        } else {
          entryData = await apiService.getPublicEntryById(parseInt(entryId));
        }
        setEntry(entryData);
        
        // Set the selected journal ID if the entry has one
        if (entryData.journal_id) {
          setSelectedJournalId(entryData.journal_id);
        }

        // If the entry belongs to a journal, fetch that journal directly
        if (entryData.journal_id) {
          try {
            const journalData = await apiService.getJournalById(entryData.journal_id);
            setJournal(journalData);
          } catch (journalErr) {
            console.error("Failed to fetch journal data:", journalErr);
            // Don't set an error for journal fetch failure, as we can still display the entry
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch entry data:", err);
        setError(err.response?.data?.detail || t('failedToLoadEntryData') || 'Failed to load entry data.');
      } finally {
        setLoading(false);
      }
    };

    fetchEntryDetails();
  }, [entryId, t, isAuthenticated, user]);

  // Fetch author and referee users when modals open
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isEditorOrAdmin) return;
      
      if (showAuthorsModal) {
        try {
          const authors = await apiService.getAuthorUsers();
          setAuthorUsers(authors);
          // Set current authors as selected
          if (entry?.authors) {
            setSelectedAuthorIds(entry.authors.map(author => author.id));
          }
        } catch (err) {
          console.error('Failed to fetch author users:', err);
        }
      }
      
      if (showRefereesModal) {
        try {
          const referees = await apiService.getRefereeUsers();
          setRefereeUsers(referees);
          // Set current referees as selected
          if (entry?.referees) {
            setSelectedRefereeIds(entry.referees.map(referee => referee.id));
          }
        } catch (err) {
          console.error('Failed to fetch referee users:', err);
        }
      }
      
      if (showJournalModal) {
        try {
          // Use the appropriate function to fetch journals based on user role
          const journalsData = isEditorOrAdmin
            ? await apiService.getJournals()
            : await apiService.getPublishedJournals();
          setJournals(journalsData);
          // Set current journal as selected
          if (entry?.journal_id) {
            setSelectedJournalId(entry.journal_id);
          }
        } catch (err) {
          console.error('Failed to fetch journals:', err);
        }
      }
    };
    
    fetchUsers();
  }, [showAuthorsModal, showRefereesModal, showJournalModal, isEditorOrAdmin, entry]);

  // Handle updating authors
  const handleUpdateAuthors = async () => {
    if (!entryId) return;
    
    try {
      setIsSubmittingUsers(true);
      
      // Get current author IDs
      const currentAuthorIds = entry?.authors?.map(author => author.id) || [];
      
      // Find authors to add (in selected but not in current)
      const authorsToAdd = selectedAuthorIds.filter(id => !currentAuthorIds.includes(id));
      
      // Find authors to remove (in current but not in selected)
      const authorsToRemove = currentAuthorIds.filter(id => !selectedAuthorIds.includes(id));
      
      // Add new authors
      for (const authorId of authorsToAdd) {
        await apiService.addEntryAuthor(parseInt(entryId), authorId);
      }
      
      // Remove authors
      for (const authorId of authorsToRemove) {
        await apiService.removeEntryAuthor(parseInt(entryId), authorId);
      }
      
      // Refresh entry data to get updated authors
      const updatedEntry = await apiService.getPublicEntryById(parseInt(entryId));
      setEntry(updatedEntry);
      
      setShowAuthorsModal(false);
    } catch (err) {
      console.error('Failed to update authors:', err);
    } finally {
      setIsSubmittingUsers(false);
    }
  };

  // Handle updating referees
  const handleUpdateReferees = async () => {
    if (!entryId) return;
    
    try {
      setIsSubmittingUsers(true);
      
      // Get current referee IDs
      const currentRefereeIds = entry?.referees?.map(referee => referee.id) || [];
      
      // Find referees to add (in selected but not in current)
      const refereesToAdd = selectedRefereeIds.filter(id => !currentRefereeIds.includes(id));
      
      // Find referees to remove (in current but not in selected)
      const refereesToRemove = currentRefereeIds.filter(id => !selectedRefereeIds.includes(id));
      
      // Add new referees
      for (const refereeId of refereesToAdd) {
        await apiService.addEntryReferee(parseInt(entryId), refereeId);
      }
      
      // Remove referees
      for (const refereeId of refereesToRemove) {
        await apiService.removeEntryReferee(parseInt(entryId), refereeId);
      }
      
      // Refresh entry data to get updated referees
      const updatedEntry = await apiService.getPublicEntryById(parseInt(entryId));
      setEntry(updatedEntry);
      
      setShowRefereesModal(false);
    } catch (err) {
      console.error('Failed to update referees:', err);
    } finally {
      setIsSubmittingUsers(false);
    }
  };

  // Handle updating journal
  const handleUpdateJournal = async () => {
    if (!entryId) return;
    
    try {
      setIsSubmittingJournal(true);
      
      // Update the entry with the new journal_id
      await apiService.updateEntry(parseInt(entryId), {
        journal_id: selectedJournalId
      });
      
      // Refresh entry data to get updated journal information
      const updatedEntry = await apiService.getEntryById(parseInt(entryId));
      setEntry(updatedEntry);
      
      // If the entry now has a journal, fetch the journal details
      if (updatedEntry.journal_id) {
        try {
          const journalData = await apiService.getJournalById(updatedEntry.journal_id);
          setJournal(journalData);
        } catch (journalErr) {
          console.error("Failed to fetch updated journal data:", journalErr);
        }
      } else {
        // If journal was removed, set journal to null
        setJournal(null);
      }
      
      setShowJournalModal(false);
    } catch (err) {
      console.error('Failed to update journal:', err);
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const isModalOpen = showAuthorsModal || showRefereesModal || showJournalModal || showAuthorDetailsModal;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAuthorsModal, showRefereesModal, showJournalModal, showAuthorDetailsModal]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAuthorDetailsModal) {
          setShowAuthorDetailsModal(false);
        } else if (showAuthorsModal) {
          setShowAuthorsModal(false);
        } else if (showRefereesModal) {
          setShowRefereesModal(false);
        } else if (showJournalModal) {
          setShowJournalModal(false);
        }
      }
    };

    // Add event listener when any modal is open
    const isModalOpen = showAuthorsModal || showRefereesModal || showJournalModal || showAuthorDetailsModal;
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showAuthorsModal, showRefereesModal, showJournalModal, showAuthorDetailsModal]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('notAvailable') || 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle opening author details modal
  const handleAuthorClick = (author: apiService.UserRead) => {
    setSelectedAuthor(author);
    setShowAuthorDetailsModal(true);
  };

  // Handle referee click to navigate to user profile
  const handleRefereeClick = (referee: apiService.UserRead) => {
    navigate(`/admin/users/profile/${referee.id}`);
  };

  if (loading) {
    return <div className="loading">{t('loadingEntryData') || 'Loading entry data...'}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!entry) {
    return <div className="error-message">{t('entryNotFound') || 'Entry not found.'}</div>;
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
            onClick={() => navigate(-1)} 
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
            {t('back') || 'Back'}
          </button>
          
          {/* Action buttons moved to top right */}
          {user && (
            // Show action-buttons div if user is author, editor, admin, OR referee for this entry
            (entry.authors?.some(author => author.id === user.id) || 
             user.role === 'editor' || 
             user.role === 'admin' ||
             user.role === 'owner' ||
             entry.referees?.some(referee => referee.id === user.id)
            ) && (
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginLeft: 'auto', 
                marginRight: '60px'
              }}>
                {entry.random_token && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(20, 184, 166, 0.2)',
                    borderRadius: '12px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#0D9488',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('referenceToken') || 'Reference Token'}: <strong>{entry.random_token}</strong>
                  </div>
                )}
                
                {/* Edit Entry Button: Show if user is author, editor, or admin */}
                {(entry.authors?.some(author => author.id === user.id) ||
                  user.role === 'editor' ||
                  user.role === 'admin' ||
                  user.role === 'owner') && (
                  <button
                    onClick={() => navigate(`/entries/edit/${entry.id}`)}
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
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
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('editEntry') || 'Edit Entry'}
                  </button>
                )}
                
                {/* View Updates Button: Show if user is editor, admin, author, or referee for this entry */}
                {(user.role === 'editor' || 
                  user.role === 'admin' ||
                  user.role === 'owner' ||
                  entry.authors?.some(author => author.id === user?.id) ||
                  entry.referees?.some(referee => referee.id === user?.id)) && (
                  <button
                    onClick={() => navigate(`/entries/${entry.id}/updates`)}
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20H21L19 18L21 16H12V20ZM4 4V6H20V4H4ZM4 8V10H20V8H4ZM4 12V14H12V12H4Z" fill="currentColor"/>
                    </svg>
                    {t('viewUpdates') || 'View Updates'}
                  </button>
                )}
              </div>
            )
          )}
        </div>
        <h1>{language === 'en' && entry.title_en ? entry.title_en : entry.title}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section" style={{
        paddingBottom: '0px',
        marginLeft: '60px'
      }}>
        <div style={{ margin: '0 auto' }}>

          {/* Authors and Published In Section - Side by Side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Authors Section */}
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
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    }}>{t('authors') || 'Authors'}</h3>
                  </div>
                  {isEditorOrAdmin && (
                    <button
                      onClick={() => setShowAuthorsModal(true)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {t('manageAuthors') || 'Manage Authors'}
                    </button>
                  )}
                </div>
                <div style={{
                  width: '50px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                  borderRadius: '2px',
                  marginLeft: '44px',
                  marginBottom: '20px'
                }}></div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: entry.authors && entry.authors.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  {entry.authors && entry.authors.length > 0 ? (
                    entry.authors.map(author => (
                      <div 
                        key={author.id} 
                        onClick={() => handleAuthorClick(author)}
                        style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '16px',
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)';
                          e.currentTarget.style.borderColor = '#F59E0B';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1E293B',
                          margin: '0 0 8px 0',
                          letterSpacing: '-0.025em'
                        }}>{author.name}</h4>
                        {author.title && (
                          <p style={{
                            fontSize: '13px',
                            color: '#64748B',
                            margin: '0 0 6px 0',
                            fontWeight: '500'
                          }}>{author.title}</p>
                        )}
                        {author.email && (
                          <p style={{
                            fontSize: '13px',
                            color: '#64748B',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {author.email}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{
                      gridColumn: '1 / -1',
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '16px',
                      border: '2px dashed #E2E8F0'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '0 auto 12px',
                        background: '#F1F5F9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>👤</div>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#64748B'
                      }}>{t('noAuthors') || 'No authors assigned'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Published In Section */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '32px',
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
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(20, 184, 166, 0.03) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              
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
                     }}>{t('publishedIn') || 'Published In'}</h3>
                  </div>
                  {isEditorOrAdmin && (
                    <button
                      onClick={() => setShowJournalModal(true)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
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
                      {t('changeJournal') || 'Change Journal'}
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
              </div>
                 
              {journal ? (
                <div 
                  onClick={() => navigate(`/journals/${journal.id}`)}
                  onMouseEnter={() => setIsJournalHovered(true)}
                  onMouseLeave={() => setIsJournalHovered(false)}
                  style={{ 
                    cursor: 'pointer',
                    padding: '20px',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    background: isJournalHovered ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${isJournalHovered ? '#3B82F6' : 'rgba(226, 232, 240, 0.6)'}`,
                    transform: isJournalHovered ? 'translateY(-2px)' : 'translateY(0)',
                    position: 'relative',
                    zIndex: 1
                  }}
                  role="link"
                  aria-label={`View details for journal: ${journal.title}`}
                >
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1E293B',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.025em'
                  }}>{journal.title}</h4>
                  {journal.publication_place && (
                    <p style={{
                      fontSize: '13px',
                      color: '#64748B',
                      margin: '0 0 6px 0',
                      fontWeight: '500'
                    }}>
                      {journal.publication_place}
                    </p>
                  )}
                  <p style={{
                    fontSize: '13px',
                    color: '#64748B',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {journal.issue}
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '16px',
                  border: '2px dashed #E2E8F0'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto 12px',
                    background: '#F1F5F9',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>📖</div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748B'
                  }}>{t('notAssignedToJournal') || 'This entry is not yet assigned to a journal'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Entry Details */}
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
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                }}>{t('entryDetails') || 'Entry Details'}</h3>
              </div>
              <div style={{
                width: '60px',
                height: '4px',
                background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)',
                borderRadius: '2px',
                marginLeft: '52px'
              }}></div>
            </div>
            
            {/* Meta Information Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.6)'
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
                  }}>{t('date') || 'Date'}</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1E293B'
                  }}>{formatDate(entry.publication_date)}</div>
                </div>
              </div>

              {entry.page_number && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.6)'
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
                      <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    }}>{t('pageNumber') || 'Page Number'}</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1E293B'
                    }}>{entry.page_number}</div>
                  </div>
                </div>
              )}

              {entry.doi && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.6)'
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
                      <path d="M10 13C10 13.5304 10.2107 14.0391 10.5858 14.4142C10.9609 14.7893 11.4696 15 12 15C12.5304 15 13.0391 14.7893 13.4142 14.4142C13.7893 14.0391 14 13.5304 14 13C14 12.4696 13.7893 11.9609 13.4142 11.5858C13.0391 11.2107 12.5304 11 12 11C11.4696 11 10.9609 11.2107 10.5858 11.5858C10.2107 11.9609 10 12.4696 10 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 13C18.6 16 15.6 17 12 17C8.4 17 5.4 16 3 13C5.4 10 8.4 9 12 9C15.6 9 18.6 10 21 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    }}>DOI</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1E293B'
                    }}>{entry.doi}</div>
                  </div>
                </div>
              )}

              {entry.article_type && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.6)'
                }}>
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
                    }}>{t('articleType') || 'Article Type'}</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1E293B'
                    }}>{entry.article_type}</div>
                  </div>
                </div>
              )}

              {entry.language && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.6)'
                }}>
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
                      <path d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 9H15M9 13H13M9 17H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    }}>{t('language') || 'Language'}</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1E293B'
                    }}>{entry.language}</div>
                  </div>
                </div>
              )}

              {entry.status && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: `1px solid ${entry.status === 'accepted' ? 'rgba(16, 185, 129, 0.3)' : 
                                      entry.status === 'rejected' ? 'rgba(239, 68, 68, 0.3)' : 
                                      'rgba(226, 232, 240, 0.6)'}`
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: entry.status === 'accepted' 
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : entry.status === 'rejected' 
                      ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                      : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {entry.status === 'accepted' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : entry.status === 'rejected' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    }}>{t('status') || 'Status'}</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: entry.status === 'accepted' ? '#059669' : 
                            entry.status === 'rejected' ? '#DC2626' : '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: entry.status === 'accepted' ? '#10B981' : 
                                   entry.status === 'rejected' ? '#EF4444' : '#F59E0B'
                      }}></div>
                      {t(entry.status) || entry.status}
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.6)'
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
                    <path d="M3 16.5V18.75C3 19.9926 4.00736 21 5.25 21H18.75C19.9926 21 21 19.9926 21 18.75V16.5M16.5 12L12 16.5M12 16.5L7.5 12M12 16.5V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  }}>{t('downloads') || 'Downloads'}</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1E293B'
                  }}>{entry.download_count}</div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.6)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  }}>{t('reads') || 'Reads'}</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1E293B'
                  }}>{entry.read_count}</div>
                </div>
              </div>
            </div>

            {entry.status === 'waiting_for_payment' && (
              <div style={{
                padding: '24px',
                background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                marginBottom: '24px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
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
                      <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 style={{ 
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1E40AF'
                  }}>
                    {t('paymentRequired') || 'Payment Required'}
                  </h4>
                </div>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#64748B'
                }}>
                  {t('paymentInfoMessage') || 
                    'To proceed with the publication process, please complete the payment using the following bank information:'}
                </p>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  marginBottom: '16px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>{t('bankName') || 'Bank Name'}:</strong> Example Bank</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>IBAN:</strong> TR00 0000 0000 0000 0000 0000 00</p>
                  <p style={{ margin: 0 }}><strong>{t('accountHolder') || 'Account Holder'}:</strong> Journal Name</p>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  color: '#64748B',
                  fontWeight: '500'
                }}>
                  {t('paymentReference') || 
                    'Please include your Reference Token as payment reference for proper tracking:'} <strong style={{ color: '#1E40AF' }}>{entry.random_token}</strong>
                </p>
              </div>
            )}


          </div>



          {/* Abstract sections */}
          {(entry.abstract_tr || entry.abstract_en) && (
            <>
              {entry.abstract_tr && (
                <div style={{
                  marginBottom: '32px',
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
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 9H15M9 13H13M9 17H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                      }}>{t('abstract') || 'Abstract'}</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {entry.abstract_tr && (
                        <div style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.6)',
                          borderRadius: '16px',
                          border: '1px solid rgba(226, 232, 240, 0.6)'
                        }}>
                          <p style={{
                            fontSize: '16px',
                            lineHeight: '1.7',
                            color: '#475569',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            marginBottom: entry.keywords ? '16px' : 0
                          }}>{entry.abstract_tr}</p>
                          {entry.keywords && (
                            <p style={{
                              fontSize: '14px',
                              lineHeight: '1.6',
                              color: '#64748B',
                              margin: 0,
                              paddingTop: '16px',
                              borderTop: '1px solid rgba(226, 232, 240, 0.4)'
                            }}>
                              <strong style={{ color: '#475569' }}>{t('keywords') || 'Keywords'}:</strong> {entry.keywords}
                            </p>
                          )}
                        </div>
                      )}
                      {entry.abstract_en && (
                        <div style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.6)',
                          borderRadius: '16px',
                          border: '1px solid rgba(226, 232, 240, 0.6)'
                        }}>
                          <p style={{
                            fontSize: '16px',
                            lineHeight: '1.7',
                            color: '#475569',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            marginBottom: entry.keywords_en ? '16px' : 0
                          }}>{entry.abstract_en}</p>
                          {entry.keywords_en && (
                            <p style={{
                              fontSize: '14px',
                              lineHeight: '1.6',
                              color: '#64748B',
                              margin: 0,
                              paddingTop: '16px',
                              borderTop: '1px solid rgba(226, 232, 240, 0.4)'
                            }}>
                              <strong style={{ color: '#475569' }}>{t('keywords') || 'Keywords'}:</strong> {entry.keywords_en}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </>
          )}

                    {/* Referees and Files Section - Side by Side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Referees Section */}
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M16 4V2C16 1.44772 15.5523 1 15 1H9C8.44772 1 8 1.44772 8 2V4M4 7H20M6 7V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V7H6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 11V17M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    }}>{t('referees') || 'Referees'}</h3>
                  </div>
                  {isEditorOrAdmin && (
                    <button
                      onClick={() => setShowRefereesModal(true)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
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
                      {t('manageReferees') || 'Manage Referees'}
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: entry.referees && entry.referees.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}>
                  {entry.referees && entry.referees.length > 0 ? (
                    entry.referees.map(referee => (
                      <div 
                        key={referee.id} 
                        onClick={() => handleRefereeClick(referee)}
                        style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '16px',
                          border: '1px solid rgba(226, 232, 240, 0.6)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                          e.currentTarget.style.borderColor = '#8B5CF6';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1E293B',
                          margin: '0 0 8px 0',
                          letterSpacing: '-0.025em'
                        }}>{referee.name}</h4>
                        {referee.title && (
                          <p style={{
                            fontSize: '13px',
                            color: '#64748B',
                            margin: '0 0 6px 0',
                            fontWeight: '500'
                          }}>{referee.title}</p>
                        )}
                        {referee.email && (
                          <p style={{
                            fontSize: '13px',
                            color: '#64748B',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {referee.email}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '16px',
                      border: '2px dashed #E2E8F0'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '0 auto 12px',
                        background: '#F1F5F9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>🔍</div>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#64748B'
                      }}>{t('noReferees') || 'No referees assigned'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Files Section */}
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
                      <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 2V9H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  }}>{t('files') || 'Files'}</h3>
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
                  gridTemplateColumns: (entry.file_path && entry.full_pdf) ? '1fr 1fr' : '1fr',
                  gap: '16px'
                }}>
                  {entry.file_path && (
                    <button 
                      onClick={() => window.open(`/api${entry.file_path}`, '_blank')}
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
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)';
                        e.currentTarget.style.borderColor = '#14B8A6';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13 2V9H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#1E293B'
                        }}>{t('viewFile') || 'View File'}</div>
                      </div>
                    </button>
                  )}
                  
                  {entry.full_pdf && (
                    <button 
                      onClick={() => window.open(`/api${entry.full_pdf}`, '_blank')}
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
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = '#EF4444';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#1E293B'
                        }}>{t('viewFullPdf') || 'View Full PDF'}</div>
                      </div>
                    </button>
                  )}

                  {(!entry.file_path && !entry.full_pdf) && (
                    <div style={{
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '16px',
                      border: '2px dashed #E2E8F0'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '0 auto 12px',
                        background: '#F1F5F9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>📄</div>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#64748B'
                      }}>{t('noFiles') || 'No files available'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ marginTop: '16px', marginBottom: '0px' }}>
            <div className="transparent-footer">
              <Footer />
            </div>
          </div>
        </div>
      </div>

      {/* Authors Modal */}
      {showAuthorsModal && isEditorOrAdmin && (
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
              }}>{t('manageAuthors') || 'Manage Authors'}</h3>
              <button 
                onClick={() => setShowAuthorsModal(false)}
                disabled={isSubmittingUsers}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                  fontSize: '20px',
                  color: '#64748B',
                  transition: 'all 0.3s ease',
                  marginBottom: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#EF4444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingUsers) {
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
              {authorUsers.length === 0 ? (
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
                  }}>👤</div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                    {t('noAuthorUsers') || 'No author users found'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {authorUsers.map(author => (
                    <label
                      key={author.id}
                      htmlFor={`author-${author.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: selectedAuthorIds.includes(author.id)
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '16px',
                        border: `2px solid ${selectedAuthorIds.includes(author.id)
                          ? '#F59E0B'
                          : 'rgba(226, 232, 240, 0.5)'}`,
                        cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isSubmittingUsers ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmittingUsers && !selectedAuthorIds.includes(author.id)) {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)';
                          e.currentTarget.style.borderColor = '#F59E0B';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmittingUsers && !selectedAuthorIds.includes(author.id)) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`author-${author.id}`}
                        value={author.id}
                        checked={selectedAuthorIds.includes(author.id)}
                        onChange={() => {
                          if (selectedAuthorIds.includes(author.id)) {
                            setSelectedAuthorIds(selectedAuthorIds.filter(id => id !== author.id));
                          } else {
                            setSelectedAuthorIds([...selectedAuthorIds, author.id]);
                          }
                        }}
                        disabled={isSubmittingUsers}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#F59E0B'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1E293B',
                          marginBottom: '4px'
                        }}>{author.name}</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#64748B'
                        }}>{author.email}</div>
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
                onClick={() => setShowAuthorsModal(false)}
                disabled={isSubmittingUsers}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#64748B',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmittingUsers ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                  }
                }}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleUpdateAuthors}
                disabled={isSubmittingUsers}
                style={{
                  padding: '12px 24px',
                  background: isSubmittingUsers 
                    ? '#94A3B8' 
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isSubmittingUsers 
                    ? 'none' 
                    : '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                  }
                }}
              >
                {isSubmittingUsers ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Referees Modal */}
      {showRefereesModal && isEditorOrAdmin && (
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
              }}>{t('manageReferees') || 'Manage Referees'}</h3>
              <button 
                onClick={() => setShowRefereesModal(false)}
                disabled={isSubmittingUsers}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                  fontSize: '20px',
                  color: '#64748B',
                  transition: 'all 0.3s ease',
                  marginBottom: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#EF4444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingUsers) {
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
              {refereeUsers.length === 0 ? (
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
                  }}>🔍</div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                    {t('noRefereeUsers') || 'No referee users found'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {refereeUsers.map(referee => (
                    <label
                      key={referee.id}
                      htmlFor={`referee-${referee.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: selectedRefereeIds.includes(referee.id)
                          ? 'rgba(139, 92, 246, 0.1)'
                          : 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '16px',
                        border: `2px solid ${selectedRefereeIds.includes(referee.id)
                          ? '#8B5CF6'
                          : 'rgba(226, 232, 240, 0.5)'}`,
                        cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isSubmittingUsers ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmittingUsers && !selectedRefereeIds.includes(referee.id)) {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                          e.currentTarget.style.borderColor = '#8B5CF6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmittingUsers && !selectedRefereeIds.includes(referee.id)) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`referee-${referee.id}`}
                        value={referee.id}
                        checked={selectedRefereeIds.includes(referee.id)}
                        onChange={() => {
                          if (selectedRefereeIds.includes(referee.id)) {
                            setSelectedRefereeIds(selectedRefereeIds.filter(id => id !== referee.id));
                          } else {
                            setSelectedRefereeIds([...selectedRefereeIds, referee.id]);
                          }
                        }}
                        disabled={isSubmittingUsers}
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
                        }}>{referee.name}</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#64748B'
                        }}>{referee.email}</div>
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
                onClick={() => setShowRefereesModal(false)}
                disabled={isSubmittingUsers}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#64748B',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmittingUsers ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                  }
                }}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleUpdateReferees}
                disabled={isSubmittingUsers}
                style={{
                  padding: '12px 24px',
                  background: isSubmittingUsers 
                    ? '#94A3B8' 
                    : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmittingUsers ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isSubmittingUsers 
                    ? 'none' 
                    : '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingUsers) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                  }
                }}
              >
                {isSubmittingUsers ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Selection Modal */}
      {showJournalModal && isEditorOrAdmin && (
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
              }}>{t('selectJournal') || 'Select Journal'}</h3>
              <button 
                onClick={() => setShowJournalModal(false)}
                disabled={isSubmittingJournal}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmittingJournal ? 'not-allowed' : 'pointer',
                  fontSize: '20px',
                  color: '#64748B',
                  transition: 'all 0.3s ease',
                  marginBottom: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingJournal) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#EF4444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingJournal) {
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
              {journals.length === 0 ? (
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
                  }}>📖</div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                    {t('noJournalsFound') || 'No journals found'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label
                    htmlFor="journal-none"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      background: selectedJournalId === null
                        ? 'rgba(14, 165, 233, 0.1)'
                        : 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '16px',
                      border: `2px solid ${selectedJournalId === null
                        ? '#0EA5E9'
                        : 'rgba(226, 232, 240, 0.5)'}`,
                      cursor: isSubmittingJournal ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: isSubmittingJournal ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmittingJournal && selectedJournalId !== null) {
                        e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)';
                        e.currentTarget.style.borderColor = '#0EA5E9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmittingJournal && selectedJournalId !== null) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      id="journal-none"
                      name="journal"
                      checked={selectedJournalId === null}
                      onChange={() => setSelectedJournalId(null)}
                      disabled={isSubmittingJournal}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#0EA5E9'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1E293B'
                      }}>{t('noJournal') || 'No Journal (Remove from current journal)'}</div>
                    </div>
                  </label>
                  {journals.map(journal => (
                    <label
                      key={journal.id}
                      htmlFor={`journal-${journal.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: selectedJournalId === journal.id
                          ? 'rgba(14, 165, 233, 0.1)'
                          : 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '16px',
                        border: `2px solid ${selectedJournalId === journal.id
                          ? '#0EA5E9'
                          : 'rgba(226, 232, 240, 0.5)'}`,
                        cursor: isSubmittingJournal ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isSubmittingJournal ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmittingJournal && selectedJournalId !== journal.id) {
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)';
                          e.currentTarget.style.borderColor = '#0EA5E9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmittingJournal && selectedJournalId !== journal.id) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        id={`journal-${journal.id}`}
                        name="journal"
                        value={journal.id}
                        checked={selectedJournalId === journal.id}
                        onChange={() => setSelectedJournalId(journal.id)}
                        disabled={isSubmittingJournal}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#0EA5E9'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1E293B',
                          marginBottom: '4px'
                        }}>{journal.title}</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#64748B'
                        }}>
                          {t('issue')}: {journal.issue}
                          {journal.publication_date && ` - ${t('published')}: ${formatDate(journal.publication_date)}`}
                        </div>
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
                onClick={() => setShowJournalModal(false)}
                disabled={isSubmittingJournal}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#64748B',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmittingJournal ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSubmittingJournal ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingJournal) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingJournal) {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                  }
                }}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleUpdateJournal}
                disabled={isSubmittingJournal || journals.length === 0}
                style={{
                  padding: '12px 24px',
                  background: (isSubmittingJournal || journals.length === 0)
                    ? '#94A3B8' 
                    : 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (isSubmittingJournal || journals.length === 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (isSubmittingJournal || journals.length === 0)
                    ? 'none' 
                    : '0 4px 12px rgba(14, 165, 233, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmittingJournal && journals.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingJournal && journals.length > 0) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)';
                  }
                }}
              >
                {isSubmittingJournal ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Author Details Modal */}
      {showAuthorDetailsModal && selectedAuthor && (
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
          justifyContent: 'center'
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
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
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
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
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
                  }}>{t('authorDetails') || 'Author Details'}</h3>
                </div>
                <button
                  onClick={() => setShowAuthorDetailsModal(false)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
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
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#64748B',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>{t('name') || 'Name'}</div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1E293B',
                    letterSpacing: '-0.025em'
                  }}>{selectedAuthor.name}</div>
                </div>

                {/* Title */}
                {selectedAuthor.title && (
                  <div style={{
                    padding: '24px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(226, 232, 240, 0.6)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#64748B',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>{t('title') || 'Title'}</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>{selectedAuthor.title}</div>
                  </div>
                )}

                {/* Bio */}
                {selectedAuthor.bio && (
                  <div style={{
                    padding: '24px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(226, 232, 240, 0.6)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#64748B',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>{t('bio') || 'Biography'}</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '400',
                      color: '#374151',
                      lineHeight: '1.6'
                    }}>{selectedAuthor.bio}</div>
                  </div>
                )}

                {/* Contact Information */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                                     {/* Email */}
                   {selectedAuthor.email && (
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
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                           <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="#64748B" strokeWidth="2"/>
                           <path d="M2 12C2 13.6394 2.42496 15.1915 3.18414 16.5297C4.70711 19.4183 7.90861 21 12 21C16.0914 21 19.2929 19.4183 20.8159 16.5297C21.575 15.1915 22 13.6394 22 12C22 10.3606 21.575 8.90853 20.8159 7.57031C19.2929 4.68166 16.0914 3.1 12 3.1C7.90861 3.1 4.70711 4.68166 3.18414 7.57031C2.42496 8.90853 2 10.3606 2 12Z" stroke="#64748B" strokeWidth="2"/>
                         </svg>
                         <div style={{
                           fontSize: '14px',
                           fontWeight: '600',
                           color: '#64748B',
                           textTransform: 'uppercase',
                           letterSpacing: '0.05em'
                         }}>{t('email') || 'Email'}</div>
                       </div>
                       <div style={{
                         fontSize: '16px',
                         fontWeight: '500',
                         color: '#374151'
                       }}>{selectedAuthor.email}</div>
                     </div>
                   )}

                  

                  

                  {/* Science Branch */}
                  {selectedAuthor.science_branch && (
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22 12H18L15 21L9 3L6 12H2" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>{t('scienceBranch') || 'Science Branch'}</div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>{selectedAuthor.science_branch}</div>
                    </div>
                  )}

                  {/* ORCID ID */}
                  {selectedAuthor.orcid_id && (
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M21 2L19 4M19 4L17 2M19 4V8M10 16L8 18M8 18L6 16M8 18V14M12 6C14.2091 6 16 7.79086 16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10C8 7.79086 9.79086 6 12 6Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>ORCID ID</div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>{selectedAuthor.orcid_id}</div>
                    </div>
                  )}

                  {/* YOKSIS ID */}
                  {selectedAuthor.yoksis_id && (
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>YOKSIS ID</div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>{selectedAuthor.yoksis_id}</div>
                    </div>
                  )}
                </div>

                
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .transparent-footer .footer-content {
          background: transparent !important;
          border-top: none !important;
        }
      `}</style>
    </>
  );
};

export default JournalEntryDetailsPage; 