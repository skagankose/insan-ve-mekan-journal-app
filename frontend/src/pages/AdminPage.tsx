import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import type {
    UserRead,
    Journal,
    JournalEntryRead,
} from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminPage.css';

// Interfaces will now directly use the more detailed types from apiService

// Global Search Input Component - moved outside to prevent re-creation on every render
const GlobalSearchInput = React.memo(({ 
    globalSearchTerm, 
    setGlobalSearchTerm, 
    filteredUsers, 
    filteredJournals, 
    filteredJournalEntries,
    t,
    language 
}: {
    globalSearchTerm: string;
    setGlobalSearchTerm: (term: string) => void;
    filteredUsers: UserRead[];
    filteredJournals: Journal[];
    filteredJournalEntries: JournalEntryRead[];
    t: (key: string) => string;
    language: string;
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
                    placeholder={t('globalSearchPlaceholder') || 'Search users, journals, journal entries...'}
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path 
                                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>{t('searchResults') || 'Search Results'}:</span>
                        <span>{filteredUsers.length} {t('users') || 'users'}</span>
                        <span>•</span>
                        <span>{filteredJournals.length} {t('journals') || 'journals'}</span>
                        <span>•</span>
                        <span>{filteredJournalEntries.length} {t('entries') || 'entries'}</span>
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

    // Detail view state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedItemType, setSelectedItemType] = useState<'user' | 'journal' | 'journalEntry' | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const openDetailModal = (item: any, type: 'user' | 'journal' | 'journalEntry') => {
        setSelectedItem(item);
        setSelectedItemType(type);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setSelectedItem(null);
        setSelectedItemType(null);
        setShowDetailModal(false);
    };

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Global search state
    const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

    // Filtered data states for global search
    const [filteredUsers, setFilteredUsers] = useState<UserRead[]>([]);
    const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
    const [filteredJournalEntries, setFilteredJournalEntries] = useState<JournalEntryRead[]>([]);
    
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { t, language } = useLanguage();

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
        if (!status) return t('pending');
        
        const statusTranslations: { [key: string]: string } = {
            'accepted': t('accepted'),
            'waiting_for_referees': t('waitingForReferees'),
            'waiting_for_authors': t('waitingForAuthors'), 
            'waiting_for_editors': t('waitingForEditors'),
            'not_accepted': t('notAccepted'),
            'waiting_for_payment': t('waitingForPayment'),
            'pending': t('pending'),
            'published': t('published'),
            'rejected': t('rejected')
        };
        
        return statusTranslations[status.toLowerCase()] || status;
    };

    // Global Search Input Component moved outside to prevent re-creation

    // Accordion Section Component
    // Removed AccordionSection as it's not used in card-based interface

    // These functions are no longer needed with the card-based approach

    // Removed handleSettingsUpdate as it's not used in card-based interface

    if (loading) {
        return <div className="loading-container">{t('loading')}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    // Card Components
    const UserCard = ({ user }: { user: UserRead }) => (
        <div className="search-card user-card" onClick={() => openDetailModal(user, 'user')}>
            <div className="card-header">
                <div className="card-type">User</div>
                <span className={`badge badge-${user.role}`}>{user.role}</span>
            </div>
            <div className="card-content">
                <h3 className="card-title">{user.name}</h3>
                <p className="card-subtitle">
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
        <div className="search-card journal-card" onClick={() => openDetailModal(journal, 'journal')}>
            <div className="card-header">
                <div className="card-type">Journal</div>
                <span className={`badge ${journal.is_published ? 'badge-published' : 'badge-pending'}`}>
                    {journal.is_published ? 'Published' : 'Draft'}
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
        <div className="search-card entry-card" onClick={() => openDetailModal(entry, 'journalEntry')}>
            <div className="card-header">
                <div className="card-type">Journal Entry</div>
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

    // Function to handle navigation to detail pages
    const navigateToDetailPage = () => {
        if (!selectedItem || !selectedItemType) return;
        
        switch (selectedItemType) {
            case 'user':
                navigate(`/admin/users/profile/${selectedItem.id}`);
                break;
            case 'journal':
                navigate(`/journals/${selectedItem.id}`);
                break;
            case 'journalEntry':
                navigate(`/entries/${selectedItem.id}`);
                break;
        }
        closeDetailModal();
    };

    // Detail Modal Component
    const DetailModal = () => {
        if (!showDetailModal || !selectedItem) return null;

        const renderUserDetails = (user: UserRead) => (
            <div className="detail-content">
                <div className="detail-field">
                    <label>ID:</label>
                    <span>{user.id}</span>
                    </div>
                <div className="detail-field">
                    <label>Email:</label>
                    <span>{user.email}</span>
                    </div>
                <div className="detail-field">
                    <label>Name:</label>
                    <span>{user.name}</span>
                </div>
                <div className="detail-field">
                    <label>Title:</label>
                    <span>{user.title || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Bio:</label>
                    <span>{user.bio || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Telephone:</label>
                    <span>{user.telephone || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Science Branch:</label>
                    <span>{user.science_branch || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Location:</label>
                    <span>{user.location || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>YOKSIS ID:</label>
                    <span>{user.yoksis_id || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>ORCID ID:</label>
                    <span>{user.orcid_id || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Role:</label>
                    <span className={`badge badge-${user.role}`}>{user.role}</span>
                </div>
                <div className="detail-field">
                    <label>Authenticated:</label>
                    <span>{user.is_auth ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-field">
                    <label>Marked for Deletion:</label>
                    <span>{user.marked_for_deletion ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-field">
                    <label>Tutorial Done:</label>
                    <span>{user.tutorial_done ? 'Yes' : 'No'}</span>
                </div>
            </div>
        );

        const renderJournalDetails = (journal: Journal) => (
            <div className="detail-content">
                <div className="detail-field">
                    <label>ID:</label>
                    <span>{journal.id}</span>
                    </div>
                <div className="detail-field">
                    <label>Title (TR):</label>
                    <span>{journal.title}</span>
                </div>
                <div className="detail-field">
                    <label>Title (EN):</label>
                    <span>{journal.title_en || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Issue:</label>
                    <span>{journal.issue}</span>
                </div>
                <div className="detail-field">
                    <label>Created Date:</label>
                    <span>{journal.created_date ? new Date(journal.created_date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Publication Date:</label>
                    <span>{journal.publication_date ? new Date(journal.publication_date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Publication Place:</label>
                    <span>{journal.publication_place || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Published:</label>
                    <span>{journal.is_published ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-field">
                    <label>Cover Photo:</label>
                    <span>
                        {journal.cover_photo ? (
                            <a href={journal.cover_photo} target="_blank" rel="noopener noreferrer" className="file-link">
                                View File
                                                            </a>
                                                        ) : '-'}
                    </span>
                </div>
                <div className="detail-field">
                    <label>Meta Files:</label>
                    <span>
                        {journal.meta_files ? (
                            <a href={journal.meta_files} target="_blank" rel="noopener noreferrer" className="file-link">
                                View File
                                                            </a>
                                                        ) : '-'}
                    </span>
                </div>
                <div className="detail-field">
                    <label>Editor Notes:</label>
                    <span>
                        {journal.editor_notes ? (
                            <a href={journal.editor_notes} target="_blank" rel="noopener noreferrer" className="file-link">
                                View File
                                                            </a>
                                                        ) : '-'}
                    </span>
                </div>
                <div className="detail-field">
                    <label>Full PDF:</label>
                    <span>
                        {journal.full_pdf ? (
                            <a href={journal.full_pdf} target="_blank" rel="noopener noreferrer" className="file-link">
                                View File
                                                            </a>
                                                        ) : '-'}
                    </span>
                </div>
            </div>
        );

        const renderJournalEntryDetails = (entry: JournalEntryRead) => (
            <div className="detail-content">
                <div className="detail-field">
                    <label>ID:</label>
                    <span>{entry.id}</span>
                    </div>
                <div className="detail-field">
                    <label>Title (TR):</label>
                    <span>{entry.title}</span>
                </div>
                <div className="detail-field">
                    <label>Title (EN):</label>
                    <span>{entry.title_en || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Abstract (TR):</label>
                    <span>{entry.abstract_tr || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Abstract (EN):</label>
                    <span>{entry.abstract_en || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Keywords:</label>
                    <span>{entry.keywords || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>DOI:</label>
                    <span>{entry.doi || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Article Type:</label>
                    <span>{entry.article_type || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Language:</label>
                    <span>{entry.language || '-'}</span>
                </div>
                <div className="detail-field">
                    <label>Status:</label>
                    <span className={`badge badge-${entry.status?.toLowerCase() || 'pending'}`}>
                        {translateStatus(entry.status)}
                    </span>
                </div>
                <div className="detail-field">
                    <label>Journal ID:</label>
                    <span>{entry.journal_id}</span>
                </div>
                <div className="detail-field">
                    <label>Authors:</label>
                    <span>
                        {entry.authors && entry.authors.length > 0 
                            ? entry.authors.map(author => author.name).join(', ')
                            : '-'
                        }
                    </span>
                </div>
                <div className="detail-field">
                    <label>Created Date:</label>
                    <span>{entry.created_date ? new Date(entry.created_date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="detail-field">
                    <label>File Path:</label>
                    <span>
                        {entry.file_path ? (
                            <a href={entry.file_path} target="_blank" rel="noopener noreferrer" className="file-link">
                                View File
                            </a>
                        ) : '-'}
                    </span>
                </div>
            </div>
        );

                                                return (
            <div className="detail-modal-overlay" onClick={closeDetailModal}>
                <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="detail-modal-header">
                        <h2>
                            {selectedItemType === 'user' && 'User Details'}
                            {selectedItemType === 'journal' && 'Journal Details'}
                            {selectedItemType === 'journalEntry' && 'Journal Entry Details'}
                        </h2>
                        <div className="detail-modal-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button 
                                className="detail-modal-navigate" 
                                onClick={navigateToDetailPage}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                title={
                                    selectedItemType === 'user' ? 'Go to User Profile' :
                                    selectedItemType === 'journal' ? 'Go to Journal Details' :
                                    'Go to Entry Details'
                                }
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {selectedItemType === 'user' ? t('viewProfile') || 'View Profile' :
                                 selectedItemType === 'journal' ? t('viewDetails') || 'View Details' :
                                 t('viewDetails') || 'View Details'}
                            </button>
                            <button className="detail-modal-close" onClick={closeDetailModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="detail-modal-content">
                        {selectedItemType === 'user' && renderUserDetails(selectedItem)}
                        {selectedItemType === 'journal' && renderJournalDetails(selectedItem)}
                        {selectedItemType === 'journalEntry' && renderJournalEntryDetails(selectedItem)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
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
                        language={language}
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
                                backgroundColor: '#10b981',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M4 19.5C4 18.119 5.119 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.5 2H20V22H6.5C5.119 22 4 20.881 4 19.5V4.5C4 3.119 5.119 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('createJournal') || 'Create Journal'}
                        </Link>
                        </div>

                    {/* Search Results Cards */}
                    {globalSearchTerm && (
                        <div className="search-results-container">
                            {/* Users Results */}
                            {filteredUsers.length > 0 && (
                                <div className="search-section">
                                    <h3 className="section-title">
                                        Users ({filteredUsers.length})
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
                                <div className="search-section">
                                    <h3 className="section-title">
                                        Journals ({filteredJournals.length})
                                    </h3>
                                    <div className="cards-grid">
                                        {filteredJournals.map(journal => (
                                            <JournalCard key={`journal-${journal.id}`} journal={journal} />
                                        ))}
                        </div>
                                </div>
                            )}

                            {/* Journal Entries Results */}
                            {filteredJournalEntries.length > 0 && (
                                <div className="search-section">
                                    <h3 className="section-title">
                                        Journal Entries ({filteredJournalEntries.length})
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
                                    <h3>No results found</h3>
                                    <p>Try adjusting your search terms.</p>
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

                    {/* Detail Modal */}
                    <DetailModal />
        </div>
            </div>
        </>
    );

}; 
export default AdminPage;
