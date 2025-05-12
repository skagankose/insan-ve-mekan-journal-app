import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
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
  file_path?: string;
  notes?: string;
  canViewNotes: boolean;
  canViewFile: boolean;
};

const JournalEntryUpdateDetailsPage: React.FC = () => {
  const { t } = useLanguage();
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
  
  useEffect(() => {
    const fetchData = async () => {
      if (!entryId) return;
      
      try {
        setLoading(true);
        
        // Fetch the journal entry
        const entryData = await apiService.getEntryById(parseInt(entryId));
        setEntry(entryData);
        
        // Extract authors and referees from the entry data
        // The entry should come with the full user objects thanks to the response model in the backend
        if (entryData.authors) {
          setAuthors(entryData.authors);
        }
        
        // Ensure unique referees by ID
        if (entryData.referees) {
          // Use a Map to deduplicate referees by ID
          const uniqueRefereesMap = new Map();
          entryData.referees.forEach(referee => {
            uniqueRefereesMap.set(referee.id, referee);
          });
          setReferees(Array.from(uniqueRefereesMap.values()));
        }
        
        // Fetch author and referee updates for this entry
        const [authorUpdatesData, refereeUpdatesData] = await Promise.all([
          apiService.getEntryAuthorUpdates(parseInt(entryId)),
          apiService.getEntryRefereeUpdates(parseInt(entryId))
        ]);
        
        // If we have referees but don't have their full data in the original entry,
        // we need to fetch them separately
        if (refereeUpdatesData.length > 0) {
          // Create a set of all referee IDs from the updates
          const refereeIds = new Set(refereeUpdatesData.map(update => update.referee_id));
          
          // Filter out referees we already have
          const existingRefereeIds = new Set(entryData.referees?.map(ref => ref.id) || []);
          const missingRefereeIds = [...refereeIds].filter(id => !existingRefereeIds.has(id));
          
          // If there are missing referees, try to fetch them individually
          if (missingRefereeIds.length > 0) {
            try {
              // Fetch each missing referee
              const missingReferees = await Promise.all(
                missingRefereeIds.map(async (id) => {
                  try {
                    return await apiService.getUserBasicInfo(id.toString());
                  } catch (error) {
                    console.error(`Failed to fetch referee with ID ${id}:`, error);
                    return null;
                  }
                })
              );
              
              // Add the successfully fetched referees to our list
              const validReferees = missingReferees.filter(referee => referee !== null);
              
              // Combine existing and new referees, ensuring uniqueness
              setReferees(prevReferees => {
                const allReferees = [...prevReferees, ...validReferees];
                const uniqueRefereesMap = new Map();
                allReferees.forEach(referee => {
                  if (referee) {
                    uniqueRefereesMap.set(referee.id, referee);
                  }
                });
                return Array.from(uniqueRefereesMap.values());
              });
            } catch (error) {
              console.error('Failed to fetch missing referees:', error);
            }
          }
        }
        
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
  }, [entryId]);

  // Combine and sort updates for chat display
  useEffect(() => {
    const isAdmin = user?.role === 'admin';
    const isEditor = user?.role === 'editor';
    const isAuthorForEntry = authors.some(author => author.id === user?.id);
    
    // Convert author updates to combined format
    const authorUpdatesCombined = authorUpdates.map(update => {
      const updateAuthor = authors.find(a => a.id === update.author_id);
      return {
        id: update.id,
        type: 'author' as const,
        created_date: update.created_date,
        authorId: update.author_id,
        authorName: updateAuthor?.name || 'Unknown Author',
        title: update.title,
        abstract_tr: update.abstract_tr,
        abstract_en: update.abstract_en,
        keywords: update.keywords,
        file_path: update.file_path,
        notes: update.notes,
        canViewNotes: true, // Author notes are always visible
        canViewFile: true // Author files are always visible
      };
    });

    // Convert referee updates to combined format
    const refereeUpdatesCombined = refereeUpdates.map(update => {
      const updateReferee = referees.find(r => r.id === update.referee_id);
      // Allow admins, editors, authors, and the referee who wrote the update to see it
      const canViewUpdate = isAdmin || isEditor || isAuthorForEntry || update.referee_id === user?.id;
      
      return {
        id: update.id,
        type: 'referee' as const,
        created_date: update.created_date,
        refereeId: update.referee_id,
        refereeName: updateReferee ? updateReferee.name : `Referee ID: ${update.referee_id}`,
        file_path: update.file_path,
        notes: update.notes,
        canViewNotes: canViewUpdate,
        canViewFile: canViewUpdate // Apply the same visibility rule to files as notes
      };
    });

    // Combine both update types and sort by date (oldest first)
    const combined = [...authorUpdatesCombined, ...refereeUpdatesCombined]
      .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
    
    setCombinedUpdates(combined);
  }, [authorUpdates, refereeUpdates, authors, referees, user]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
  
  // Check if the current user is an author or referee for this entry
  const isAuthorForEntry = authors.some(author => author.id === user?.id);
  const isRefereeForEntry = referees.some(referee => referee.id === user?.id);
  
  if (loading) {
    return <div className="loading">{t('loading') || 'Loading...'}</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!entry) {
    return <div className="message-container">{t('journalEntryNotFound') || 'Journal entry not found.'}</div>;
  }
  
  return (
    <div className="entry-updates-container">
      <div className="entry-header">
        <h1>{entry.title}</h1>
        <div className="entry-meta">
          <span className="entry-status">
            <span className={`badge badge-${entry.status?.toLowerCase()}`}>
              {t(entry.status || '') || entry.status}
            </span>
          </span>
          {entry.random_token && (
            <span className="entry-token">
              {t('referenceToken') || 'Reference Token'}: <strong>{entry.random_token}</strong>
            </span>
          )}
          <button onClick={() => navigate(-1)} className="back-button">
            {t('back') || 'Back'}
          </button>
        </div>
      </div>
      
      <div className="entry-details">
        <div className="entry-abstract">
          <h3>{t('abstract') || 'Abstract'}</h3>
          <p>{entry.abstract_tr}</p>
          {entry.abstract_en && (
            <>
              <h3>{t('abstractEn') || 'Abstract (English)'}</h3>
              <p>{entry.abstract_en}</p>
            </>
          )}
        </div>
        
        <div className="entry-keywords">
          <h3>{t('keywords') || 'Keywords'}</h3>
          <p>{entry.keywords || t('noKeywords') || 'No keywords provided'}</p>
        </div>
        
        <div className="entry-participants">
          <div className="authors-section">
            <h3>{t('authors') || 'Authors'}</h3>
            <ul className="participants-list">
              {authors.map((author, index) => (
                <li key={`author-${author.id}-${index}`} className="participant-item">
                  <span className="participant-name">{author.name}</span>
                  {author.title && <span className="participant-title">{author.title}</span>}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="referees-section">
            <h3>{t('referees') || 'Referees'}</h3>
            <ul className="participants-list">
              {referees.map((referee, index) => (
                <li key={`referee-${referee.id}-${index}`} className="participant-item">
                  <span className="participant-name">{referee.name}</span>
                  {referee.title && <span className="participant-title">{referee.title}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="updates-section">
        <h2>{t('entryUpdates') || 'Entry Updates'}</h2>
        
        {combinedUpdates.length === 0 ? (
          <div className="empty-state">
            <p>{t('noUpdates') || 'No updates found for this entry.'}</p>
          </div>
        ) : (
          <div className="chat-updates-container">
            {combinedUpdates.map((update, index) => {
              const updateId = `${update.type}-${update.id}-${index}`;
              const isExpanded = expandedUpdates.has(updateId);
              
              return (
                <div 
                  key={updateId} 
                  className={`chat-message ${update.type === 'author' ? 'author-message' : 'referee-message'}`}
                >
                  <div className="chat-message-header">
                    <span className="message-sender">
                      {update.type === 'author' ? update.authorName : update.refereeName}
                    </span>
                    <span className="message-date">{formatDate(update.created_date)}</span>
                  </div>
                  
                  <div className="chat-message-content">
                    {/* Always show notes if available */}
                    {update.notes && update.canViewNotes ? (
                      <div className="update-notes">
                        <strong>{t('notes') || 'Notes'}: </strong>
                        <p>{update.notes}</p>
                      </div>
                    ) : update.notes && !update.canViewNotes ? (
                      <div className="update-notes restricted">
                        <p>{t('privateNotes') || 'Private notes (visible only to the referee who created them, editors, and admins)'}</p>
                      </div>
                    ) : null}
                    
                    {/* Toggle icon */}
                    <button 
                      className={`toggle-details-icon ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleUpdateExpansion(updateId)}
                      aria-label={isExpanded ? (t('hideDetails') || 'Hide Details') : (t('showDetails') || 'Show Details')}
                    >
                      <span className="chevron"></span>
                    </button>
                    
                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="expanded-details">
                        {update.type === 'author' && (
                          <>
                            {update.title && (
                              <div className="update-title">
                                <strong>{t('updatedTitle') || 'Updated Title'}: </strong>
                                <span>{update.title}</span>
                              </div>
                            )}
                            
                            {update.abstract_tr && (
                              <div className="update-abstract">
                                <strong>{t('updatedAbstract') || 'Updated Abstract'}: </strong>
                                <p>{update.abstract_tr}</p>
                              </div>
                            )}
                            
                            {update.abstract_en && (
                              <div className="update-abstract-en">
                                <strong>{t('updatedAbstractEn') || 'Updated Abstract (English)'}: </strong>
                                <p>{update.abstract_en}</p>
                              </div>
                            )}
                            
                            {update.keywords && (
                              <div className="update-keywords">
                                <strong>{t('updatedKeywords') || 'Updated Keywords'}: </strong>
                                <span>{update.keywords}</span>
                              </div>
                            )}
                          </>
                        )}
                        
                        {update.file_path && update.canViewFile ? (
                          <div className="update-file">
                            <strong>
                              {update.type === 'author' 
                                ? (t('updatedFile') || 'Updated File') 
                                : (t('reviewFile') || 'Review File')
                              }: 
                            </strong>
                            <a href={update.file_path} target="_blank" rel="noopener noreferrer">
                              {t('viewFile') || 'View File'}
                            </a>
                          </div>
                        ) : update.file_path && !update.canViewFile ? (
                          <div className="update-file restricted">
                            <p>{t('privateFile') || 'Private file (visible only to the referee who uploaded it, editors, and admins)'}</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Actions Section (Add new update, etc.) */}
      <div className="entry-actions">
        {isAuthorForEntry && (
          <Link to={`/entries/${entryId}/author-update/new`} className="action-button">
            {t('addAuthorUpdate') || 'Add Author Update'}
          </Link>
        )}
        
        {isRefereeForEntry && (
          <Link to={`/entries/${entryId}/referee-update/new`} className="action-button">
            {t('addRefereeUpdate') || 'Add Referee Update'}
          </Link>
        )}
        
        {(user?.role === 'admin' || user?.role === 'editor') && (
          <Link to={`/entries/edit/${entryId}`} className="action-button secondary">
            {t('editEntry') || 'Edit Entry'}
          </Link>
        )}
      </div>
    </div>
  );
};

export default JournalEntryUpdateDetailsPage; 