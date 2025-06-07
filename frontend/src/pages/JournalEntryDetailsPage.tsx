import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './JournalEntryDetailsPage.css';

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
    const isModalOpen = showAuthorsModal || showRefereesModal || showJournalModal;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAuthorsModal, showRefereesModal, showJournalModal]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('notAvailable') || 'N/A';
    return new Date(dateString).toLocaleDateString();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline back-button"
          >
            ← {t('back') || 'Back'}
          </button>
          <h1 style={{ margin: 0 }}>{language === 'en' && entry.title_en ? entry.title_en : entry.title}</h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="page-content-section" style={{ paddingBottom: '0px' }}>
        <div style={{ margin: '0 auto', marginLeft: '60px' }}>
          
          {/* Show action buttons only for authenticated users with appropriate roles */}
          {user && (
            // Show action-buttons div if user is author, editor, admin, OR referee for this entry
            (entry.authors?.some(author => author.id === user.id) || 
             user.role === 'editor' || 
             user.role === 'admin' ||
             user.role === 'owner' ||
             entry.referees?.some(referee => referee.id === user.id)
            ) && (
              <div className="action-buttons" style={{ marginBottom: '30px' }}>
                  {entry.random_token && (
                  <div className="reference-token" style={{ fontFamily: 'monospace', fontSize: '0.9em', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
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
                    className="btn btn-primary"
                  >
                    {t('editEntry') || 'Edit Entry'}
                  </button>
                )}
                
                {/* View Updates Button: Show if user is editor, admin, author, or referee for this entry */}
                {(user.role === 'editor' || 
                  user.role === 'admin' ||
                  user.role === 'owner' ||
                  entry.authors?.some(author => author.id === user?.id) ||
                  entry.referees?.some(referee => referee.id === user?.id)) && (
                  <div className="updates-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => navigate(`/entries/${entry.id}/updates`)}
                      className="btn btn-secondary"
                    >
                      {t('viewUpdates') || 'View Updates'}
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Journal Information */}
          <div className="journal-info card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{t('publishedIn') || 'Published In'}</h3>
              {isEditorOrAdmin && (
                <button
                  onClick={() => setShowJournalModal(true)}
                  className="btn btn-sm btn-outline"
                >
                  {t('changeJournal') || 'Change Journal'}
                </button>
              )}
            </div>
            {journal ? (
              <div 
                onClick={() => navigate(`/journals/${journal.id}`)}
                onMouseEnter={() => setIsJournalHovered(true)}
                onMouseLeave={() => setIsJournalHovered(false)}
                style={{ 
                  cursor: 'pointer',
                  padding: '10px',
                  margin: '-10px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: isJournalHovered ? 'rgba(13, 110, 253, 0.05)' : 'transparent'
                }}
                role="link"
                aria-label={`View details for journal: ${journal.title}`}
              >
                <p>
                  <strong>{journal.title}</strong> - {t('issue')}: {journal.issue} 
                  {journal.publication_date ? ` ${t('published')}: ${formatDate(journal.publication_date)}` : ''}
                </p>
              </div>
            ) : (
              <div className="empty-state">
                <p>{t('notAssignedToJournal') || 'This entry is not yet assigned to a journal'}</p>
              </div>
            )}
          </div>

          {/* File view section */}
          <div className="entry-file card">
            <h3>{t('files') || 'Files'}</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {entry.file_path && (
                <a href={`/api${entry.file_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  {t('viewFile') || 'View File'}
                </a>
              )}
              {entry.full_pdf && (
                <a href={`/api${entry.full_pdf}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  {t('viewFullPdf') || 'View Full PDF'}
                </a>
              )}
            </div>
          </div>

          {/* Entry Details */}
          <div className="entry-details card">
            <div className="entry-meta">
              <div className="meta-item">
                <strong>{t('date') || 'Date'}:</strong> {formatDate(entry.publication_date)}
              </div>
              {entry.page_number && (
                <div className="meta-item">
                  <strong>{t('pageNumber') || 'Page Number'}:</strong> {entry.page_number}
                </div>
              )}
              {entry.doi && (
                <div className="meta-item">
                  <strong>DOI:</strong> {entry.doi}
                </div>
              )}
              {entry.article_type && (
                <div className="meta-item">
                  <strong>{t('articleType') || 'Article Type'}:</strong> {entry.article_type}
                </div>
              )}
              {entry.language && (
                <div className="meta-item">
                  <strong>{t('language') || 'Language'}:</strong> {entry.language}
                </div>
              )}
              {entry.status && (
                <div className="meta-item">
                  <strong>{t('status') || 'Status'}:</strong> 
                  <span className={`badge badge-${entry.status.toLowerCase()}`}>
                    {t(entry.status) || entry.status}
                  </span>
                </div>
              )}
              {entry.status === 'waiting_for_payment' && (
                <div className="payment-info-block" style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '15px',
                  margin: '15px 0',
                  color: '#495057'
                }}>
                  <h4 style={{ color: '#0d6efd', marginBottom: '10px' }}>
                    {t('paymentRequired') || 'Payment Required'}
                  </h4>
                  <p>
                    {t('paymentInfoMessage') || 
                      'To proceed with the publication process, please complete the payment using the following bank information:'}
                  </p>
                  <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginTop: '10px',
                    fontFamily: 'monospace'
                  }}>
                    <p><strong>{t('bankName') || 'Bank Name'}:</strong> Example Bank</p>
                    <p><strong>IBAN:</strong> TR00 0000 0000 0000 0000 0000 00</p>
                    <p><strong>{t('accountHolder') || 'Account Holder'}:</strong> Journal Name</p>
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#6c757d' }}>
                    {t('paymentReference') || 
                      'Please include your Reference Token as payment reference for proper tracking:'} <strong>{entry.random_token}</strong>
                  </p>
                </div>
              )}
              <div className="meta-item">
                <strong>{t('downloads') || 'Downloads'}:</strong> {entry.download_count}
              </div>
              <div className="meta-item">
                <strong>{t('reads') || 'Reads'}:</strong> {entry.read_count}
              </div>
            </div>

            {/* Abstract sections */}
            <div className="abstract-section">
              {entry.abstract_tr && (
                <div className="abstract">
                  <h3>{t('abstractTurkish') || 'Abstract (Turkish)'}</h3>
                  <p>{entry.abstract_tr}</p>
                </div>
              )}
              
              {entry.abstract_en && (
                <div className="abstract">
                  <h3>{t('abstractEnglish') || 'Abstract (English)'}</h3>
                  <p>{entry.abstract_en}</p>
                </div>
              )}
            </div>

            {/* Keywords */}
            {entry.keywords && (
              <div className="keywords-section">
                <h3>{t('keywords') || 'Keywords'}</h3>
                <p>{entry.keywords}</p>
              </div>
            )}

            {/* Authors list */}
            <div className="authors-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{t('authors') || 'Authors'}</h3>
                {isEditorOrAdmin && (
                  <button
                    onClick={() => setShowAuthorsModal(true)}
                    className="btn btn-sm btn-outline"
                  >
                    {t('manageAuthors') || 'Manage Authors'}
                  </button>
                )}
              </div>
              <div className="authors-list">
                {entry.authors && entry.authors.length > 0 ? (
                  entry.authors.map(author => (
                    <div key={author.id} className="author-card">
                      <h4>{author.name}</h4>
                      {author.title && <p>{author.title}</p>}
                      {author.location && <p>{author.location}</p>}
                      {author.email && <p>{author.email}</p>}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>{t('noAuthors') || 'No authors assigned'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Referees section - visible to editors/admins */}
          <div className="referees-section card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{t('referees') || 'Referees'}</h3>
              {isEditorOrAdmin && (
                <button
                  onClick={() => setShowRefereesModal(true)}
                  className="btn btn-sm btn-outline"
                >
                  {t('manageReferees') || 'Manage Referees'}
                </button>
              )}
            </div>
            <div className="referees-list">
              {entry.referees && entry.referees.length > 0 ? (
                entry.referees.map(referee => (
                  <div key={referee.id} className="referee-card">
                    <h4>{referee.name}</h4>
                    {referee.title && <p>{referee.title}</p>}
                    {referee.email && <p>{referee.email}</p>}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>{t('noReferees') || 'No referees assigned'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Authors Modal */}
      {showAuthorsModal && isEditorOrAdmin && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{t('manageAuthors') || 'Manage Authors'}</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowAuthorsModal(false)}
                disabled={isSubmittingUsers}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {authorUsers.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noAuthorUsers') || 'No author users found'}</p>
                </div>
              ) : (
                <div className="checkbox-group">
                  {authorUsers.map(author => (
                    <div key={author.id} className="checkbox-item">
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
                      />
                      <label htmlFor={`author-${author.id}`}>{author.name} ({author.email})</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAuthorsModal(false)}
                disabled={isSubmittingUsers}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateAuthors}
                disabled={isSubmittingUsers}
              >
                {isSubmittingUsers ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Referees Modal */}
      {showRefereesModal && isEditorOrAdmin && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{t('manageReferees') || 'Manage Referees'}</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowRefereesModal(false)}
                disabled={isSubmittingUsers}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {refereeUsers.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noRefereeUsers') || 'No referee users found'}</p>
                </div>
              ) : (
                <div className="checkbox-group">
                  {refereeUsers.map(referee => (
                    <div key={referee.id} className="checkbox-item">
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
                      />
                      <label htmlFor={`referee-${referee.id}`}>{referee.name} ({referee.email})</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRefereesModal(false)}
                disabled={isSubmittingUsers}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateReferees}
                disabled={isSubmittingUsers}
              >
                {isSubmittingUsers ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Selection Modal */}
      {showJournalModal && isEditorOrAdmin && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{t('selectJournal') || 'Select Journal'}</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowJournalModal(false)}
                disabled={isSubmittingJournal}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {journals.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noJournalsFound') || 'No journals found'}</p>
                </div>
              ) : (
                <div className="radio-group">
                  <div className="radio-item">
                    <input
                      type="radio"
                      id="journal-none"
                      name="journal"
                      checked={selectedJournalId === null}
                      onChange={() => setSelectedJournalId(null)}
                      disabled={isSubmittingJournal}
                    />
                    <label htmlFor="journal-none">{t('noJournal') || 'No Journal (Remove from current journal)'}</label>
                  </div>
                  {journals.map(journal => (
                    <div key={journal.id} className="radio-item">
                      <input
                        type="radio"
                        id={`journal-${journal.id}`}
                        name="journal"
                        value={journal.id}
                        checked={selectedJournalId === journal.id}
                        onChange={() => setSelectedJournalId(journal.id)}
                        disabled={isSubmittingJournal}
                      />
                      <label htmlFor={`journal-${journal.id}`}>
                        {journal.title} ({t('issue')}: {journal.issue})
                        {journal.publication_date && ` - ${t('published')}: ${formatDate(journal.publication_date)}`}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowJournalModal(false)}
                disabled={isSubmittingJournal}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateJournal}
                disabled={isSubmittingJournal || journals.length === 0}
              >
                {isSubmittingJournal ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JournalEntryDetailsPage; 