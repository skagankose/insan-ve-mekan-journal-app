import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import { formatDate, getRoleTranslation } from '../utils/dateUtils';
import './JournalEntryUpdateDetailsPage.css';

// Define a combined type for chat display
type CombinedUpdate = {
  id: number;
  type: 'author' | 'referee';
  created_date: string;
  authorId?: number;
  refereeId?: number;
  authorName?: string;
  refereeName?: string;
  title?: string;
  abstract_tr?: string;
  abstract_en?: string;
  keywords?: string;
  keywords_en?: string;
  file_path?: string;
  notes?: string;
  canViewNotes: boolean;
  canViewFile: boolean;
  canDelete: boolean;
  isWithinDeletionWindow: boolean;
};

const JournalEntryUpdateDetailsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { entryId } = useParams<{ entryId: string }>();
  
  const [entry, setEntry] = useState<apiService.JournalEntryRead | null>(null);
  const [authorUpdates, setAuthorUpdates] = useState<apiService.AuthorUpdateRead[]>([]);
  const [refereeUpdates, setRefereeUpdates] = useState<apiService.RefereeUpdateRead[]>([]);
  const [combinedUpdates, setCombinedUpdates] = useState<CombinedUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<apiService.UserRead[]>([]);
  const [referees, setReferees] = useState<apiService.UserRead[]>([]);
  const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());
  const [isJournalEditor, setIsJournalEditor] = useState<boolean>(false);
  const [authorNamesMap, setAuthorNamesMap] = useState<Map<number, string>>(new Map());
  const [refereeNamesMap, setRefereeNamesMap] = useState<Map<number, string>>(new Map());
  
  useEffect(() => {
    const fetchData = async () => {
      if (!entryId) return;
      
      try {
        setLoading(true);
        
        // Fetch the journal entry
        const entryData = await apiService.getEntryById(parseInt(entryId));
        setEntry(entryData);
        
        // Set authors from entry data, ensuring it's an array
        setAuthors(entryData.authors || []);
        
        // Set referees from entry data, ensuring uniqueness and it's an array
        if (entryData.referees) {
          const uniqueRefereesMap = new Map();
          entryData.referees.forEach(referee => {
            uniqueRefereesMap.set(referee.id, referee);
          });
          setReferees(Array.from(uniqueRefereesMap.values()));
        } else {
          setReferees([]);
        }
        
        // Check if the current user is an editor of the journal
        if (user && entryData.journal_id) {
          const journalEditors = await apiService.getJournalEditors(entryData.journal_id);
          const isEditor = journalEditors.some((editor: apiService.JournalEditorLink) => editor.user_id === user.id);
          setIsJournalEditor(isEditor);
        }
        
        // Fetch author and referee updates for this entry
        const [authorUpdatesData, refereeUpdatesData] = await Promise.all([
          apiService.getEntryAuthorUpdates(parseInt(entryId)),
          apiService.getEntryRefereeUpdates(parseInt(entryId))
        ]);
        
        setAuthorUpdates(authorUpdatesData);
        setRefereeUpdates(refereeUpdatesData);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load journal entry updates');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [entryId, user]);

  // Fetch missing author and referee names
  useEffect(() => {
    const fetchMissingUserNames = async () => {
      const currentAuthorIds = new Set(authors.map(author => author.id));
      const currentRefereeIds = new Set(referees.map(referee => referee.id));
      const missingAuthorIds = new Set<number>();
      const missingRefereeIds = new Set<number>();
      
      // Collect all author IDs from updates that aren't in current authors
      authorUpdates.forEach(update => {
        if (!currentAuthorIds.has(update.author_id)) {
          missingAuthorIds.add(update.author_id);
        }
      });

      // Collect all referee IDs from updates that aren't in current referees
      refereeUpdates.forEach(update => {
        if (!currentRefereeIds.has(update.referee_id)) {
          missingRefereeIds.add(update.referee_id);
        }
      });

      // Fetch missing author names
      const newAuthorNamesMap = new Map(authorNamesMap);
      await Promise.all(
        Array.from(missingAuthorIds).map(async (authorId) => {
          try {
            const authorInfo = await apiService.getUserBasicInfo(authorId.toString());
            newAuthorNamesMap.set(authorId, authorInfo.name);
          } catch (error) {
            console.error(`Failed to fetch author info for ID ${authorId}:`, error);
            newAuthorNamesMap.set(authorId, 'Unknown Author');
          }
        })
      );
      setAuthorNamesMap(newAuthorNamesMap);

      // Fetch missing referee names
      const newRefereeNamesMap = new Map(refereeNamesMap);
      await Promise.all(
        Array.from(missingRefereeIds).map(async (refereeId) => {
          try {
            const refereeInfo = await apiService.getUserBasicInfo(refereeId.toString());
            newRefereeNamesMap.set(refereeId, refereeInfo.name);
          } catch (error) {
            console.error(`Failed to fetch referee info for ID ${refereeId}:`, error);
            newRefereeNamesMap.set(refereeId, 'Unknown Referee');
          }
        })
      );
      setRefereeNamesMap(newRefereeNamesMap);
    };

    fetchMissingUserNames();
  }, [authors, referees, authorUpdates, refereeUpdates]);

  // Add this function to check if an update is within the deletion window
  const isWithinDeletionWindow = (createdDate: string) => {
    const createdTime = new Date(createdDate).getTime();
    const currentTime = new Date().getTime();
    const fifteenMinutesInMs = (15 * 60 * 1000); // 15 minutes
    return currentTime - createdTime <= fifteenMinutesInMs;
  };

  // Combine and sort updates for chat display
  useEffect(() => {
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';
    const isEditor = user?.role === 'editor';
    const isAdminOrEditor = isAdmin || isEditor;
    const isAuthorForEntry = authors.some(author => author.id === user?.id);
    
    // Convert author updates to combined format
    const authorUpdatesCombined = authorUpdates.map(update => {
      const updateAuthor = authors.find(a => a.id === update.author_id);
      const authorName = updateAuthor?.name || authorNamesMap.get(update.author_id) || 'Unknown Author';
      const isWithinWindow = isWithinDeletionWindow(update.created_date);
      // User can delete if they're admin/owner or if they're the author and within the time window
      const canDelete = isAdmin || (update.author_id === user?.id && isWithinWindow);
      
      return {
        id: update.id,
        type: 'author' as const,
        created_date: update.created_date,
        authorId: update.author_id,
        authorName,
        title: update.title,
        abstract_tr: update.abstract_tr,
        abstract_en: update.abstract_en,
        keywords: update.keywords,
        keywords_en: update.keywords_en,
        file_path: update.file_path,
        notes: update.notes,
        canViewNotes: true, // Author notes are always visible
        canViewFile: true, // Author files are always visible
        canDelete,
        isWithinDeletionWindow: isWithinWindow
      };
    });

    // Convert referee updates to combined format
    const refereeUpdatesCombined = refereeUpdates.map(update => {
      const updateReferee = referees.find(r => r.id === update.referee_id);
      const refereeName = updateReferee?.name || refereeNamesMap.get(update.referee_id) || 'Unknown Referee';
      const isWithinWindow = isWithinDeletionWindow(update.created_date);
      // Allow admins, editors, authors, and the referee who wrote the update to see it
      const canViewUpdate = isAdminOrEditor || isAuthorForEntry || update.referee_id === user?.id;
      // User can delete if they're admin/owner or if they're the referee and within the time window
      const canDelete = isAdmin || (update.referee_id === user?.id && isWithinWindow);
      
      return {
        id: update.id,
        type: 'referee' as const,
        created_date: update.created_date,
        refereeId: update.referee_id,
        refereeName,
        file_path: update.file_path,
        notes: update.notes,
        canViewNotes: canViewUpdate,
        canViewFile: canViewUpdate, // Apply the same visibility rule to files as notes
        canDelete,
        isWithinDeletionWindow: isWithinWindow // Referee updates now have a deletion window
      };
    });

    // Combine both update types and sort by date (newest first)
    const combined = [...authorUpdatesCombined, ...refereeUpdatesCombined]
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    
    setCombinedUpdates(combined);
  }, [authorUpdates, refereeUpdates, authors, referees, user, authorNamesMap, refereeNamesMap]);
  
  const formatLocalizedDate = (dateString: string) => {
    return formatDate(dateString, language, { includeTime: true });
  };
  
  const toggleUpdateExpansion = (updateId: string) => {
    setExpandedUpdates(prevExpandedUpdates => {
      const newExpandedUpdates = new Set(prevExpandedUpdates);
      if (newExpandedUpdates.has(updateId)) {
        newExpandedUpdates.delete(updateId);
      } else {
        newExpandedUpdates.add(updateId);
      }
      return newExpandedUpdates;
    });
  };
  
  const handleDeleteUpdate = async (update: CombinedUpdate) => {
    if (!window.confirm(t('confirmDeleteUpdate') || 'Are you sure you want to delete this update?')) {
      return;
    }
    
    try {
      if (update.type === 'author') {
        await apiService.deleteAuthorUpdate(update.id);
        setAuthorUpdates(prev => prev.filter(item => item.id !== update.id));
      } else {
        await apiService.deleteRefereeUpdate(update.id);
        setRefereeUpdates(prev => prev.filter(item => item.id !== update.id));
      }
    } catch (err) {
      console.error('Error deleting update:', err);
      alert(t('deleteUpdateError') || 'Failed to delete the update');
    }
  };
  
  // Check if the current user is an author or referee for this entry
  const isAuthorForEntry = authors.some(author => author.id === user?.id);
  const isRefereeForEntry = referees.some(referee => referee.id === user?.id);
  
  // Helper function to get user initials
  const getUserInitials = (name: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2); // Limit to 2 characters
  };
  
  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>{t('loading') || 'Loading conversation...'}</p>
      </div>
    );
  }
  
  if (error) {
    return <div className="chat-error">{error}</div>;
  }
  
  if (!entry) {
    return <div className="chat-error">{t('journalEntryNotFound') || 'Journal entry not found.'}</div>;
  }
  
  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button 
            onClick={() => navigate(-1)} 
            className="chat-back-button"
            aria-label={t('back') || 'Back'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="chat-header-info">
            <h1 className="chat-title">{entry.title}</h1>
            <div className="chat-subtitle">
              <span className={`status-indicator status-${entry.status?.toLowerCase()}`}>
                {t(entry.status || '') || entry.status}
              </span>
              <span className="participants-count">
                {authors.length + referees.length} {t('participants') || 'participants'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="chat-header-actions">
          {(isAuthorForEntry || user?.role === 'owner' || user?.role === 'admin' || isJournalEditor) && (
            <Link to={`/entries/${entryId}/author-update/new`} className="chat-action-button author">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              {t('addAuthorUpdate') || 'Author Update'}
            </Link>
          )}
          
          {(isRefereeForEntry || user?.role === 'owner' || user?.role === 'admin' || isJournalEditor) && (
            <Link to={`/entries/${entryId}/referee-update/new`} className="chat-action-button referee">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              {t('addRefereeUpdate') || 'Review'}
            </Link>
          )}
          
          {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner' || isJournalEditor) && (
            <Link to={`/entries/edit/${entryId}`} className="chat-action-button secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t('editEntry') || 'Edit'}
            </Link>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {combinedUpdates.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">💬</div>
            <h3>{t('noUpdates') || 'No updates yet'}</h3>
            <p>{t('startConversation') || 'Start the conversation by adding an update'}</p>
          </div>
        ) : (
          <div className="chat-messages-list">
            {combinedUpdates.map((update, index) => {
              const updateId = `${update.type}-${update.id}-${index}`;
              const isExpanded = expandedUpdates.has(updateId);
              
              return (
                <div 
                  key={updateId} 
                  className={`chat-message ${update.type === 'author' ? 'message-author' : 'message-referee'}`}
                >
                  <div className="message-avatar">
                    <div className={`avatar-circle ${update.type}`}>
                      {update.type === 'author' 
                        ? getUserInitials(update.authorName || '') 
                        : getUserInitials(update.refereeName || '')
                      }
                    </div>
                  </div>
                  
                  <div className="message-content">
                    <div className="message-header">
                      {update.type === 'author' ? (
                        // Author layout: name, role, delete button on left
                        <div className="message-sender">
                          <span className="sender-name">
                            {update.authorName}
                          </span>
                          <span className={`sender-role ${update.type}`}>
                            {getRoleTranslation('author', language)}
                          </span>
                          {update.canDelete && (
                            <button 
                              className="delete-message-button" 
                              onClick={() => handleDeleteUpdate(update)}
                              aria-label={t('deleteUpdate') || 'Delete Update'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        // Referee layout: delete button, role, name
                        <div className="message-sender referee-sender">
                          {update.canDelete && (
                            <button 
                              className="delete-message-button" 
                              onClick={() => handleDeleteUpdate(update)}
                              aria-label={t('deleteUpdate') || 'Delete Update'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                          <span className={`sender-role ${update.type}`}>
                            {getRoleTranslation('referee', language)}
                          </span>
                          <span className="sender-name">
                            {update.refereeName}
                          </span>
                        </div>
                      )}
                      <div className="message-actions">
                        <span className="message-timestamp">
                          {formatLocalizedDate(update.created_date)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="message-body">
                      {/* Main content - always show notes if available */}
                      {update.notes && update.canViewNotes ? (
                        <div className="message-text">
                          <p>{update.notes}</p>
                        </div>
                      ) : update.notes && !update.canViewNotes ? (
                        <div className="message-text private">
                          <p>{t('privateNotes') || 'Private notes (visible only to the reviewer who created them, editors, and admins)'}</p>
                        </div>
                      ) : null}
                      
                      {/* Expandable details */}
                      {(update.type === 'author' && (update.title || update.abstract_tr || update.abstract_en || update.keywords || update.keywords_en)) || 
                       (update.file_path && update.canViewFile) ? (
                        <div className="message-expandable">
                          <button 
                            className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleUpdateExpansion(updateId)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                            <span>
                              {isExpanded 
                                ? (t('hideDetails') || 'Hide Details') 
                                : (t('showDetails') || 'Show Details')
                              }
                            </span>
                          </button>
                          
                          {isExpanded && (
                            <div className="expanded-content">
                              {update.type === 'author' && (
                                <>
                                  {update.title && (
                                    <div className="detail-item">
                                      <strong>{t('updatedTitle') || 'Updated Title'}: </strong>
                                      <span>{update.title}</span>
                                    </div>
                                  )}
                                  
                                  {update.abstract_tr && (
                                    <div className="detail-item">
                                      <strong>{t('updatedAbstract') || 'Updated Abstract'}: </strong>
                                      <p>{update.abstract_tr}</p>
                                    </div>
                                  )}
                                  
                                  {update.abstract_en && (
                                    <div className="detail-item">
                                      <strong>{t('updatedAbstractEn') || 'Updated Abstract (English)'}: </strong>
                                      <p>{update.abstract_en}</p>
                                    </div>
                                  )}
                                  
                                  {update.keywords && (
                                    <div className="detail-item">
                                      <strong>{t('updatedKeywords') || 'Updated Keywords (Turkish)'}: </strong>
                                      <span>{update.keywords}</span>
                                    </div>
                                  )}
                                  
                                  {update.keywords_en && (
                                    <div className="detail-item">
                                      <strong>{t('updatedKeywordsEn') || 'Updated Keywords (English)'}: </strong>
                                      <span>{update.keywords_en}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {update.file_path && update.canViewFile ? (
                                <div className="detail-item">
                                  <strong>
                                    {update.type === 'author' 
                                      ? (t('updatedFile') || 'Updated File') 
                                      : (t('reviewFile') || 'Review File')
                                    }: 
                                  </strong>
                                  <a 
                                    href={`/api${update.file_path}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="file-link"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <path d="M14 2v6h6"/>
                                      <path d="M16 13H8"/>
                                      <path d="M16 17H8"/>
                                      <path d="M10 9H8"/>
                                    </svg>
                                    {t('viewFile') || 'View File'}
                                  </a>
                                </div>
                              ) : update.file_path && !update.canViewFile ? (
                                <div className="detail-item private">
                                  <p>{t('privateFile') || 'Private file (visible only to the reviewer who uploaded it, editors, and admins)'}</p>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntryUpdateDetailsPage; 