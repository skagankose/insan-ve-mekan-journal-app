import React, { useEffect, useState } from 'react';
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
    JournalEntryRefereeLinkRead
} from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminPage.css';

// Interfaces will now directly use the more detailed types from apiService

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

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Accordion state
    const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({
        users: false,
        journals: false,
        journalEntries: false,
        authorUpdates: false,
        refereeUpdates: false,
        settings: false,
        journalEditorLinks: false,
        journalEntryAuthorLinks: false,
        journalEntryRefereeLinks: false,
        moreOptions: false
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

        if (user?.role !== 'admin') {
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
                
                try {
                    usersData = await apiService.getAllUsers();
                    // console.log('Users data:', usersData);
                } catch (err: any) {
                    console.error('Failed to fetch users:', err);
                }
                
                try {
                    journalsData = await apiService.getAllJournals();
                    // console.log('Journals data:', journalsData);
                } catch (err: any) {
                    console.error('Failed to fetch journals:', err);
                }
                
                try {
                    entriesData = await apiService.getAllJournalEntries();
                    // console.log('Journal entries data:', entriesData);
                } catch (err: any) {
                    console.error('Failed to fetch journal entries:', err);
                }
                
                try {
                    authorUpdatesData = await apiService.getAllAuthorUpdates();
                    // console.log('Author updates data:', authorUpdatesData);
                } catch (err: any) {
                    console.error('Failed to fetch author updates:', err);
                }
                
                try {
                    refereeUpdatesData = await apiService.getAllRefereeUpdates();
                    // console.log('Referee updates data:', refereeUpdatesData);
                } catch (err: any) {
                    console.error('Failed to fetch referee updates:', err);
                }
                
                try {
                    settingsData = await apiService.getSettings();
                    // console.log('Settings data:', settingsData);
                } catch (err: any) {
                    console.error('Failed to fetch settings:', err);
                    // Create a default settings object
                    settingsData = { id: 1, active_journal_id: null };
                }
                
                try {
                    journalEditorLinksData = await apiService.getAllJournalEditorLinks();
                    // console.log('Journal editor links data:', journalEditorLinksData);
                } catch (err: any) {
                    console.error('Failed to fetch journal editor links:', err);
                }
                
                try {
                    journalEntryAuthorLinksData = await apiService.getAllJournalEntryAuthorLinks();
                    // console.log('Journal entry author links data:', journalEntryAuthorLinksData);
                } catch (err: any) {
                    console.error('Failed to fetch journal entry author links:', err);
                }
                
                try {
                    journalEntryRefereeLinksData = await apiService.getAllJournalEntryRefereeLinks();
                    // console.log('Journal entry referee links data:', journalEntryRefereeLinksData);
                } catch (err: any) {
                    console.error('Failed to fetch journal entry referee links:', err);
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
    }, [isAuthenticated, user, navigate]);

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
            {users.length > 0 && (
                <AccordionSection title={t('userManagement')} sectionKey="users" count={users.length}>
                    <div className="admin-actions">
                        <Link to="/admin/users/create" className="btn btn-primary">
                            {t('createUser')}
                        </Link>
                    </div>
                    <div className="table-container">
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
                                    <th>{t('actions')}</th>
                                    {/*<th>{t('confirmationToken')}</th>*/}
                                    {/*<th>{t('confirmationTokenCreatedAt')}</th>*/}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((item) => (
                                    <tr key={item.id}>
                                        <td>{renderCell(item.id)}</td>
                                        <td>
                                            <Link to={`/admin/users/profile/${item.id}`} className="user-email-link">
                                                {renderCell(item.email)}
                                            </Link>
                                        </td>
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
                                        <td>
                                            <Link to={`/admin/users/edit/${item.id}`} className="edit-button">
                                                {t('edit')}
                                            </Link>
                                        </td>
                                        {/*<td>{renderCell(item.confirmation_token)}</td>*/}
                                        {/*<td>{renderCell(item.confirmation_token_created_at)}</td>*/}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AccordionSection>
            )}

            {/* Journals Section */} 
            <AccordionSection title={t('journals')} sectionKey="journals" count={journals.length}>
                <div className="table-container">
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
                                <th>{t('editorInChiefId')}</th>
                                <th>{t('editors')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journals.length > 0 ? (
                                journals.map((item) => {
                                    const editorInChief = users.find(user => user.id === item.editor_in_chief_id);
                                    const editorInChiefName = editorInChief ? editorInChief.name : item.editor_in_chief_id;

                                    const currentJournalEditors = journalEditorLinks
                                        .filter(link => link.journal_id === item.id)
                                        .map(link => {
                                            const editorUser = users.find(user => user.id === link.user_id);
                                            return editorUser ? editorUser.name : `User ID: ${link.user_id}`;
                                        })
                                        .join(', ');

                                    return (
                                        <tr key={item.id}>
                                            <td>{renderCell(item.id)}</td>
                                            <td>{renderCell(item.title)}</td>
                                            <td>{renderCell(item.date ? new Date(item.date).toLocaleDateString() : '-')}</td>
                                            <td>{renderCell(item.issue)}</td>
                                            <td>{renderCell(item.is_published)}</td>
                                            <td>{item.publication_date ? renderCell(new Date(item.publication_date).toLocaleDateString()) : '-'}</td>
                                            <td>{renderCell(item.publication_place)}</td>
                                            <td>
                                                {item.cover_photo ? (
                                                    <a href={item.cover_photo} target="_blank" rel="noopener noreferrer">
                                                        {t('viewFile')}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {item.meta_files ? (
                                                    <a href={item.meta_files} target="_blank" rel="noopener noreferrer">
                                                        {t('viewFile')}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {item.editor_notes ? (
                                                    <a href={item.editor_notes} target="_blank" rel="noopener noreferrer">
                                                        {t('viewFile')}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {item.full_pdf ? (
                                                    <a href={item.full_pdf} target="_blank" rel="noopener noreferrer">
                                                        {t('viewFile')}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>{renderCell(editorInChiefName)}</td>
                                            <td>{renderCell(currentJournalEditors || '-')}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={13} style={{ textAlign: 'center' }}>No journals found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AccordionSection>

            {/* Journal Entries Section */} 
            <AccordionSection title={t('journalEntries')} sectionKey="journalEntries" count={journalEntries.length}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('title')}</th>
                                <th>{t('date')}</th>
                                <th>{t('createdAt')}</th>
                                <th>{t('updatedAt')}</th>
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
                                <th>{t('journalName')}</th>
                                <th>{t('authors')}</th>
                                <th>{t('referees')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntries.length > 0 ? (
                                journalEntries.map((item) => {
                                    const journal = journals.find(j => j.id === item.journal_id);
                                    const journalName = journal ? journal.title : item.journal_id;

                                    const entryAuthors = journalEntryAuthorLinks
                                        .filter(link => link.journal_entry_id === item.id)
                                        .map(link => {
                                            const authorUser = users.find(user => user.id === link.user_id);
                                            return authorUser ? authorUser.name : `User ID: ${link.user_id}`;
                                        })
                                        .join(', ');

                                    const entryReferees = journalEntryRefereeLinks
                                        .filter(link => link.journal_entry_id === item.id)
                                        .map(link => {
                                            const refereeUser = users.find(user => user.id === link.user_id);
                                            return refereeUser ? refereeUser.name : `User ID: ${link.user_id}`;
                                        })
                                        .join(', ');

                                    return (
                                        <tr key={item.id}>
                                            <td>{renderCell(item.id)}</td>
                                            <td>{renderCell(item.title)}</td>
                                            <td>{renderCell(item.date ? new Date(item.date).toLocaleDateString() : '-')}</td>
                                            <td>{renderCell(new Date(item.created_at).toLocaleDateString())}</td>
                                            <td>{renderCell(new Date(item.updated_at).toLocaleDateString())}</td>
                                            <td>{item.abstract_tr ? `${renderCell(item.abstract_tr.substring(0,50))}...` : '-'}</td>
                                            <td>{item.abstract_en ? `${renderCell(item.abstract_en.substring(0,50))}...` : '-'}</td>
                                            <td>{renderCell(item.keywords)}</td>
                                            <td>{renderCell(item.page_number)}</td>
                                            <td>{renderCell(item.article_type)}</td>
                                            <td>{renderCell(item.language)}</td>
                                            <td>{renderCell(item.doi)}</td>
                                            <td>
                                                {item.file_path ? (
                                                    <a href={item.file_path} target="_blank" rel="noopener noreferrer">
                                                        {t('viewFile')}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>{renderCell(item.download_count)}</td>
                                            <td>{renderCell(item.read_count)}</td>
                                            <td>{item.status ? <span className={`badge badge-${item.status.toLowerCase()}`}>{renderCell(item.status)}</span> : '-'}</td>
                                            <td>{renderCell(journalName)}</td>
                                            <td>{renderCell(entryAuthors || '-')}</td>
                                            <td>{renderCell(entryReferees || '-')}</td>
                                            <td>
                                                <Link to={`/entries/${item.id}/updates`} className="btn btn-small btn-outline">
                                                    {t('viewUpdates') || 'View Updates'}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={20} style={{ textAlign: 'center' }}>No journal entries found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AccordionSection>
            
            {/* Author Updates Section - Only rendered if data is available */} 
            {authorUpdates.length > 0 && (
                <AccordionSection title={t('authorUpdates')} sectionKey="authorUpdates" count={authorUpdates.length}>
                    <div className="table-container">
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
                                    <th>{t('entryTitle')}</th>
                                    <th>{t('authorName')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {authorUpdates.map((item) => {
                                    const entry = journalEntries.find(entry => entry.id === item.entry_id);
                                    const entryTitle = entry ? entry.title : item.entry_id;

                                    const author = users.find(user => user.id === item.author_id);
                                    const authorName = author ? author.name : item.author_id;
                                    
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
                                            <td>{renderCell(entryTitle)}</td>
                                            <td>{renderCell(authorName)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </AccordionSection>
            )}

            {/* Referee Updates Section - Only rendered if data is available */} 
            {refereeUpdates.length > 0 && (
                <AccordionSection title={t('refereeUpdates')} sectionKey="refereeUpdates" count={refereeUpdates.length}>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{t('filePath')}</th>
                                    <th>{t('notes')}</th>
                                    <th>{t('createdDate')}</th>
                                    <th>{t('refereeName')}</th>
                                    <th>{t('entryTitle')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refereeUpdates.map((item) => {
                                    const referee = users.find(user => user.id === item.referee_id);
                                    const refereeName = referee ? referee.name : item.referee_id;

                                    const entry = journalEntries.find(entry => entry.id === item.entry_id);
                                    const entryTitle = entry ? entry.title : item.entry_id;
                                    
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
                                            <td>{renderCell(refereeName)}</td>
                                            <td>{renderCell(entryTitle)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{renderCell(settings.id)}</td>
                                        <td>{renderCell(settings.active_journal_id)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </AccordionSection>
                )}

                {/* Journal Editor Links Section */} 
                {journalEditorLinks.length > 0 && (
                    <AccordionSection title={t('journalEditorLinks')} sectionKey="journalEditorLinks" count={journalEditorLinks.length}>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('journalId')}</th>
                                        <th>{t('userId')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEditorLinks.map((item, index) => (
                                        <tr key={`${item.journal_id}-${item.user_id}-${index}`}>
                                            <td>{renderCell(item.journal_id)}</td>
                                            <td>{renderCell(item.user_id)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AccordionSection>
                )}

                {/* Journal Entry Author Links Section */} 
                {journalEntryAuthorLinks.length > 0 && (
                    <AccordionSection title={t('journalEntryAuthorLinks')} sectionKey="journalEntryAuthorLinks" count={journalEntryAuthorLinks.length}>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('journalEntryId')}</th>
                                        <th>{t('userId')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEntryAuthorLinks.map((item, index) => (
                                        <tr key={`${item.journal_entry_id}-${item.user_id}-${index}`}>
                                            <td>{renderCell(item.journal_entry_id)}</td>
                                            <td>{renderCell(item.user_id)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AccordionSection>
                )}

                {/* Journal Entry Referee Links Section */} 
                {journalEntryRefereeLinks.length > 0 && (
                    <AccordionSection title={t('journalEntryRefereeLinks')} sectionKey="journalEntryRefereeLinks" count={journalEntryRefereeLinks.length}>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('journalEntryId')}</th>
                                        <th>{t('userId')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEntryRefereeLinks.map((item, index) => (
                                        <tr key={`${item.journal_entry_id}-${item.user_id}-${index}`}>
                                            <td>{renderCell(item.journal_entry_id)}</td>
                                            <td>{renderCell(item.user_id)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AccordionSection>
                )}
            </AccordionSection>

        </div>
    );
};

export default AdminPage;
