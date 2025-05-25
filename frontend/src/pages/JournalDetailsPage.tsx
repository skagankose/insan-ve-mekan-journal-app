import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';

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
    const { t } = useLanguage();
    const { activeJournal, setActiveJournal } = useActiveJournal();
    const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'owner');
    const isEditor = isAuthenticated && user && user.role === 'editor';
    const isEditorOrAdmin = isAuthenticated && user && (isEditor || isAdmin);
    
    // Modal states for editor management
    const [showEditorInChiefModal, setShowEditorInChiefModal] = useState(false);
    const [showEditorsModal, setShowEditorsModal] = useState(false);
    const [adminUsers, setAdminUsers] = useState<apiService.UserRead[]>([]);
    const [editorUsers, setEditorUsers] = useState<apiService.UserRead[]>([]);
    const [selectedEditorInChiefId, setSelectedEditorInChiefId] = useState<number | null>(null);
    const [selectedEditorIds, setSelectedEditorIds] = useState<number[]>([]);
    const [isSubmittingEditors, setIsSubmittingEditors] = useState(false);

    useEffect(() => {
        const fetchJournalAndEntries = async () => {
            if (!journalId) return;
            
            setLoading(true);
            setError(null);
            try {
                let journalData;
                let entriesData;

                if (isEditorOrAdmin) {
                    // Fetch data using authenticated endpoints for editors/admins
                    const [journalsData, fetchedEntries] = await Promise.all([
                        apiService.getJournals(),
                        apiService.getEntriesByJournal(parseInt(journalId))
                    ]);
                    journalData = journalsData.find(j => j.id === parseInt(journalId));
                    entriesData = fetchedEntries;
                } else {
                    // Fetch data using public endpoints for non-authenticated users
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

                // Fetch editor-in-chief and editors information for all users
                if (journalData.editor_in_chief_id) {
                    try {
                        const editorInChiefData = await apiService.getPublicUserInfo(journalData.editor_in_chief_id.toString());
                        setEditorInChief(editorInChiefData);
                    } catch (err) {
                        console.error("Failed to fetch editor-in-chief data:", err);
                    }
                }

                // Fetch editors information for all users
                try {
                    // Use the public API endpoint to get journal editors
                    const editorLinksData = await apiService.getPublicJournalEditors(journalData.id);
                    if (editorLinksData.length > 0) {
                        const editorsData = await Promise.all(
                            editorLinksData.map(link => apiService.getPublicUserInfo(link.user_id.toString()))
                        );
                        setEditors(editorsData);
                    }
                } catch (err) {
                    console.error("Failed to fetch editors data:", err);
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

    // Fetch admin and editor users when modals open
    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAdmin) return;
            
            if (showEditorInChiefModal) {
                try {
                    const admins = await apiService.getAdminUsers();
                    setAdminUsers(admins);
                    // Set current editor-in-chief as selected
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
                    // Set current editors as selected
                    setSelectedEditorIds(editors.map(editor => editor.id));
                } catch (err) {
                    console.error('Failed to fetch editor users:', err);
                }
            }
        };
        
        fetchUsers();
    }, [showEditorInChiefModal, showEditorsModal, isAdmin, journal, editors]);

    // Prevent background scrolling when modals are open
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

    // Handle setting editor-in-chief
    const handleSetEditorInChief = async () => {
        if (!journalId || !selectedEditorInChiefId) return;
        
        try {
            setIsSubmittingEditors(true);
            await apiService.setJournalEditorInChief(parseInt(journalId), selectedEditorInChiefId);
            
            // Fetch updated editor-in-chief info
            const updatedEditorInChief = await apiService.getUserBasicInfo(selectedEditorInChiefId.toString());
            setEditorInChief(updatedEditorInChief);
            
            // Update journal local state
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

    // Handle updating editors
    const handleUpdateEditors = async () => {
        if (!journalId) return;
        
        try {
            setIsSubmittingEditors(true);
            
            // Get current editor IDs
            const currentEditorIds = editors.map(editor => editor.id);
            
            // Find editors to add (in selected but not in current)
            const editorsToAdd = selectedEditorIds.filter(id => !currentEditorIds.includes(id));
            
            // Find editors to remove (in current but not in selected)
            const editorsToRemove = currentEditorIds.filter(id => !selectedEditorIds.includes(id));
            
            // Add new editors
            for (const editorId of editorsToAdd) {
                await apiService.addJournalEditor(parseInt(journalId), editorId);
            }
            
            // Remove editors
            for (const editorId of editorsToRemove) {
                await apiService.removeJournalEditor(parseInt(journalId), editorId);
            }
            
            // Fetch updated editors
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

    if (loading) {
        return <div className="loading">{t('loadingJournalData') || 'Loading journal data...'}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!journal) {
        return <div className="error-message">{t('journalNotFound') || 'Journal not found.'}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <button 
                    onClick={() => navigate(isEditorOrAdmin ? '/editor/journals' : '/archive')} 
                    className="btn btn-outline back-button"
                >
                    ← {isEditorOrAdmin ? (t('backToJournals') || 'Back to Journals') : (t('backToArchive') || 'Back to Archive')}
                </button>
                <h1 className="page-title">{journal.title}</h1>
                {isEditorOrAdmin && (
                    <div className="journal-actions" style={{ display: 'flex', gap: '12px' }}>
                        {activeJournal?.id !== journal.id && (
                            <button
                                onClick={handleSetActive}
                                className="btn btn-secondary"
                            >
                                {t('setAsActive') || 'Set as Active'}
                            </button>
                        )}
                        <Link to={`/journals/edit/${journal.id}`} className="btn btn-primary">
                            {t('editJournal') || 'Edit Journal'}
                        </Link>
                    </div>
                )}
            </div>

            <div className="journal-details card">
                <div className="journal-meta" style={{ 
                    marginBottom: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <div>
                        <strong>{t('issue') || 'Issue'}:</strong> {journal.issue}
                    </div>
                    <div>
                        <strong>{t('createdDate') || 'Created Date'}:</strong> {new Date(journal.created_date).toLocaleDateString()}
                    </div>
                    {isEditorOrAdmin && (
                        <div>
                            <strong>{t('publicationStatus') || 'Publication Status'}:</strong> {journal.is_published ? t('published') || 'Published' : t('notPublished') || 'Not Published'}
                        </div>
                    )}
                    {journal.publication_date && (
                        <div>
                            <strong>{t('publicationDate') || 'Publication Date'}:</strong> {new Date(journal.publication_date).toLocaleDateString()}
                        </div>
                    )}
                    {journal.publication_place && (
                        <div>
                            <strong>{t('publicationPlace') || 'Publication Place'}:</strong> {journal.publication_place}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong>{t('editorInChief') || 'Editor-in-Chief'}:</strong> 
                        {editorInChief ? editorInChief.name : t('none') || 'None'}
                        {isAdmin && (
                            <button
                                onClick={() => setShowEditorInChiefModal(true)}
                                className="btn btn-sm btn-outline"
                                style={{ marginLeft: '10px' }}
                            >
                                {t('change') || 'Change'}
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong>{t('editors') || 'Editors'}:</strong> 
                        {editors.length > 0 ? editors.map(editor => editor.name).join(', ') : t('none') || 'None'}
                        {isAdmin && (
                            <button
                                onClick={() => setShowEditorsModal(true)}
                                className="btn btn-sm btn-outline"
                                style={{ marginLeft: '10px' }}
                            >
                                {t('manage') || 'Manage'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="journal-files" style={{ marginBottom: '20px' }}>
                    <h3>{t('journalFiles') || 'Journal Files'}</h3>
                    <div style={{ 
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}>
                        {journal.cover_photo && (
                            <a href={`/api${journal.cover_photo}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                {t('viewCoverPhoto') || 'View Cover Photo'}
                            </a>
                        )}
                        {journal.meta_files && (
                            <a href={`/api${journal.meta_files}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                {t('viewMetaFiles') || 'View Meta Files'}
                            </a>
                        )}
                        {isEditorOrAdmin && journal.editor_notes && (
                            <a href={`/api${journal.editor_notes}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                {t('viewEditorNotes') || 'View Editor Notes'}
                            </a>
                        )}
                        {journal.full_pdf && (
                            <a href={`/api${journal.full_pdf}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                {t('viewFullPdf') || 'View Full PDF'}
                            </a>
                        )}
                        {journal.index_section && (
                            <a href={`/api${journal.index_section}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                {t('viewIndexSection') || 'View Index Section'}
                            </a>
                        )}
                        {journal.file_path && (
                            <a href={`/api${journal.file_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                                {t('viewFilePath') || 'View File'}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="journal-entries">
                <h2>{t('entriesInJournal') || 'Entries in this Journal'}</h2>
                
                {entries.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3>{t('noEntriesInJournal') || 'No entries found in this journal.'}</h3>
                    </div>
                ) : (
                    <div className="entries-grid" style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px',
                        marginTop: '20px'
                    }}>
                        {entries.map(entry => (
                            <div 
                                key={entry.id} 
                                className="entry-card card clickable" 
                                style={{
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onClick={() => navigate(`/entries/${entry.id}`)}
                            >
                                <h3 className="entry-title">{entry.title}</h3>
                                <p className="entry-abstract" style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    flexGrow: 1
                                }}>
                                    {entry.abstract_tr || entry.abstract_en}
                                </p>
                                <div className="entry-meta" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <span className="entry-date">
                                        {entry.publication_date ? new Date(entry.publication_date).toLocaleDateString() : '-'}
                                    </span>
                                    {isEditorOrAdmin && entry.status && (
                                        <span className={`badge badge-${entry.status.toLowerCase()}`}>
                                            {t(entry.status) || entry.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor-in-Chief Modal */}
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
            
            {/* Editors Modal */}
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
        </div>
    );
};

export default JournalDetailsPage; 