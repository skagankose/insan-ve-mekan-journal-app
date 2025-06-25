import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import type {
    UserRead,
    Journal,
    JournalEntryRead,
} from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminPage.css';
import './UserProfilePage.css'; // Import toast styles

// Interfaces will now directly use the more detailed types from apiService

// Global Search Input Component - moved outside to prevent re-creation on every render
const GlobalSearchInput = React.memo(({ 
    globalSearchTerm, 
    setGlobalSearchTerm, 
    filteredUsers, 
    filteredJournals, 
    filteredJournalEntries,
    t
}: {
    globalSearchTerm: string;
    setGlobalSearchTerm: (term: string) => void;
    filteredUsers: UserRead[];
    filteredJournals: Journal[];
    filteredJournalEntries: JournalEntryRead[];
    t: (key: string) => string;
}) => {
    return (
        <div className="global-search-container">
            <div className="global-search-wrapper">
                <svg 
                    className="search-icon" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none"
                >
                    <path 
                        d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
                <input
                    type="text"
                    className="global-search-input"
                    placeholder={t('globalSearchPlaceholder') || 'Search users, journals, papers...'}
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                />
                {globalSearchTerm && (
                        <button
                        className="search-clear-button"
                        onClick={() => setGlobalSearchTerm('')}
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path 
                                d="M18 6L6 18M6 6L18 18" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
                    </div>
            {globalSearchTerm && (
                <div className="search-results-summary">
                    <div className="search-results-info">
                        <span>{t('searchResults') || 'Search Results'}:</span>
                        <span>{filteredUsers.length} {t('users') || 'users'}</span>
                        <span>•</span>
                        <span>{filteredJournals.length} {t('journals') || 'journals'}</span>
                        <span>•</span>
                        <span>{filteredJournalEntries.length} {t('papers') || 'papers'}</span>
                    </div>
                </div>
            )}
        </div>
    );
});

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<UserRead[]>([]);
    const [journals, setJournals] = useState<Journal[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntryRead[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Toast state
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'warning'>('success');
    
    // Global search state
    const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

    // Filtered data states for global search
    const [filteredUsers, setFilteredUsers] = useState<UserRead[]>([]);
    const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
    const [filteredJournalEntries, setFilteredJournalEntries] = useState<JournalEntryRead[]>([]);
    
    // Users marked for deletion state
    const [usersMarkedForDeletion, setUsersMarkedForDeletion] = useState<UserRead[]>([]);
    const [showMarkedUsers, setShowMarkedUsers] = useState<boolean>(false);
    
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin' && user?.role !== 'owner') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch main data for search (users, journals, journal entries)
                const [usersData, journalsData, entriesData] = await Promise.all([
                    apiService.getAllUsers(0, 1000),
                    apiService.getAllJournals(0, 1000), 
                    apiService.getAllJournalEntries(0, 1000)
                ]);
                
                setUsers(usersData);
                setJournals(journalsData);
                setJournalEntries(entriesData);

            } catch (err: any) {
                console.error('Failed to fetch data:', err);
                setError(err.response?.data?.detail || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, user, navigate]);

    // Check for success parameter and show toast
    useEffect(() => {
        const deleted = searchParams.get('deleted');
        
        if (deleted === 'true') {
            setToastMessage(t('userDeletedSuccessfully') || 'User deleted successfully!');
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
    }, [searchParams, setSearchParams, t]);

    // Update filtered data when original data or global search term changes
    useEffect(() => {
        setFilteredUsers(globalSearchUsers(users, globalSearchTerm));
    }, [users, globalSearchTerm]);

    useEffect(() => {
        setFilteredJournals(globalSearchJournals(journals, globalSearchTerm));
    }, [journals, globalSearchTerm]);

    useEffect(() => {
        setFilteredJournalEntries(globalSearchJournalEntries(journalEntries, globalSearchTerm));
    }, [journalEntries, globalSearchTerm]);

    // Update users marked for deletion when users data changes
    useEffect(() => {
        const markedUsers = users.filter(user => user.marked_for_deletion);
        setUsersMarkedForDeletion(markedUsers);
    }, [users]);

    // Removed renderCell function as it's not used in card-based interface

    // Removed renderCellWithTooltip as it's not used in card-based interface

    // Global search functions
    const globalSearchUsers = (users: UserRead[], searchTerm: string) => {
        if (!searchTerm.trim()) return users;
        
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            user.email?.toLowerCase().includes(term) ||
            user.name?.toLowerCase().includes(term) ||
            user.title?.toLowerCase().includes(term) ||
            user.bio?.toLowerCase().includes(term) ||
            user.science_branch?.toLowerCase().includes(term) ||
            user.location?.toLowerCase().includes(term) ||
            user.role?.toLowerCase().includes(term) ||
            user.yoksis_id?.toLowerCase().includes(term) ||
            user.orcid_id?.toLowerCase().includes(term)
        );
    };

    const globalSearchJournals = (journals: Journal[], searchTerm: string) => {
        if (!searchTerm.trim()) return journals;
        
        const term = searchTerm.toLowerCase();
        return journals.filter(journal => 
            journal.title?.toLowerCase().includes(term) ||
            journal.title_en?.toLowerCase().includes(term) ||
            journal.issue?.toString().includes(term) ||
            journal.publication_place?.toLowerCase().includes(term)
        );
    };

    const globalSearchJournalEntries = (entries: JournalEntryRead[], searchTerm: string) => {
        if (!searchTerm.trim()) return entries;
        
        const term = searchTerm.toLowerCase();
        return entries.filter(entry => 
            entry.title?.toLowerCase().includes(term) ||
            entry.title_en?.toLowerCase().includes(term) ||
            entry.abstract_tr?.toLowerCase().includes(term) ||
            entry.abstract_en?.toLowerCase().includes(term) ||
            entry.keywords?.toLowerCase().includes(term) ||
            entry.doi?.toLowerCase().includes(term) ||
            entry.article_type?.toLowerCase().includes(term) ||
            entry.language?.toLowerCase().includes(term) ||
            entry.status?.toLowerCase().includes(term) ||
            entry.authors?.some(author => author.name?.toLowerCase().includes(term))
        );
    };

    // Translation function for journal entry status
    const translateStatus = (status: string | undefined): string => {
        if (!status) return t('pending') || 'Pending';
        
        const statusMap: { [key: string]: string } = {
            'accepted': t('accepted') || 'Accepted',
            'rejected': t('rejected') || 'Rejected',
            'pending': t('pending') || 'Pending',
            'not_accepted': t('notAccepted') || 'Not Accepted',
            'waiting_for_payment': t('waitingForPayment') || 'Waiting for Payment',
            'waiting_for_authors': t('waitingForAuthors') || 'Waiting for Authors',
            'waiting_for_referees': t('waitingForReferees') || 'Waiting for Referees',
            'waiting_for_editors': t('waitingForEditors') || 'Waiting for Editors'
        };
        
        return statusMap[status] || status;
    };

    const translateRole = (role: string): string => {
        const roleMap: { [key: string]: string } = {
            'admin': t('admin') || 'Admin',
            'owner': t('owner') || 'Owner',
            'editor': t('editor') || 'Editor',
            'referee': t('roleReferee') || 'Referee', 
            'author': t('author') || 'Author'
        };
        
        return roleMap[role] || role;
    };

    const translateJournalStatus = (isPublished: boolean): string => {
        return isPublished ? (t('published') || 'Published') : (t('draft') || 'Draft');
    };

    const translateCardType = (type: 'user' | 'journal' | 'paper'): string => {
        const typeMap: { [key: string]: string } = {
            'user': t('user') || 'User',
            'journal': t('journal') || 'Journal',
            'paper': t('paper') || 'Paper'
        };
        
        return typeMap[type] || type;
    };

    // Global Search Input Component moved outside to prevent re-creation

    // Accordion Section Component
    // Removed AccordionSection as it's not used in card-based interface

    // These functions are no longer needed with the card-based approach

    // Removed handleSettingsUpdate as it's not used in card-based interface

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    // Card Components
    const UserCard = ({ user }: { user: UserRead }) => (
        <div className="search-card user-card" onClick={() => window.open(`/admin/users/profile/${user.id}`, '_blank', 'noopener,noreferrer')}>
            <div className="card-header">
                <h3 className="card-title" style={{ margin: '0', fontSize: '1.125rem', fontWeight: '700' }}>{user.name}</h3>
                <span className={`badge badge-${user.role}`}>{translateRole(user.role)}</span>
            </div>
            <div className="card-content">
                <p className="card-subtitle" style={{ margin: '0' }}>
                    {user.title}
                    {user.title && user.email && <span style={{ marginLeft: '8px', fontWeight: '500', color: '#6B7280' }}>• {user.email}</span>}
                    {!user.title && user.email && <span>{user.email}</span>}
                </p>
                <div className="card-meta">
                    {/* Removed title, science_branch, and location from meta */}
                </div>
            </div>
        </div>
    );

    const JournalCard = ({ journal }: { journal: Journal }) => (
        <div className="search-card journal-card" onClick={() => window.open(`/journals/${journal.id}`, '_blank', 'noopener,noreferrer')}>
            <div className="card-header">
                <div className="card-type">{translateCardType('journal')}</div>
                <span className={`badge ${journal.is_published ? 'badge-published' : 'badge-pending'}`}>
                    {translateJournalStatus(journal.is_published)}
                </span>
                    </div>
            <div className="card-content">
                <h3 className="card-title">
                    {language === 'en' && journal.title_en ? journal.title_en : journal.title}
                </h3>
                <p className="card-subtitle">
                    {language === 'en' ? journal.title : journal.title_en}
                </p>
                <div className="card-meta">
                    {/* Removed issue number, publication place, and publication date */}
                </div>
            </div>
        </div>
    );

    const JournalEntryCard = ({ entry }: { entry: JournalEntryRead }) => (
        <div className="search-card entry-card" onClick={() => window.open(`/entries/${entry.id}`, '_blank', 'noopener,noreferrer')}>
            <div className="card-header">
                <div className="card-type">{translateCardType('paper')}</div>
                <span className={`badge badge-${entry.status?.toLowerCase() || 'pending'}`}>
                    {translateStatus(entry.status)}
                </span>
            </div>
            <div className="card-content">
                <h3 className="card-title">
                    {language === 'en' && entry.title_en ? entry.title_en : entry.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <p className="card-subtitle" style={{ flex: '1', margin: '0' }}>
                        {language === 'en' ? entry.title : entry.title_en}
                    </p>
                    {entry.authors && entry.authors.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '500', textAlign: 'right', flexShrink: 0 }}>
                            {entry.authors.map(author => author.name).join(', ')}
                        </div>
                    )}
                </div>
                <div className="card-meta">
                    {/* Authors moved to subtitle area */}
                </div>
            </div>
            </div>
        );

    return (
        <>
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
            
            {/* Title Section */}
            <div className="page-title-section" style={{ marginLeft: '60px' }}>
                <h1>{t('adminDashboard')}</h1>
            </div>

            {/* Content Section */}
            <div className="page-content-section" style={{
                paddingBottom: '20px'
            }}>
                <div style={{
                    margin: '0 auto',
                    marginLeft: '60px'
                }}>
                    {/* Global Search */}
                    <GlobalSearchInput 
                        globalSearchTerm={globalSearchTerm}
                        setGlobalSearchTerm={setGlobalSearchTerm}
                        filteredUsers={filteredUsers}
                        filteredJournals={filteredJournals}
                        filteredJournalEntries={filteredJournalEntries}
                        t={t}
                    />

                    {/* Admin Action Buttons */}
                    <div className="admin-actions-section" style={{ 
                        margin: '24px 0', 
                        display: 'flex', 
                        gap: '12px', 
                        flexWrap: 'wrap' 
                    }}>
                        <Link 
                            to="/admin/users/create" 
                            className="admin-action-button create-user-btn"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('createUser') || 'Create User'}
                        </Link>
                        
                        <Link 
                            to="/journals/new" 
                            className="admin-action-button create-journal-btn"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                backgroundColor: '#a855f7',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#a855f7'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M4 19.5C4 18.119 5.119 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.5 2H20V22H6.5C5.119 22 4 20.881 4 19.5V4.5C4 3.119 5.119 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('createJournal') || 'Create Journal'}
                        </Link>

                        {/* Users Marked for Deletion Button - Only show if there are users marked for deletion */}
                        {usersMarkedForDeletion.length > 0 && (
                            <button 
                                className="admin-action-button marked-users-btn"
                                onClick={() => setShowMarkedUsers(!showMarkedUsers)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M16 4H8C6.34315 4 5 5.34315 5 7V17C5 18.6569 6.34315 20 8 20H16C17.6569 20 19 18.6569 19 17V7C19 5.34315 17.6569 4 16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {showMarkedUsers ? (t('hideMarkedUsers') || 'Hide Marked Users') : (t('markedForDeletion') || 'Marked for Deletion')}
                                
                                {/* Notification Badge */}
                                <span className="notification-badge">
                                    {usersMarkedForDeletion.length}
                                </span>
                            </button>
                        )}
                        </div>

                    {/* Users Marked for Deletion Section */}
                    {showMarkedUsers && usersMarkedForDeletion.length > 0 && (
                        <div className="cards-grid" style={{ marginBottom: '2rem', marginTop: '2rem' }}>
                            {usersMarkedForDeletion.map(user => (
                                <div key={`marked-user-${user.id}`} className="search-card user-card marked-user-card" 
                                     onClick={() => window.location.href = `/admin/users/profile/${user.id}`}
                                     style={{
                                         border: '2px solid #FCA5A5',
                                         backgroundColor: 'rgba(249, 250, 251, 0.5)'
                                     }}>
                                    <div className="card-header">
                                        <h3 className="card-title" style={{ margin: '0', fontSize: '1.125rem', fontWeight: '700' }}>{user.name}</h3>
                                        <span className={`badge badge-${user.role}`}>{translateRole(user.role)}</span>
                                    </div>
                                    <div className="card-content">
                                        <p className="card-subtitle" style={{ margin: '0' }}>
                                            {user.title}
                                            {user.title && user.email && <span style={{ marginLeft: '8px', fontWeight: '500', color: '#6B7280' }}>• {user.email}</span>}
                                            {!user.title && user.email && <span>{user.email}</span>}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Results Cards */}
                    {globalSearchTerm && (
                        <div className="search-results-container">
                            {/* Users Results */}
                            {filteredUsers.length > 0 && (
                                <div className="search-section users-section">
                                    <h3 className="section-title">
                                        {t('users') || 'Users'} ({filteredUsers.length})
                                    </h3>
                                    <div className="cards-grid">
                                        {filteredUsers.map(user => (
                                            <UserCard key={`user-${user.id}`} user={user} />
                                        ))}
                        </div>
                                </div>
                            )}

                            {/* Journals Results */}
                            {filteredJournals.length > 0 && (
                                <div className="search-section journals-section">
                                    <h3 className="section-title">
                                        {t('journals') || 'Journals'} ({filteredJournals.length})
                                    </h3>
                                    <div className="cards-grid">
                                        {filteredJournals.map(journal => (
                                            <JournalCard key={`journal-${journal.id}`} journal={journal} />
                                        ))}
                        </div>
                                </div>
                            )}

                            {/* Papers Results */}
                            {filteredJournalEntries.length > 0 && (
                                <div className="search-section papers-section">
                                    <h3 className="section-title">
                                        {t('papers') || 'Papers'} ({filteredJournalEntries.length})
                                    </h3>
                                    <div className="cards-grid">
                                        {filteredJournalEntries.map(entry => (
                                            <JournalEntryCard key={`entry-${entry.id}`} entry={entry} />
                                        ))}
                        </div>
                                </div>
                            )}

                            {/* No Results */}
                            {filteredUsers.length === 0 && filteredJournals.length === 0 && filteredJournalEntries.length === 0 && (
                                <div className="no-results">
                                    <h3>{t('noResultsFound') || 'No results found'}</h3>
                                    <p>{t('adjustSearchTerms') || 'Try adjusting your search terms.'}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Initial State - Show instruction to search */}
                    {!globalSearchTerm && (
                        <div className="initial-state">
                            <div className="welcome-message">
                                {/* <h2>{t('admin.welcomeTitle')}</h2>
                                <p>{t('admin.welcomeDescription')}</p> */}
                                <div className="search-tips">
                                    <h4>{t('admin.searchTipsTitle')}</h4>
                                    <ul>
                                        <li>{t('admin.searchTip1')}</li>
                                        <li>{t('admin.searchTip2')}</li>
                                        <li>{t('admin.searchTip3')}</li>
                                    </ul>
                        </div>
                            </div>
                        </div>
                )}
        </div>
            </div>
        </>
    );

}; 
export default AdminPage;
