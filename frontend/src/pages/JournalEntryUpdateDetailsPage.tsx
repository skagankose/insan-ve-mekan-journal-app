import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as apiService from '../services/apiService';
import { formatDate, getRoleTranslation } from '../utils/dateUtils';
import ConfirmationModal from '../components/ConfirmationModal';
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
  const [showParticipantsTooltip, setShowParticipantsTooltip] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [updateToDelete, setUpdateToDelete] = useState<CombinedUpdate | null>(null);
  
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
    
    // Initialize all expandable message boxes as expanded by default
    const newExpandedUpdates = new Set<string>();
    combined.forEach((update, index) => {
      const updateId = `${update.type}-${update.id}-${index}`;
      // Check if the update has expandable content
      const hasExpandableContent = 
        (update.type === 'author' && (update.title || update.abstract_tr || update.abstract_en || update.keywords || update.keywords_en)) || 
        (update.file_path && update.canViewFile);
      
      if (hasExpandableContent) {
        newExpandedUpdates.add(updateId);
      }
    });
    setExpandedUpdates(newExpandedUpdates);
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
    setUpdateToDelete(update);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUpdate = async () => {
    if (!updateToDelete) return;
    
    setIsDeleteModalOpen(false);
    
    try {
      if (updateToDelete.type === 'author') {
        await apiService.deleteAuthorUpdate(updateToDelete.id);
        setAuthorUpdates(prev => prev.filter(item => item.id !== updateToDelete.id));
      } else {
        await apiService.deleteRefereeUpdate(updateToDelete.id);
        setRefereeUpdates(prev => prev.filter(item => item.id !== updateToDelete.id));
      }
      
      setToastMessage(t('updateDeleted') || 'Update deleted successfully!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error('Error deleting update:', err);
      setToastMessage(t('deleteUpdateError') || 'Failed to delete the update');
      setToastType('warning');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setUpdateToDelete(null);
    }
  };

  const handleCopyUpdate = async (update: CombinedUpdate) => {
    let copyText = '';
    
    // Add basic info
    copyText += `${update.type === 'author' ? 'Author' : 'Referee'} Update\n`;
    copyText += `Date: ${formatLocalizedDate(update.created_date)}\n`;
    copyText += `By: ${update.type === 'author' ? update.authorName : update.refereeName}\n\n`;
    
    // Add notes if available
    if (update.notes && update.canViewNotes) {
      copyText += `Notes:\n${update.notes}\n\n`;
    }
    
    // Add author-specific fields
    if (update.type === 'author') {
      if (update.title) {
        copyText += `${t('updatedTitle')}:\n${update.title}\n\n`;
      }
      if (update.abstract_tr) {
        copyText += `${t('updatedAbstract')}:\n${update.abstract_tr}\n\n`;
      }
      if (update.abstract_en) {
        copyText += `${t('updatedAbstractEn')}:\n${update.abstract_en}\n\n`;
      }
      if (update.keywords) {
        copyText += `${t('updatedKeywords')}:\n${update.keywords}\n\n`;
      }
      if (update.keywords_en) {
        copyText += `${t('updatedKeywordsEn')}:\n${update.keywords_en}\n\n`;
      }
    }
    
    // Note about file (but don't include actual file)
    if (update.file_path && update.canViewFile) {
      copyText += `${update.type === 'author' ? t('updatedFile') : t('reviewFile')}: Attached\n`;
    }
    
    const textToCopy = copyText.trim();
    
    // Try modern clipboard API first (works on HTTPS and some HTTP localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setToastMessage(t('updateCopied') || 'Update content copied to clipboard!');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      } catch (err) {
        console.warn('Modern clipboard API failed, trying fallback:', err);
      }
    }
    
    // Fallback 1: Create a temporary textarea element
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('contenteditable', 'true');
      
      document.body.appendChild(textArea);
      
      // For iOS devices, we need to handle selection differently
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // iOS specific handling
        textArea.contentEditable = 'true';
        textArea.readOnly = true;
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, 999999);
      } else {
        // Standard handling for other devices
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 999999);
      }
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setToastMessage(t('updateCopied') || 'Update content copied to clipboard!');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.warn('Textarea fallback failed, trying final fallback:', err);
    }
    
    // Fallback 2: Use deprecated execCommand with direct selection (for very old browsers)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setToastMessage(t('updateCopied') || 'Update content copied to clipboard!');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }
    } catch (err) {
      console.warn('Final execCommand fallback failed:', err);
    }
    
    // If all methods fail, show the text in a modal for manual copying
    const copyModal = document.createElement('div');
    copyModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    copyModal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 90%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
          ${t('copyManually') || 'Copy Text Manually'}
        </h3>
        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
          ${t('copyManuallyInstructions') || 'Please select and copy the text below:'}
        </p>
        <textarea 
          readonly
          style="
            width: 100%;
            height: 300px;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
            background: #f8fafc;
          "
          onclick="this.select()"
        >${textToCopy}</textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
          <button onclick="this.closest('[style*=&quot;position: fixed&quot;]').remove()" style="
            padding: 8px 16px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">
            ${t('close') || 'Close'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(copyModal);
    
    // Remove modal when clicking outside
    copyModal.addEventListener('click', (e) => {
      if (e.target === copyModal) {
        document.body.removeChild(copyModal);
      }
    });
    
    // Focus and select the textarea
    setTimeout(() => {
      const textarea = copyModal.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 100);
    
    setToastMessage(t('copyManuallyToast') || 'Please copy the text manually from the popup');
    setToastType('warning');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
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
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              borderRadius: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              boxShadow: '0 20px 40px rgba(239, 68, 68, 0.2)',
              animation: 'bounceIn 0.8s ease-out'
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <path d="M9 2H15L20 7V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2H9Z" 
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 2V7H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            }}>{t('paperNotFoundTitle') || 'Journal Paper Not Found'}</h1>
            
            <p style={{
              fontSize: '18px',
              color: '#64748B',
              lineHeight: '1.6',
              marginBottom: '32px',
              fontWeight: '500'
            }}>{t('paperNotFoundUpdateExplanation') || "We encountered an issue while loading this journal entry's updates."}</p>
            
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
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('backToArchive') || 'Browse Archive'}
            </button>
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
  
  if (!entry) {
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
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 32px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              borderRadius: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)',
              animation: 'bounceIn 0.8s ease-out'
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17ZM17 21V10L13 6H7V19H17Z" 
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            }}>{t('entryNotFoundTitle') || 'Journal Entry Not Found'}</h1>
            
            <p style={{
              fontSize: '18px',
              color: '#64748B',
              lineHeight: '1.6',
              marginBottom: '32px',
              fontWeight: '500'
            }}>{t('entryNotFoundExplanation') || "The journal entry you're looking for doesn't exist or may have been removed."}</p>
            
            <button
              onClick={() => navigate('/archive')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('backToArchive') || 'Browse Archive'}
            </button>
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
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button 
            onClick={() => navigate(`/entries/${entryId}`)} 
            className="chat-back-button"
            aria-label={t('backToEntry') || 'Back to Entry'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="chat-header-info">
            <h1 className="chat-title">{entry.title}</h1>
            <div className="chat-subtitle">
              <span className={`status-indicator status-${entry.status?.toLowerCase()}`}>
                {t(entry.status || '') || entry.status}
              </span>
              <div 
                className="participants-count participants-hover"
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={() => setShowParticipantsTooltip(true)}
                onMouseLeave={() => setShowParticipantsTooltip(false)}
              >
                <span style={{ cursor: 'default' }}>
                  {authors.length + referees.length} {t('participants') || 'participants'}
                </span>
                
                {/* Participants Tooltip */}
                {showParticipantsTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    minWidth: '150px',
                    maxWidth: '400px',
                    width: 'max-content',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E5E7EB',
                    zIndex: 1000,
                    fontSize: '14px'
                  }}>
                    {/* Arrow */}
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      width: '12px',
                      height: '12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRight: 'none',
                      borderBottom: 'none',
                      transform: 'translateX(-50%) rotate(45deg)'
                    }}></div>
                    
                    {/* Authors */}
                    {authors.length > 0 && (
                      <div style={{ marginBottom: referees.length > 0 ? '16px' : '0' }}>
                        <h4 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: '0 0 8px 0'
                        }}>{t('authors') || 'Authors'} ({authors.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {authors.map((author) => (
                            <div key={`author-${author.id}`} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '4px 0'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#F59E0B',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                flexShrink: 0
                              }}>
                                {getUserInitials(author.name)}
                              </div>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                display: 'block',
                                minWidth: 'max-content'
                              }}>{author.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Referees */}
                    {referees.length > 0 && (
                      <div>
                        <h4 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: '0 0 8px 0'
                        }}>{t('referees') || 'Referees'} ({referees.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {referees.map((referee) => (
                            <div key={`referee-${referee.id}`} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '4px 0'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#8B5CF6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                flexShrink: 0
                              }}>
                                {getUserInitials(referee.name)}
                              </div>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                display: 'block',
                                minWidth: 'max-content'
                              }}>{referee.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {authors.length === 0 && referees.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '8px',
                        color: '#9CA3AF',
                        fontSize: '12px'
                      }}>
                        {t('noParticipants') || 'No participants found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
              {t('addAuthorUpdate')}
            </Link>
          )}
          
          {(isRefereeForEntry || user?.role === 'owner' || user?.role === 'admin' || isJournalEditor) && (
            <Link to={`/entries/${entryId}/referee-update/new`} className="chat-action-button referee">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              {t('addRefereeUpdate')}
            </Link>
          )}
          
          {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'owner' || isJournalEditor) && (
            <Link to={`/entries/edit/${entryId}`} className="chat-action-button secondary edit-entry-button">
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
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 9h8"/>
                <path d="M8 13h6"/>
              </svg>
            </div>
            <h3>{t('noUpdates')}</h3>
            <p>{t('startConversation')}</p>
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
                        // Author layout: name/role on left, buttons on right
                        <>
                          <div className="message-sender">
                            <span className="sender-name">
                              {update.authorName}
                            </span>
                            <span className={`sender-role ${update.type}`}>
                              {getRoleTranslation('author', language)}
                            </span>
                          </div>
                          <div className="message-buttons">
                            {/* Delete button first for author messages */}
                            {update.canDelete && (
                              <button 
                                className="delete-message-button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUpdate(update);
                                }}
                                aria-label={t('deleteUpdate') || 'Delete Update'}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                            {/* Copy button for author messages */}
                            <button 
                              className="copy-message-button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUpdate(update);
                              }}
                              aria-label={t('copyUpdate') || 'Copy Update'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            </button>
                            {/* Expand/Collapse button second for author messages */}
                            {((update.type === 'author' && (update.title || update.abstract_tr || update.abstract_en || update.keywords || update.keywords_en)) || 
                              (update.file_path && update.canViewFile)) && (
                              <button 
                                className="expand-collapse-button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUpdateExpansion(updateId);
                                }}
                                aria-label={isExpanded ? (t('hideDetails') || 'Hide Details') : (t('showDetails') || 'Show Details')}
                              >
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                  className={isExpanded ? 'expanded' : ''}
                                >
                                  <path d="M6 9l6 6 6-6"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        // Referee layout: buttons on left, name/role on right
                        <>
                          <div className="message-buttons referee-buttons">
                            {/* Expand/Collapse button for expandable messages */}
                            {(update.file_path && update.canViewFile) && (
                              <button 
                                className="expand-collapse-button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUpdateExpansion(updateId);
                                }}
                                aria-label={isExpanded ? (t('hideDetails') || 'Hide Details') : (t('showDetails') || 'Show Details')}
                              >
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                  className={isExpanded ? 'expanded' : ''}
                                >
                                  <path d="M6 9l6 6 6-6"/>
                                </svg>
                              </button>
                            )}
                            {update.canDelete && (
                              <button 
                                className="delete-message-button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUpdate(update);
                                }}
                                aria-label={t('deleteUpdate') || 'Delete Update'}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                            {/* Copy button for referee messages */}
                            <button 
                              className="copy-message-button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyUpdate(update);
                              }}
                              aria-label={t('copyUpdate') || 'Copy Update'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            </button>
                          </div>
                          <div className="message-sender referee-sender">
                            <span className={`sender-role ${update.type}`}>
                              {getRoleTranslation('referee', language)}
                            </span>
                            <span className="sender-name">
                              {update.refereeName}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div 
                      className={`message-body ${((update.type === 'author' && (update.title || update.abstract_tr || update.abstract_en || update.keywords || update.keywords_en)) || (update.file_path && update.canViewFile)) ? 'expandable' : ''}`}
                      onClick={() => {
                        // Only make clickable if there are expandable details
                        if ((update.type === 'author' && (update.title || update.abstract_tr || update.abstract_en || update.keywords || update.keywords_en)) || 
                            (update.file_path && update.canViewFile)) {
                          toggleUpdateExpansion(updateId);
                        }
                      }}
                    >
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
                      
                      {/* Expandable details - no separate button needed */}
                      {isExpanded && ((update.type === 'author' && (update.title || update.abstract_tr || update.abstract_en || update.keywords || update.keywords_en)) || 
                       (update.file_path && update.canViewFile)) && (
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
                            <div className={`detail-item ${update.type === 'referee' ? 'detail-item-file-referee' : 'detail-item-file-author'}`}>
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
                                onClick={(e) => e.stopPropagation()}
                                download={update.file_path?.toLowerCase().endsWith('.docx') ? true : undefined}
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
                      
                      {/* Timestamp moved to bottom of message */}
                      <div className={`message-timestamp-bottom ${update.type}`}>
                        {formatLocalizedDate(update.created_date)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className={`toast-content toast-${toastType}`}>
            <div className="toast-icon">
              {toastType === 'success' ? '✓' : '⚠'}
            </div>
            <span className="toast-message">{toastMessage}</span>
            <button 
              className="toast-close"
              onClick={() => setShowToast(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Updates */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUpdateToDelete(null);
        }}
        onConfirm={confirmDeleteUpdate}
        title={t('deleteUpdate') || 'Delete Update'}
        message={
          updateToDelete
            ? `${t('confirmDeleteUpdateMessage') || 'Are you sure you want to delete this'} ${
                updateToDelete.type === 'author' ? t('authorUpdate') || 'author update' : t('refereeUpdate') || 'referee update'
              }? ${t('thisActionCannotBeUndone') || 'This action cannot be undone.'}`
            : ''
        }
        confirmText={t('deleteUpdate') || 'Delete Update'}
        cancelText={t('cancel') || 'Cancel'}
        variant="danger"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        }
      />
    </div>
  );
};

export default JournalEntryUpdateDetailsPage; 