import React, { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './UserProfilePage.css';

// Define interface for grouped entries
interface GroupedEntries {
    [key: string]: {
        entries: apiService.JournalEntryRead[];
        isExpanded: boolean;
    };
}

const UserProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { id: userId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [userEntries, setUserEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [refereeEntries, setRefereeEntries] = useState<apiService.JournalEntryRead[]>([]);
    const [editedJournals, setEditedJournals] = useState<apiService.Journal[]>([]);
    const [editorInChiefJournals, setEditorInChiefJournals] = useState<apiService.Journal[]>([]);
    const [groupedUserEntries, setGroupedUserEntries] = useState<GroupedEntries>({});
    const [groupedRefereeEntries, setGroupedRefereeEntries] = useState<GroupedEntries>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [profileUser, setProfileUser] = useState<apiService.UserRead | null>(null);
    const [showRejectedUserEntries, setShowRejectedUserEntries] = useState<boolean>(false);
    const [showRejectedRefereeEntries, setShowRejectedRefereeEntries] = useState<boolean>(false);
    
    // Group entries by status and filter out rejected entries
    const groupEntriesByStatus = (entries: apiService.JournalEntryRead[]): GroupedEntries => {
        const grouped: GroupedEntries = {};
        
        entries.forEach(entry => {
            // Skip rejected entries since we'll handle them separately
            if (entry.status === 'not_accepted') {
                return;
            }
            
            // Use the status as the key, or 'unknown' if status is missing
            const statusKey = entry.status || 'unknown';
            
            if (!grouped[statusKey]) {
                grouped[statusKey] = {
                    entries: [],
                    isExpanded: false
                };
            }
            
            grouped[statusKey].entries.push(entry);
        });
        
        return grouped;
    };

    // Get rejected entries separately
    const getRejectedEntries = (entries: apiService.JournalEntryRead[]): apiService.JournalEntryRead[] => {
        return entries.filter(entry => entry.status === 'not_accepted');
    };
    
    // Toggle the expanded state of a status group
    const toggleStatusGroup = (status: string, isUserEntries: boolean) => {
        if (isUserEntries) {
            setGroupedUserEntries(prevGroups => {
                const newGroups = {...prevGroups};
                if (newGroups[status]) {
                    newGroups[status] = {
                        ...newGroups[status],
                        isExpanded: !newGroups[status].isExpanded
                    };
                }
                return newGroups;
            });
        } else {
            setGroupedRefereeEntries(prevGroups => {
                const newGroups = {...prevGroups};
                if (newGroups[status]) {
                    newGroups[status] = {
                        ...newGroups[status],
                        isExpanded: !newGroups[status].isExpanded
                    };
                }
                return newGroups;
            });
        }
    };

    // Fetch all necessary data
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch all journals to map journal_id to journal title
                const journals = await apiService.getAllJournals();
                
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
                        const [entries, refEntries, editedJournals] = await Promise.all([
                            apiService.getMyJournalEntries(),
                            apiService.getMyRefereeEntries(),
                            apiService.getMyEditedJournals()
                        ]);
                        
                        setUserEntries(entries);
                        setRefereeEntries(refEntries);
                        setEditedJournals(editedJournals);
                        
                        // Find journals where current user is editor-in-chief
                        const editorInChiefJournalsList = journals.filter(
                            journal => journal.editor_in_chief_id === user.id
                        );
                        setEditorInChiefJournals(editorInChiefJournalsList);
                    } catch (err: any) {
                        console.error("Failed to fetch user data:", err);
                        setError("Failed to load your profile data.");
                    }
                } else {
                    // Admin viewing someone else's profile
                    // Load all necessary data
                    try {
                        const [users, entries, journalEditorLinks, journalEntryAuthorLinks, journalEntryRefereeLinks] = 
                            await Promise.all([
                                apiService.getAllUsers(),
                                apiService.getAllJournalEntries(),
                                apiService.getAllJournalEditorLinks(),
                                apiService.getAllJournalEntryAuthorLinks(),
                                apiService.getAllJournalEntryRefereeLinks()
                            ]);
                        
                        // Find the user we want to display
                        const targetUser = users.find(u => u.id === Number(userId));
                        if (targetUser) {
                            setProfileUser(targetUser);
                            
                            // Filter entries for this user
                            // 1. Find author links for this user
                            const authorLinks = journalEntryAuthorLinks.filter(
                                link => link.user_id === Number(userId)
                            );
                            
                            // 2. Use those links to find their entries
                            const userAuthorEntries = entries.filter(entry => 
                                authorLinks.some(link => link.journal_entry_id === entry.id)
                            );
                            setUserEntries(userAuthorEntries);
                            
                            // 3. Find referee links for this user
                            const refereeLinks = journalEntryRefereeLinks.filter(
                                link => link.user_id === Number(userId)
                            );
                            
                            // 4. Use those links to find their referee entries
                            const userRefereeEntries = entries.filter(entry => 
                                refereeLinks.some(link => link.journal_entry_id === entry.id)
                            );
                            setRefereeEntries(userRefereeEntries);
                            
                            // 5. Find editor links for this user
                            const editorLinks = journalEditorLinks.filter(
                                link => link.user_id === Number(userId)
                            );
                            
                            // 6. Use those links to find their edited journals
                            const userEditedJournals = journals.filter(journal => 
                                editorLinks.some(link => link.journal_id === journal.id)
                            );
                            setEditedJournals(userEditedJournals);
                            
                            // 7. Find journals where user is editor-in-chief
                            const userEditorInChiefJournals = journals.filter(
                                journal => journal.editor_in_chief_id === Number(userId)
                            );
                            setEditorInChiefJournals(userEditorInChiefJournals);
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

    // Group entries whenever userEntries, refereeEntries change or toggle state changes
    useEffect(() => {
        setGroupedUserEntries(groupEntriesByStatus(userEntries));
        setGroupedRefereeEntries(groupEntriesByStatus(refereeEntries));
    }, [userEntries, refereeEntries, showRejectedUserEntries, showRejectedRefereeEntries]);

    if (loading) {
        return <div className="loading">{t('loadingUserData') || 'Loading user data...'}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!profileUser) {
        return <div className="message-container">{t('userNotFound') || 'User not found.'}</div>;
    }

    // Helper function to render entry item
    const renderEntryItem = (entry: apiService.JournalEntryRead) => {
        return (
            <Link key={entry.id} to={`/entries/${entry.id}`} className="entry-link">
                <div className="entry-item">
                    <h4 className="entry-title">{entry.title}</h4>
                    <p className="entry-abstract">{entry.abstract_tr}</p>
                    <div className="entry-meta">
                        <span className="entry-date">
                            {t('date') || 'Date'}: {entry.date ? new Date(entry.date).toLocaleString() : new Date(entry.updated_at).toLocaleString()}
                        </span>
                        {entry.status && (
                            <span className="entry-status">
                                <span className={`badge badge-${entry.status.toLowerCase()}`}>
                                    {t(entry.status) || entry.status}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="entry-actions" onClick={(e) => e.stopPropagation()}>
                    </div>
                </div>
            </Link>
        );
    };

    // Helper function to render grouped entries with toggle button for rejected entries
    const renderGroupedEntries = (
        groupedEntries: GroupedEntries, 
        allEntries: apiService.JournalEntryRead[],
        emptyMessage: string, 
        isUserEntries: boolean, 
        showRejected: boolean,
        setShowRejected: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        const statuses = Object.keys(groupedEntries);
        
        // Get rejected entries
        const rejectedEntries = getRejectedEntries(allEntries);
        const rejectedCount = rejectedEntries.length;
        
        if (statuses.length === 0 && rejectedCount === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>{emptyMessage}</h3>
                </div>
            );
        }
        
        // Sort statuses by priority: submitted, under_review, revisions_requested, accepted, published
        const statusOrder: { [key: string]: number } = {
            'submitted': 1,
            'under_review': 2,
            'revisions_requested': 3,
            'accepted': 4,
            'published': 5,
            'unknown': 6
        };
        
        const sortedStatuses = statuses.sort((a, b) => {
            return (statusOrder[a] || 999) - (statusOrder[b] || 999);
        });
        
        return (
            <div className="entries-accordion">
                {sortedStatuses.map(status => {
                    const group = groupedEntries[status];
                    const statusDisplay = t(status) || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                    
                    return (
                        <div key={status} className="status-group">
                            <div 
                                className={`status-group-header ${group.isExpanded ? 'expanded' : ''}`}
                                onClick={() => toggleStatusGroup(status, isUserEntries)}
                            >
                                <div className="status-group-title">
                                    <h3>
                                        <span className={`badge badge-${status.toLowerCase()}`}>
                                            {statusDisplay}
                                        </span>
                                    </h3>
                                    <span className="entry-count">
                                        {group.entries.length} {group.entries.length === 1 
                                            ? (t('entry') || 'entry') 
                                            : (t('entries') || 'entries')}
                                    </span>
                                </div>
                                <span className="expand-icon">
                                    {group.isExpanded ? '▼' : '►'}
                                </span>
                            </div>
                            
                            {group.isExpanded && (
                                <div className="status-group-content">
                                    {group.entries.map(entry => renderEntryItem(entry))}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {/* Rejected entries section */}
                {rejectedCount > 0 && (
                    <div className="rejected-entries-section">
                        <div className="rejected-entries-toggle">
                            <button 
                                onClick={() => setShowRejected(!showRejected)}
                                className="toggle-rejected-btn"
                            >
                                {showRejected 
                                    ? (t('hideRejectedEntries') || 'Hide Not Accepted Entries') 
                                    : (t('showRejectedEntries') || `Show Not Accepted Entries (${rejectedCount})`)}
                            </button>
                        </div>
                        
                        {showRejected && (
                            <div className="rejected-entries-content">
                                {rejectedEntries.map(entry => renderEntryItem(entry))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    
    // Helper function to render journals list
    const renderJournalsList = (journals: apiService.Journal[], emptyMessage: string) => {
        if (journals.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>{emptyMessage}</h3>
                </div>
            );
        }
        
        return (
            <div className="journals-list">
                {journals.map(journal => (
                    <Link key={journal.id} to={`/journals/${journal.id}`} className="journal-link">
                        <div className="journal-card">
                            <h3 className="journal-title">{journal.title}</h3>
                            <div className="journal-meta">
                                <span className="journal-issue">
                                    {t('issue') || 'Issue'}: {journal.issue}
                                </span>
                                <span className="journal-date">
                                    {t('date') || 'Date'}: {new Date(journal.date).toLocaleDateString()}
                                </span>
                                {journal.is_published && (
                                    <span className="journal-published">
                                        <span className="badge badge-published">
                                            {t('published') || 'Published'}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    return (
        <div className="user-profile-container">
            <div className="profile-header">
                <h1 className="page-title">
                    {userId ? `${t('userProfile') || 'User Profile'}: ${profileUser.name}` : t('userProfile') || 'User Profile'}
                </h1>
                <div className="profile-actions">
                    {/* Edit Profile button shown only when viewing own profile and not an editor or referee */}
                    {!userId && user && user.role !== 'editor' && user.role !== 'referee' && (
                        <button 
                            onClick={() => navigate(`/profile/edit`)} 
                            className="edit-profile-btn"
                        >
                            {t('editProfile') || 'Edit Profile'}
                        </button>
                    )}
                    {/* Admin actions for other user profiles */}
                    {userId && (user?.role === 'admin' || user?.role === 'owner') && (
                        <div className="admin-profile-actions">
                            <button 
                                onClick={() => navigate(`/admin/users/edit/${userId}`)} 
                                className="edit-user-btn"
                            >
                                {t('editUser') || 'Edit User'}
                            </button>
                            <button 
                                onClick={() => navigate(-1)} 
                                className="back-button"
                            >
                                {t('backToAdminPage') || 'Back to Admin Page'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-card">
                <div className="profile-info">
                    <h2>{profileUser.name}</h2>
                    {/* Admin Badge */}
                    {profileUser.role === 'admin' && (
                      <span className="badge badge-admin">{t('admin')}</span>
                    )}
                    
                    {/* Owner Badge */}
                    {profileUser.role === 'owner' && (
                      <span className="badge badge-owner">{t('owner')}</span>
                    )}
                    
                    {/* Editor Badge */}
                    {(profileUser.role === 'editor' || profileUser.role === 'admin' || profileUser.role === 'owner') && (
                      <span className="badge badge-editor">{t('editor')}</span>
                    )}
                    
                    {/* Author Badge */}
                    {(profileUser.role === 'author' || profileUser.role === 'admin' || profileUser.role === 'owner') && (
                      <span className="badge badge-author">{t('author')}</span>
                    )}
                    
                    {/* Referee Badge */}
                    {(profileUser.role === 'referee' || profileUser.role === 'admin' || profileUser.role === 'owner') && (
                      <span className="badge badge-referee">{t('referee')}</span>
                    )}
                    
                    {profileUser.title && profileUser.role !== 'editor' && profileUser.role !== 'referee' && (
                        <div className="profile-title">
                            <p>{profileUser.title}</p>
                        </div>
                    )}
                    
                    {profileUser.bio && profileUser.role !== 'editor' && profileUser.role !== 'referee' && (
                        <div className="bio-section">
                            <h3>{t('biography') || 'Biography'}</h3>
                            <p>{profileUser.bio}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Show editor-in-chief journals - only for admin users */}
            {(profileUser.role === 'admin' || profileUser.role === 'owner') && (
                <div className="editor-in-chief-journals-section">
                    <h2>{userId ? `${t('editorInChiefJournals') || 'Editor-in-Chief Journals'}` : t('myEditorInChiefJournals') || 'Journals I Lead as Editor-in-Chief'}</h2>
                    {renderJournalsList(editorInChiefJournals, t('noEditorInChiefJournalsFound') || 'No editor-in-chief journals found.')}
                </div>
            )}

            {/* Show edited journals if user is an editor or admin */}
            {(profileUser.role === 'editor' || profileUser.role === 'admin' || profileUser.role === 'owner') && (
                <div className="edited-journals-section">
                    <h2>{userId ? `${t('editedJournals') || 'Edited Journals'}` : t('myEditedJournals') || 'Journals I Edit'}</h2>
                    {renderJournalsList(editedJournals, t('noEditedJournalsFound') || 'No journals found.')}
                </div>
            )}

            {/* Show journal entries if user is an author or admin */}
            {(profileUser.role === 'author' || profileUser.role === 'admin' || profileUser.role === 'owner') && (
                <div className="user-entries-section">
                    <h2>{userId ? `${t('journalEntries') || 'Journal Entries'}` : t('myJournalEntries') || 'My Journal Entries'}</h2>
                    {renderGroupedEntries(
                        groupedUserEntries,
                        userEntries,
                        t('noEntriesFound') || 'No entries found.', 
                        true,
                        showRejectedUserEntries,
                        setShowRejectedUserEntries
                    )}
                </div>
            )}

            {/* Show referee entries if user is a referee or admin */}
            {(profileUser.role === 'referee' || profileUser.role === 'admin' || profileUser.role === 'owner') && (
                <div className="referee-entries-section">
                    <h2>{userId ? `${t('refereeEntries') || 'Referee Entries'}` : t('myRefereeEntries') || 'Entries I Referee'}</h2>
                    {renderGroupedEntries(
                        groupedRefereeEntries,
                        refereeEntries,
                        t('noRefereeEntriesFound') || 'No referee entries found.', 
                        false,
                        showRejectedRefereeEntries,
                        setShowRejectedRefereeEntries
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfilePage; 