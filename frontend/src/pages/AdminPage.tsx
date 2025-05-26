import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import type {
    UserRead,
    Journal,
    JournalEntryRead,
    AuthorUpdateRead,
    RefereeUpdateRead,
    Settings,
    JournalEditorLinkRead,
    JournalEntryAuthorLinkRead,
    JournalEntryRefereeLinkRead,
} from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminPage.css';

// Interfaces will now directly use the more detailed types from apiService

// Add SettingsEditor component at the top of the file
const SettingsEditor = React.memo(({ 
    settings, 
    onSave,
    renderCell 
}: { 
    settings: Settings; 
    onSave: (newAbout: string) => Promise<void>;
    renderCell: (value: any) => string;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(settings.about || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { t } = useLanguage();

    const handleSave = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await onSave(editedText);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = () => {
        setIsEditing(true);
        setEditedText(settings.about || '');
        // Focus the textarea after a short delay
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 0);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedText(settings.about || '');
        setError(null);
    };

    return (
        <>
            <td>{renderCell(settings.id)}</td>
            <td>{renderCell(settings.active_journal_id)}</td>
            <td>
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="form-control"
                        rows={5}
                        style={{ width: '100%', minWidth: '300px' }}
                    />
                ) : (
                    renderCell(settings.about)
                )}
            </td>
            <td>
                {isEditing ? (
                    <div className="button-group">
                        <button
                            onClick={handleSave}
                            className="btn btn-primary btn-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? t('saving') || 'Saving...' : t('save') || 'Save'}
                        </button>
                        <button
                            onClick={cancelEditing}
                            className="btn btn-secondary btn-sm"
                            disabled={isLoading}
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startEditing}
                        className="btn btn-primary btn-sm"
                    >
                        {t('edit') || 'Edit'}
                    </button>
                )}
            </td>
            {error && (
                <td colSpan={4}>
                    <div className="error-message">
                        {error}
                    </div>
                </td>
            )}
        </>
    );
});

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<UserRead[]>([]);
    const [journals, setJournals] = useState<Journal[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntryRead[]>([]);
    const [authorUpdates, setAuthorUpdates] = useState<AuthorUpdateRead[]>([]);
    const [refereeUpdates, setRefereeUpdates] = useState<RefereeUpdateRead[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [journalEditorLinks, setJournalEditorLinks] = useState<JournalEditorLinkRead[]>([]);
    const [journalEntryAuthorLinks, setJournalEntryAuthorLinks] = useState<JournalEntryAuthorLinkRead[]>([]);
    const [journalEntryRefereeLinks, setJournalEntryRefereeLinks] = useState<JournalEntryRefereeLinkRead[]>([]);

    // Define pagination type
    type SectionType = 'editorLinks' | 'authorLinks' | 'refereeLinks' | 'users' | 'journals' | 'journalEntries' | 'authorUpdates' | 'refereeUpdates';
    
    interface PaginationState {
        page: number;
        pageSize: number;
        total: number;
        sectionType: SectionType;
    }
    
    // Pagination states with fixed page size of 50 items
    const [usersPagination, setUsersPagination] = useState<PaginationState>({
        page: 0,
        pageSize: 50,
        total: 0,
        sectionType: 'users'
    });
    
    const [journalsPagination, setJournalsPagination] = useState<PaginationState>({
        page: 0,
        pageSize: 50,
        total: 0,
        sectionType: 'journals'
    });
    
    const [journalEntriesPagination, setJournalEntriesPagination] = useState<PaginationState>({
        page: 0,
        pageSize: 50,
        total: 0,
        sectionType: 'journalEntries'
    });
    
    const [authorUpdatesPagination, setAuthorUpdatesPagination] = useState<PaginationState>({
        page: 0,
        pageSize: 50,
        total: 0,
        sectionType: 'authorUpdates'
    });
    
    const [refereeUpdatesPagination, setRefereeUpdatesPagination] = useState<PaginationState>({
        page: 0,
        pageSize: 50,
        total: 0,
        sectionType: 'refereeUpdates'
    });
    
    const [editorLinksPagination, setEditorLinksPagination] = useState<PaginationState>({ 
        page: 0, 
        pageSize: 50, 
        total: 0, 
        sectionType: 'editorLinks' 
    });
    
    const [authorLinksPagination, setAuthorLinksPagination] = useState<PaginationState>({ 
        page: 0, 
        pageSize: 50, 
        total: 0, 
        sectionType: 'authorLinks' 
    });
    
    const [refereeLinksPagination, setRefereeLinksPagination] = useState<PaginationState>({ 
        page: 0, 
        pageSize: 50, 
        total: 0, 
        sectionType: 'refereeLinks' 
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Loading states for individual sections
    const [usersLoading, setUsersLoading] = useState<boolean>(false);
    const [journalsLoading, setJournalsLoading] = useState<boolean>(false);
    const [journalEntriesLoading, setJournalEntriesLoading] = useState<boolean>(false);
    const [authorUpdatesLoading, setAuthorUpdatesLoading] = useState<boolean>(false);
    const [refereeUpdatesLoading, setRefereeUpdatesLoading] = useState<boolean>(false);
    const [editorLinksLoading, setEditorLinksLoading] = useState<boolean>(false);
    const [authorLinksLoading, setAuthorLinksLoading] = useState<boolean>(false);
    const [refereeLinksLoading, setRefereeLinksLoading] = useState<boolean>(false);
    
    // Accordion state
    const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({
        users: false,
        journals: false,
        journalEntries: false,
        authorUpdates: false,
        refereeUpdates: false,
        settings: false,
        moreOptions: false,
        journalEditorLinks: false,
        journalEntryAuthorLinks: false,
        journalEntryRefereeLinks: false
    });
    
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Toggle accordion section
    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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
                setError(null); // Reset any previous errors
                
                // Initialize results
                let usersData: UserRead[] = [];
                let journalsData: Journal[] = [];
                let entriesData: JournalEntryRead[] = [];
                let authorUpdatesData: AuthorUpdateRead[] = [];
                let refereeUpdatesData: RefereeUpdateRead[] = [];
                let settingsData: Settings | null = null;
                let journalEditorLinksData: JournalEditorLinkRead[] = [];
                let journalEntryAuthorLinksData: JournalEntryAuthorLinkRead[] = [];
                let journalEntryRefereeLinksData: JournalEntryRefereeLinkRead[] = [];
                
                // Only fetch settings if user is authenticated and has proper role
                if (isAuthenticated && (user?.role === 'admin' || user?.role === 'owner')) {
                    try {
                        settingsData = await apiService.getSettings();
                    } catch (err: any) {
                        console.error('Failed to fetch settings:', err);
                        // Create a default settings object
                        settingsData = { id: 1, active_journal_id: null, about: null };
                    }
                }
                
                try {
                    setUsersLoading(true);
                    usersData = await apiService.getAllUsers(
                        usersPagination.page * usersPagination.pageSize,
                        usersPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch users:', err);
                } finally {
                    setUsersLoading(false);
                }
                
                try {
                    setJournalsLoading(true);
                    journalsData = await apiService.getAllJournals(
                        journalsPagination.page * journalsPagination.pageSize,
                        journalsPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch journals:', err);
                } finally {
                    setJournalsLoading(false);
                }
                
                try {
                    setJournalEntriesLoading(true);
                    entriesData = await apiService.getAllJournalEntries(
                        journalEntriesPagination.page * journalEntriesPagination.pageSize,
                        journalEntriesPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch journal entries:', err);
                } finally {
                    setJournalEntriesLoading(false);
                }
                
                try {
                    setAuthorUpdatesLoading(true);
                    authorUpdatesData = await apiService.getAllAuthorUpdates(
                        authorUpdatesPagination.page * authorUpdatesPagination.pageSize,
                        authorUpdatesPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch author updates:', err);
                } finally {
                    setAuthorUpdatesLoading(false);
                }
                
                try {
                    setRefereeUpdatesLoading(true);
                    refereeUpdatesData = await apiService.getAllRefereeUpdates(
                        refereeUpdatesPagination.page * refereeUpdatesPagination.pageSize,
                        refereeUpdatesPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch referee updates:', err);
                } finally {
                    setRefereeUpdatesLoading(false);
                }
                
                try {
                    setEditorLinksLoading(true);
                    journalEditorLinksData = await apiService.getAllJournalEditorLinks(
                        editorLinksPagination.page * editorLinksPagination.pageSize, 
                        editorLinksPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch journal editor links:', err);
                } finally {
                    setEditorLinksLoading(false);
                }
                
                try {
                    setAuthorLinksLoading(true);
                    journalEntryAuthorLinksData = await apiService.getAllJournalEntryAuthorLinks(
                        authorLinksPagination.page * authorLinksPagination.pageSize, 
                        authorLinksPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch journal entry author links:', err);
                } finally {
                    setAuthorLinksLoading(false);
                }
                
                try {
                    setRefereeLinksLoading(true);
                    journalEntryRefereeLinksData = await apiService.getAllJournalEntryRefereeLinks(
                        refereeLinksPagination.page * refereeLinksPagination.pageSize, 
                        refereeLinksPagination.pageSize
                    );
                } catch (err: any) {
                    console.error('Failed to fetch journal entry referee links:', err);
                } finally {
                    setRefereeLinksLoading(false);
                }
                
                setUsers(usersData);
                setJournals(journalsData);
                setJournalEntries(entriesData);
                setAuthorUpdates(authorUpdatesData);
                setRefereeUpdates(refereeUpdatesData);
                setSettings(settingsData);
                setJournalEditorLinks(journalEditorLinksData);
                setJournalEntryAuthorLinks(journalEntryAuthorLinksData);
                setJournalEntryRefereeLinks(journalEntryRefereeLinksData);

            } catch (err: any) {
                console.error('Failed to fetch data:', err);
                setError(err.response?.data?.detail || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, user, navigate, 
        usersPagination.page,
        journalsPagination.page,
        journalEntriesPagination.page,
        authorUpdatesPagination.page,
        refereeUpdatesPagination.page,
        editorLinksPagination.page, 
        authorLinksPagination.page, 
        refereeLinksPagination.page]);

    // Fetch and update total counts only once on component mount
    useEffect(() => {
        if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'owner')) {
            return;
        }

        const fetchTotalCounts = async () => {
            try {
                // Fetch total counts for all sections at once
                const [
                    usersTotal,
                    journalsTotal,
                    journalEntriesTotal,
                    authorUpdatesTotal,
                    refereeUpdatesTotal,
                    editorLinksTotal, 
                    authorLinksTotal, 
                    refereeLinksTotal
                ] = await Promise.all([
                    apiService.getAllUsers(0, 1000),
                    apiService.getAllJournals(0, 1000),
                    apiService.getAllJournalEntries(0, 1000),
                    apiService.getAllAuthorUpdates(0, 1000),
                    apiService.getAllRefereeUpdates(0, 1000),
                    apiService.getAllJournalEditorLinks(0, 1000),
                    apiService.getAllJournalEntryAuthorLinks(0, 1000),
                    apiService.getAllJournalEntryRefereeLinks(0, 1000)
                ]);
                
                setUsersPagination(prev => ({ ...prev, total: usersTotal.length }));
                setJournalsPagination(prev => ({ ...prev, total: journalsTotal.length }));
                setJournalEntriesPagination(prev => ({ ...prev, total: journalEntriesTotal.length }));
                setAuthorUpdatesPagination(prev => ({ ...prev, total: authorUpdatesTotal.length }));
                setRefereeUpdatesPagination(prev => ({ ...prev, total: refereeUpdatesTotal.length }));
                setEditorLinksPagination(prev => ({ ...prev, total: editorLinksTotal.length }));
                setAuthorLinksPagination(prev => ({ ...prev, total: authorLinksTotal.length }));
                setRefereeLinksPagination(prev => ({ ...prev, total: refereeLinksTotal.length }));
            } catch (err: any) {
                console.error('Failed to fetch total counts:', err);
            }
        };

        fetchTotalCounts();
    }, [isAuthenticated, user]);

    const renderCell = (value: any) => {
        if (value === null || typeof value === 'undefined') return '-';
        if (typeof value === 'boolean') return value ? '✓' : '✗';
        if (Array.isArray(value)) return value.join(', ') || '-';
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (e) {
                return 'Error parsing object';
            }
        }
        return String(value);
    };

    // Accordion Section Component
    const AccordionSection = ({ 
        title, 
        sectionKey, 
        count,
        children 
    }: { 
        title: string;
        sectionKey: string;
        count?: number;
        children: React.ReactNode;
    }) => {
        const isOpen = openSections[sectionKey];
        
        return (
            <div className="accordion-section card">
                <div 
                    className="accordion-header" 
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h2>
                        {title} {count !== undefined && `(${count})`}
                        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>
                            {isOpen ? '▼' : '►'}
                        </span>
                    </h2>
                </div>
                {isOpen && (
                    <div className="accordion-content">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    // Pagination handlers
    const handlePageChange = (
        paginationSetter: React.Dispatch<React.SetStateAction<PaginationState>>,
        newPage: number,
        dataType: SectionType
    ) => {
        // Clear current data while loading new page
        if (dataType === 'users') {
            setUsers([]);
            setUsersLoading(true);
        } else if (dataType === 'journals') {
            setJournals([]);
            setJournalsLoading(true);
        } else if (dataType === 'journalEntries') {
            setJournalEntries([]);
            setJournalEntriesLoading(true);
        } else if (dataType === 'authorUpdates') {
            setAuthorUpdates([]);
            setAuthorUpdatesLoading(true);
        } else if (dataType === 'refereeUpdates') {
            setRefereeUpdates([]);
            setRefereeUpdatesLoading(true);
        } else if (dataType === 'editorLinks') {
            setJournalEditorLinks([]);
            setEditorLinksLoading(true);
        } else if (dataType === 'authorLinks') {
            setJournalEntryAuthorLinks([]);
            setAuthorLinksLoading(true);
        } else if (dataType === 'refereeLinks') {
            setJournalEntryRefereeLinks([]);
            setRefereeLinksLoading(true);
        }
        
        // Update pagination state which will trigger data fetch via useEffect
        paginationSetter(prev => ({ ...prev, page: newPage }));
    };

    // Pagination UI component
    const Pagination = ({ 
        pagination, 
        onPageChange 
    }: { 
        pagination: PaginationState; 
        onPageChange: (page: number) => void;
    }) => {
        const totalPages = Math.ceil(pagination.total / pagination.pageSize);
        const currentPage = pagination.page;
        
        // Generate page numbers to display
        const getPageNumbers = () => {
            const pages = [];
            const maxPagesToShow = 5; // Show up to 5 page buttons at a time
            
            // Always include first page, last page, current page, and pages around current
            let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
            
            // Adjust if we're at the end
            if (endPage - startPage < maxPagesToShow - 1) {
                startPage = Math.max(0, endPage - maxPagesToShow + 1);
            }
            
            // First page
            if (startPage > 0) {
                pages.push(
                    <button 
                        key="first" 
                        onClick={() => onPageChange(0)}
                        className="pagination-page-button"
                    >
                        1
                    </button>
                );
                if (startPage > 1) {
                    pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
                }
            }
            
            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
                pages.push(
                    <button 
                        key={i} 
                        onClick={() => onPageChange(i)}
                        className={`pagination-page-button ${i === currentPage ? 'active' : ''}`}
                        disabled={i === currentPage}
                    >
                        {i + 1}
                    </button>
                );
            }
            
            // Last page
            if (endPage < totalPages - 1) {
                if (endPage < totalPages - 2) {
                    pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
                }
                pages.push(
                    <button 
                        key="last" 
                        onClick={() => onPageChange(totalPages - 1)}
                        className="pagination-page-button"
                    >
                        {totalPages}
                    </button>
                );
            }
            
            return pages;
        };
        
        if (totalPages <= 1) return null; // Don't show pagination if only one page
        
        return (
            <div className="pagination-container">
                <div className="pagination-controls">
                    <button 
                        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="pagination-button"
                    >
                        {t('previous') || "Previous"}
                    </button>
                    
                    <div className="pagination-pages">
                        {getPageNumbers()}
                    </div>
                    
                    <button 
                        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="pagination-button"
                    >
                        {t('next') || "Next"}
                    </button>
                </div>
                
            </div>
        );
    };

    // Add handleSettingsUpdate function
    const handleSettingsUpdate = async (newAbout: string) => {
        if (!settings) return;
        
        const updatedSettings = await apiService.updateSettings({
            about: newAbout
        });
        setSettings(updatedSettings);
    };

    if (loading) {
        return <div className="loading-container">{t('loading')}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="container admin-page">
            <h1 className="page-title">{t('adminDashboard')}</h1>

            {/* Users Section */} 
            {(users.length > 0 || usersLoading) && (
                <AccordionSection title={t('userManagement')} sectionKey="users" count={usersPagination.total}>
                    <div className="admin-actions">
                        <Link to="/admin/users/create" className="btn btn-primary">
                            {t('createUser')}
                        </Link>
                    </div>
                    <div className="table-container">
                        {usersLoading ? (
                            <div className="section-loading">{t('loading') || "Loading..."}</div>
                        ) : (
                            <>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>{t('email')}</th>
                                            <th>{t('name')}</th>
                                            <th>{t('title')}</th>
                                            <th>{t('bio')}</th>
                                            <th>{t('telephone')}</th>
                                            <th>{t('scienceBranch')}</th>
                                            <th>{t('location')}</th>
                                            <th>{t('yoksisId')}</th>
                                            <th>{t('orcidId')}</th>
                                            <th>{t('role')}</th>
                                            <th>{t('isAuth')}</th>
                                            <th>{t('markedForDeletion') || 'Marked for Deletion'}</th>
                                            <th>{t('tutorialDone') || 'Tutorial Done'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users
                                            .sort((a, b) => a.email.toLowerCase().localeCompare(b.email.toLowerCase()))
                                            .map((item) => (
                                            <tr 
                                                key={item.id} 
                                                onClick={() => navigate(`/admin/users/profile/${item.id}`)}
                                                className="clickable-row"
                                                style={{ 
                                                    cursor: 'pointer',
                                                    outline: item.marked_for_deletion ? '2px solid #ff4444' : 'none'
                                                }}
                                            >
                                                <td>{renderCell(item.id)}</td>
                                                <td>{renderCell(item.email)}</td>
                                                <td>{renderCell(item.name)}</td>
                                                <td>{renderCell(item.title)}</td>
                                                <td>{renderCell(item.bio)}</td>
                                                <td>{renderCell(item.telephone)}</td>
                                                <td>{renderCell(item.science_branch)}</td>
                                                <td>{renderCell(item.location)}</td>
                                                <td>{renderCell(item.yoksis_id)}</td>
                                                <td>{renderCell(item.orcid_id)}</td>
                                                <td><span className={`badge badge-${item.role}`}>{renderCell(item.role)}</span></td>
                                                <td>{renderCell(item.is_auth)}</td>
                                                <td>{renderCell(item.marked_for_deletion)}</td>
                                                <td>{renderCell(item.tutorial_done)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination 
                                    pagination={usersPagination}
                                    onPageChange={(page) => handlePageChange(setUsersPagination, page, 'users')}
                                />
                            </>
                        )}
                    </div>
                </AccordionSection>
            )}

            {/* Journals Section */} 
            {(journals.length > 0 || journalsLoading) && (
                <AccordionSection title={t('journals')} sectionKey="journals" count={journalsPagination.total}>
                    <div className="admin-actions">
                        <Link to="/journals/new" className="btn btn-primary">
                            {t('createJournal')}
                        </Link>
                    </div>
                    <div className="table-container">
                        {journalsLoading ? (
                            <div className="section-loading">{t('loading') || "Loading..."}</div>
                        ) : (
                            <>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>{t('title')}</th>
                                            <th>{t('date')}</th>
                                            <th>{t('issue')}</th>
                                            <th>{t('isPublished')}</th>
                                            <th>{t('publicationDate')}</th>
                                            <th>{t('publicationPlace')}</th>
                                            <th>{t('coverPhoto')}</th>
                                            <th>{t('metaFiles')}</th>
                                            <th>{t('editorNotes')}</th>
                                            <th>{t('fullPdf')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {journals.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).map((item) => {
                                            return (
                                                <tr 
                                                    key={item.id}
                                                    onClick={() => navigate(`/journals/${item.id}`)}
                                                    className="clickable-row"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>{renderCell(item.id)}</td>
                                                    <td>{renderCell(item.title)}</td>
                                                    <td>{renderCell(item.created_date ? new Date(item.created_date).toLocaleDateString() : '-')}</td>
                                                    <td>{renderCell(item.issue)}</td>
                                                    <td>{renderCell(item.is_published)}</td>
                                                    <td>{item.publication_date ? renderCell(new Date(item.publication_date).toLocaleDateString()) : '-'}</td>
                                                    <td>{renderCell(item.publication_place)}</td>
                                                    <td>
                                                        {item.cover_photo ? (
                                                            <a 
                                                                href={item.cover_photo} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {t('viewFile')}
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td>
                                                        {item.meta_files ? (
                                                            <a 
                                                                href={item.meta_files} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {t('viewFile')}
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td>
                                                        {item.editor_notes ? (
                                                            <a 
                                                                href={item.editor_notes} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {t('viewFile')}
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td>
                                                        {item.full_pdf ? (
                                                            <a 
                                                                href={item.full_pdf} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {t('viewFile')}
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <Pagination 
                                    pagination={journalsPagination}
                                    onPageChange={(page) => handlePageChange(setJournalsPagination, page, 'journals')}
                                />
                            </>
                        )}
                    </div>
                </AccordionSection>
            )}

            {/* Journal Entries Section */} 
            {(journalEntries.length > 0 || journalEntriesLoading) && (
                <AccordionSection title={t('journalEntries')} sectionKey="journalEntries" count={journalEntriesPagination.total}>
                    <div className="table-container">
                        {journalEntriesLoading ? (
                            <div className="section-loading">{t('loading') || "Loading..."}</div>
                        ) : (
                            <>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>{t('title')}</th>
                                            <th>{t('date')}</th>
                                            <th>{t('createdAt')}</th>
                                            <th>{t('abstractTr')}</th>
                                            <th>{t('abstractEn')}</th>
                                            <th>{t('keywords')}</th>
                                            <th>{t('pageNumber')}</th>
                                            <th>{t('articleType')}</th>
                                            <th>{t('language')}</th>
                                            <th>{t('doi')}</th>
                                            <th>{t('filePath')}</th>
                                            <th>{t('downloadCount')}</th>
                                            <th>{t('readCount')}</th>
                                            <th>{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {journalEntries.length > 0 ? (
                                            journalEntries.map((item) => {
                                                return (
                                                    <tr 
                                                        key={item.id}
                                                        onClick={() => navigate(`/entries/${item.id}`)}
                                                        className="clickable-row"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td>{renderCell(item.id)}</td>
                                                        <td>{renderCell(item.title)}</td>
                                                        <td>{renderCell(item.publication_date ? new Date(item.publication_date).toLocaleDateString() : '-')}</td>
                                                        <td>{renderCell(new Date(item.created_date).toLocaleDateString())}</td>
                                                        <td>{item.abstract_tr ? `${renderCell(item.abstract_tr.substring(0,50))}...` : '-'}</td>
                                                        <td>{item.abstract_en ? `${renderCell(item.abstract_en.substring(0,50))}...` : '-'}</td>
                                                        <td>{renderCell(item.keywords)}</td>
                                                        <td>{renderCell(item.page_number)}</td>
                                                        <td>{renderCell(item.article_type)}</td>
                                                        <td>{renderCell(item.language)}</td>
                                                        <td>{renderCell(item.doi)}</td>
                                                        <td>
                                                            {item.file_path ? (
                                                                <a 
                                                                    href={item.file_path} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {t('viewFile')}
                                                                </a>
                                                            ) : '-'}
                                                        </td>
                                                        <td>{renderCell(item.download_count)}</td>
                                                        <td>{renderCell(item.read_count)}</td>
                                                        <td>{item.status ? <span className={`badge badge-${item.status.toLowerCase()}`}>{renderCell(item.status)}</span> : '-'}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={16} style={{ textAlign: 'center' }}>No journal entries found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <Pagination 
                                    pagination={journalEntriesPagination}
                                    onPageChange={(page) => handlePageChange(setJournalEntriesPagination, page, 'journalEntries')}
                                />
                            </>
                        )}
                    </div>
                </AccordionSection>
            )}
            
            {/* More Options Section */}
            <AccordionSection title={t('moreOptions') || "More Options"} sectionKey="moreOptions">
                {/* Settings Section */} 
                {settings && (
                    <AccordionSection title={t('applicationSettings')} sectionKey="settings">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>{t('activeJournalId')}</th>
                                        <th>{t('about')}</th>
                                        <th>{t('actions') || 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <SettingsEditor 
                                            settings={settings} 
                                            onSave={handleSettingsUpdate}
                                            renderCell={renderCell}
                                        />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </AccordionSection>
                )}

                {/* Author Updates Section - Only rendered if data is available */} 
                {(authorUpdates.length > 0 || authorUpdatesLoading) && (
                    <AccordionSection title={t('authorUpdates')} sectionKey="authorUpdates" count={authorUpdatesPagination.total}>
                        <div className="table-container">
                            {authorUpdatesLoading ? (
                                <div className="section-loading">{t('loading') || "Loading..."}</div>
                            ) : (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>{t('title')}</th>
                                                <th>{t('abstractEn')}</th>
                                                <th>{t('abstractTr')}</th>
                                                <th>{t('keywords')}</th>
                                                <th>{t('filePath')}</th>
                                                <th>{t('notes')}</th>
                                                <th>{t('createdDate')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {authorUpdates.map((item) => {
                                                return (
                                                    <tr key={item.id}>
                                                        <td>{renderCell(item.id)}</td>
                                                        <td>{renderCell(item.title)}</td>
                                                        <td>{item.abstract_en ? `${renderCell(item.abstract_en.substring(0,50))}...` : '-'}</td>
                                                        <td>{item.abstract_tr ? `${renderCell(item.abstract_tr.substring(0,50))}...` : '-'}</td>
                                                        <td>{renderCell(item.keywords)}</td>
                                                        <td>
                                                            {item.file_path ? (
                                                                <a href={item.file_path} target="_blank" rel="noopener noreferrer">
                                                                    {t('viewFile')}
                                                                </a>
                                                            ) : '-'}
                                                        </td>
                                                        <td>{item.notes ? `${renderCell(item.notes.substring(0,50))}...` : '-'}</td>
                                                        <td>{renderCell(new Date(item.created_date).toLocaleDateString())}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <Pagination 
                                        pagination={authorUpdatesPagination}
                                        onPageChange={(page) => handlePageChange(setAuthorUpdatesPagination, page, 'authorUpdates')}
                                    />
                                </>
                            )}
                        </div>
                    </AccordionSection>
                )}

                {/* Referee Updates Section - Only rendered if data is available */} 
                {(refereeUpdates.length > 0 || refereeUpdatesLoading) && (
                    <AccordionSection title={t('refereeUpdates')} sectionKey="refereeUpdates" count={refereeUpdatesPagination.total}>
                        <div className="table-container">
                            {refereeUpdatesLoading ? (
                                <div className="section-loading">{t('loading') || "Loading..."}</div>
                            ) : (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>{t('filePath')}</th>
                                                <th>{t('notes')}</th>
                                                <th>{t('createdDate')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {refereeUpdates.map((item) => {
                                                return (
                                                    <tr key={item.id}>
                                                        <td>{renderCell(item.id)}</td>
                                                        <td>
                                                            {item.file_path ? (
                                                                <a href={item.file_path} target="_blank" rel="noopener noreferrer">
                                                                    {t('viewFile')}
                                                                </a>
                                                            ) : '-'}
                                                        </td>
                                                        <td>{item.notes ? `${renderCell(item.notes.substring(0,50))}...` : '-'}</td>
                                                        <td>{renderCell(new Date(item.created_date).toLocaleDateString())}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <Pagination 
                                        pagination={refereeUpdatesPagination}
                                        onPageChange={(page) => handlePageChange(setRefereeUpdatesPagination, page, 'refereeUpdates')}
                                    />
                                </>
                            )}
                        </div>
                    </AccordionSection>
                )}

                {/* Journal Editor Links Section */}
                {(journalEditorLinks.length > 0 || editorLinksLoading) && (
                    <AccordionSection title={t('journalEditorLinks') || "Journal Editor Links"} sectionKey="journalEditorLinks" count={editorLinksPagination.total}>
                        <div className="table-container">
                            {editorLinksLoading ? (
                                <div className="section-loading">{t('loading') || "Loading..."}</div>
                            ) : (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('journalId') || "Journal ID"}</th>
                                                <th>{t('userId') || "User ID"}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {journalEditorLinks.map((item, index) => {
                                                return (
                                                    <tr key={`journal-editor-${item.journal_id}-${item.user_id}-${index}`}>
                                                        <td>{renderCell(item.journal_id)}</td>
                                                        <td>{renderCell(item.user_id)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <Pagination 
                                        pagination={editorLinksPagination}
                                        onPageChange={(page) => handlePageChange(setEditorLinksPagination, page, 'editorLinks')}
                                    />
                                </>
                            )}
                        </div>
                    </AccordionSection>
                )}

                {/* Journal Entry Author Links Section */}
                {(journalEntryAuthorLinks.length > 0 || authorLinksLoading) && (
                    <AccordionSection title={t('journalEntryAuthorLinks') || "Journal Entry Author Links"} sectionKey="journalEntryAuthorLinks" count={authorLinksPagination.total}>
                        <div className="table-container">
                            {authorLinksLoading ? (
                                <div className="section-loading">{t('loading') || "Loading..."}</div>
                            ) : (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('journalEntryId') || "Journal Entry ID"}</th>
                                                <th>{t('userId') || "User ID"}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {journalEntryAuthorLinks.map((item, index) => {
                                                return (
                                                    <tr key={`journal-entry-author-${item.journal_entry_id}-${item.user_id}-${index}`}>
                                                        <td>{renderCell(item.journal_entry_id)}</td>
                                                        <td>{renderCell(item.user_id)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <Pagination 
                                        pagination={authorLinksPagination}
                                        onPageChange={(page) => handlePageChange(setAuthorLinksPagination, page, 'authorLinks')}
                                    />
                                </>
                            )}
                        </div>
                    </AccordionSection>
                )}

                {/* Journal Entry Referee Links Section */}
                {(journalEntryRefereeLinks.length > 0 || refereeLinksLoading) && (
                    <AccordionSection title={t('journalEntryRefereeLinks') || "Journal Entry Referee Links"} sectionKey="journalEntryRefereeLinks" count={refereeLinksPagination.total}>
                        <div className="table-container">
                            {refereeLinksLoading ? (
                                <div className="section-loading">{t('loading') || "Loading..."}</div>
                            ) : (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('journalEntryId') || "Journal Entry ID"}</th>
                                                <th>{t('userId') || "User ID"}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {journalEntryRefereeLinks.map((item, index) => {
                                                return (
                                                    <tr key={`journal-entry-referee-${item.journal_entry_id}-${item.user_id}-${index}`}>
                                                        <td>{renderCell(item.journal_entry_id)}</td>
                                                        <td>{renderCell(item.user_id)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <Pagination 
                                        pagination={refereeLinksPagination}
                                        onPageChange={(page) => handlePageChange(setRefereeLinksPagination, page, 'refereeLinks')}
                                    />
                                </>
                            )}
                        </div>
                    </AccordionSection>
                )}
            </AccordionSection>

        </div>
    );
};

export default AdminPage;
