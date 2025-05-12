import React, { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './UserProfilePage.css';

// Define interface for grouped entries
interface GroupedEntries {
    [journalId: string]: {
        journal: apiService.Journal | null;
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
    const [allJournals, setAllJournals] = useState<apiService.Journal[]>([]);
    const [groupedUserEntries, setGroupedUserEntries] = useState<GroupedEntries>({});
    const [groupedRefereeEntries, setGroupedRefereeEntries] = useState<GroupedEntries>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [profileUser, setProfileUser] = useState<apiService.UserRead | null>(null);
    
    // Group entries by journal ID
    const groupEntriesByJournal = (entries: apiService.JournalEntryRead[]): GroupedEntries => {
        const grouped: GroupedEntries = {};
        
        entries.forEach(entry => {
            // Handle entries without a journal
            const journalIdKey = entry.journal_id?.toString() || 'noJournal';
            
            if (!grouped[journalIdKey]) {
                const journal = entry.journal_id
                    ? allJournals.find(j => j.id === entry.journal_id) || null
                    : null;
                
                grouped[journalIdKey] = {
                    journal: journal,
                    entries: [],
                    isExpanded: false
                };
            }
            
            grouped[journalIdKey].entries.push(entry);
        });
        
        return grouped;
    };
    
    // Toggle the expanded state of a journal group
    const toggleJournalGroup = (journalId: string, isUserEntries: boolean) => {
        if (isUserEntries) {
            setGroupedUserEntries(prevGroups => {
                const newGroups = {...prevGroups};
                if (newGroups[journalId]) {
                    newGroups[journalId] = {
                        ...newGroups[journalId],
                        isExpanded: !newGroups[journalId].isExpanded
                    };
                }
                return newGroups;
            });
        } else {
            setGroupedRefereeEntries(prevGroups => {
                const newGroups = {...prevGroups};
                if (newGroups[journalId]) {
                    newGroups[journalId] = {
                        ...newGroups[journalId],
                        isExpanded: !newGroups[journalId].isExpanded
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
                setAllJournals(journals);
                
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

    // Group entries whenever userEntries, refereeEntries, or allJournals change
    useEffect(() => {
        if (allJournals.length > 0) {
            setGroupedUserEntries(groupEntriesByJournal(userEntries));
            setGroupedRefereeEntries(groupEntriesByJournal(refereeEntries));
        }
    }, [userEntries, refereeEntries, allJournals]);

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
            <div key={entry.id} className="entry-item">
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
                <div className="entry-actions">
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                        <Link to={`/entries/edit/${entry.id}`} className="view-entry-btn">
                            {t('viewEdit') || 'View/Edit'}
                        </Link>
                    )}
                    <Link to={`/entries/${entry.id}/updates`} className="view-updates-btn">
                        {t('viewUpdates') || 'View Updates'}
                    </Link>
                </div>
            </div>
        );
    };

    // Helper function to render grouped entries
    const renderGroupedEntries = (groupedEntries: GroupedEntries, emptyMessage: string, isUserEntries: boolean) => {
        const journalIds = Object.keys(groupedEntries);
        
        if (journalIds.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>{emptyMessage}</h3>
                </div>
            );
        }
        
        // Sort journals: first by those with titles, then by date (newest first)
        const sortedJournalIds = journalIds.sort((a, b) => {
            const journalA = groupedEntries[a].journal;
            const journalB = groupedEntries[b].journal;
            
            // If one has a journal and the other doesn't, prioritize the one with a journal
            if (journalA && !journalB) return -1;
            if (!journalA && journalB) return 1;
            
            // If both have journals, sort by date (newest first)
            if (journalA && journalB) {
                return new Date(journalB.date).getTime() - new Date(journalA.date).getTime();
            }
            
            return 0;
        });
        
        return (
            <div className="entries-accordion">
                {sortedJournalIds.map(journalId => {
                    const group = groupedEntries[journalId];
                    const journalName = group.journal 
                        ? group.journal.title 
                        : (t('noJournal') || 'No Journal');
                    const issueInfo = group.journal 
                        ? `${t('issue') || 'Issue'}: ${group.journal.issue}` 
                        : '';
                    
                    return (
                        <div key={journalId} className="journal-group">
                            <div 
                                className={`journal-group-header ${group.isExpanded ? 'expanded' : ''}`}
                                onClick={() => toggleJournalGroup(journalId, isUserEntries)}
                            >
                                <div className="journal-group-title">
                                    <h3>{journalName}</h3>
                                    {issueInfo && <span className="journal-issue">{issueInfo}</span>}
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
                                <div className="journal-group-content">
                                    {group.entries.map(entry => renderEntryItem(entry))}
                                </div>
                            )}
                        </div>
                    );
                })}
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
                    <div key={journal.id} className="journal-card">
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
                    {/* Edit Profile button shown only when viewing own profile */}
                    {!userId && user && (
                        <button 
                            onClick={() => navigate(`/profile/edit`)} 
                            className="edit-profile-btn"
                        >
                            {t('editProfile') || 'Edit Profile'}
                        </button>
                    )}
                    {/* Admin actions for other user profiles */}
                    {userId && user?.role === 'admin' && (
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
                    {profileUser.role && (
                        <span className={`badge badge-${profileUser.role.toLowerCase()}`}>
                            {profileUser.role}
                        </span>
                    )}
                    
                    {profileUser.title && (
                        <div className="profile-title">
                            <p>{profileUser.title}</p>
                        </div>
                    )}
                    
                    {profileUser.bio && (
                        <div className="bio-section">
                            <h3>{t('biography') || 'Biography'}</h3>
                            <p>{profileUser.bio}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Show edited journals if user is an editor or admin */}
            {(profileUser.role === 'editor' || profileUser.role === 'admin') && (
                <div className="edited-journals-section">
                    <h2>{userId ? `${t('editedJournals') || 'Edited Journals'}` : t('myEditedJournals') || 'Journals I Edit'}</h2>
                    {renderJournalsList(editedJournals, t('noEditedJournalsFound') || 'No journals found.')}
                </div>
            )}

            {/* Show journal entries if user is an author or admin */}
            {(profileUser.role === 'author' || profileUser.role === 'admin' || profileUser.role === 'editor') && (
                <div className="user-entries-section">
                    <h2>{userId ? `${t('journalEntries') || 'Journal Entries'}` : t('myJournalEntries') || 'My Journal Entries'}</h2>
                    {renderGroupedEntries(groupedUserEntries, t('noEntriesFound') || 'No entries found.', true)}
                </div>
            )}

            {/* Show referee entries if user is a referee or admin */}
            {(profileUser.role === 'referee' || profileUser.role === 'admin') && (
                <div className="referee-entries-section">
                    <h2>{userId ? `${t('refereeEntries') || 'Referee Entries'}` : t('myRefereeEntries') || 'Entries I Referee'}</h2>
                    {renderGroupedEntries(groupedRefereeEntries, t('noRefereeEntriesFound') || 'No referee entries found.', false)}
                </div>
            )}
        </div>
    );
};

export default UserProfilePage; 