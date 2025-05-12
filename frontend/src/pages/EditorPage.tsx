import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import type {
    UserRead, // Keep for displaying names, potentially filter later
    Journal,
    JournalEntryRead,
    AuthorUpdateRead,
    RefereeUpdateRead,
    JournalEditorLinkRead,
    JournalEntryAuthorLinkRead,
    JournalEntryRefereeLinkRead
} from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminPage.css'; // Reuse AdminPage styles for now

// Interfaces remain the same for data display

const EditorPage: React.FC = () => {
    // State for data relevant to editors
    const [journals, setJournals] = useState<Journal[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntryRead[]>([]);
    const [authorUpdates, setAuthorUpdates] = useState<AuthorUpdateRead[]>([]);
    const [refereeUpdates, setRefereeUpdates] = useState<RefereeUpdateRead[]>([]);
    // Include users state to resolve names, maybe fetch less data later
    const [users, setUsers] = useState<UserRead[]>([]); 
    // Link tables might be useful for context, fetch them too
    const [journalEditorLinks, setJournalEditorLinks] = useState<JournalEditorLinkRead[]>([]);
    const [journalEntryAuthorLinks, setJournalEntryAuthorLinks] = useState<JournalEntryAuthorLinkRead[]>([]);
    const [journalEntryRefereeLinks, setJournalEntryRefereeLinks] = useState<JournalEntryRefereeLinkRead[]>([]);


    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Accordion state for relevant sections
    const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({
        journals: true, // Default open journals
        journalEntries: false,
        authorUpdates: false,
        refereeUpdates: false,
        // Remove sections not needed for editors
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

        // Ensure user is an editor or admin (admin might need access too)
        if (user?.role !== 'editor' && user?.role !== 'admin') { 
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null); 
                
                // Fetch data using new editor-specific API calls
                // Need users to resolve names in other tables
                const usersData = await apiService.getEditorUsers(); 
                const journalsData = await apiService.getEditorJournals(); 
                const entriesData = await apiService.getEditorJournalEntries();
                const authorUpdatesData = await apiService.getEditorAuthorUpdates();
                const refereeUpdatesData = await apiService.getEditorRefereeUpdates();
                // Fetch link tables for context using editor-specific endpoints
                const journalEditorLinksData = await apiService.getEditorJournalEditorLinks(); 
                const journalEntryAuthorLinksData = await apiService.getEditorJournalEntryAuthorLinks(); 
                const journalEntryRefereeLinksData = await apiService.getEditorJournalEntryRefereeLinks();
                
                setUsers(usersData);
                setJournals(journalsData);
                setJournalEntries(entriesData);
                setAuthorUpdates(authorUpdatesData);
                setRefereeUpdates(refereeUpdatesData);
                setJournalEditorLinks(journalEditorLinksData);
                setJournalEntryAuthorLinks(journalEntryAuthorLinksData);
                setJournalEntryRefereeLinks(journalEntryRefereeLinksData);

            } catch (err: any) {
                console.error('Failed to fetch editor data:', err);
                setError(err.response?.data?.detail || 'Failed to load editor data');
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
            // Avoid stringifying large objects if not necessary
            return '[Object]'; 
        }
        return String(value);
    };

    // Accordion Section Component (Reused from AdminPage)
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

    // Helper to get user name from ID
    const getUserName = (userId: number | string | null | undefined): string => {
        if (userId === null || userId === undefined) return '-';
        const foundUser = users.find(u => u.id === userId);
        return foundUser ? foundUser.name : `ID: ${userId}`;
    };

    return (
        <div className="container admin-page"> {/* Keep admin-page class for styling */}
            <h1 className="page-title">{t('editorDashboard') || 'Editor Dashboard'}</h1>

            {/* Journals Section */} 
            <AccordionSection title={t('journals') || 'Journals'} sectionKey="journals" count={journals.length}>
                {/* Add Journal button? Maybe later. */}
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
                                <th>{t('editorInChief')}</th> 
                                <th>{t('editors')}</th>
                                {/* Add Actions? Edit Journal? */}
                            </tr>
                        </thead>
                        <tbody>
                            {journals.length > 0 ? (
                                journals.map((item) => {
                                    const editorInChiefName = getUserName(item.editor_in_chief_id);

                                    const currentJournalEditors = journalEditorLinks
                                        .filter(link => link.journal_id === item.id)
                                        .map(link => getUserName(link.user_id))
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
                                            {/* Add action cell if needed */}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={13} style={{ textAlign: 'center' }}>{t('noJournalsFound') || 'No journals found'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AccordionSection>

            {/* Journal Entries Section */} 
            <AccordionSection title={t('journalEntries') || 'Journal Entries'} sectionKey="journalEntries" count={journalEntries.length}>
                 {/* Add Create Entry button? Maybe later. */}
               <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('title')}</th>
                                <th>{t('date')}</th>
                                {/*<th>{t('createdAt')}</th>
                                <th>{t('updatedAt')}</th>*/}
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
                                <th>{t('actions') || 'Actions'}</th>
                                {/* Add Actions? Edit Entry? Assign Referees? */}
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntries.length > 0 ? (
                                journalEntries.map((item) => {
                                    const journal = journals.find(j => j.id === item.journal_id);
                                    const journalName = journal ? journal.title : `ID: ${item.journal_id}`;

                                    const entryAuthors = journalEntryAuthorLinks
                                        .filter(link => link.journal_entry_id === item.id)
                                        .map(link => getUserName(link.user_id))
                                        .join(', ');

                                    const entryReferees = journalEntryRefereeLinks
                                        .filter(link => link.journal_entry_id === item.id)
                                        .map(link => getUserName(link.user_id))
                                        .join(', ');

                                    return (
                                        <tr key={item.id}>
                                            <td>{renderCell(item.id)}</td>
                                            <td>{renderCell(item.title)}</td>
                                            <td>{renderCell(item.date ? new Date(item.date).toLocaleDateString() : '-')}</td>
                                            {/*<td>{renderCell(new Date(item.created_at).toLocaleString())}</td>
                                            <td>{renderCell(new Date(item.updated_at).toLocaleString())}</td>*/}
                                            <td>{item.abstract_tr ? `${renderCell(item.abstract_tr.substring(0,30))}...` : '-'}</td>
                                            <td>{item.abstract_en ? `${renderCell(item.abstract_en.substring(0,30))}...` : '-'}</td>
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
                                            {/* Add action cell if needed */}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={18} style={{ textAlign: 'center' }}>{t('noJournalEntriesFound') || 'No journal entries found'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AccordionSection>
            
            {/* Author Updates Section */} 
            <AccordionSection title={t('authorUpdates') || 'Author Updates'} sectionKey="authorUpdates" count={authorUpdates.length}>
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
                                {/* Add Actions? View Update Details? */}
                            </tr>
                        </thead>
                        <tbody>
                             {authorUpdates.length > 0 ? (
                                authorUpdates.map((item) => {
                                    const entry = journalEntries.find(entry => entry.id === item.entry_id);
                                    const entryTitle = entry ? entry.title : `Entry ID: ${item.entry_id}`;
                                    const authorName = getUserName(item.author_id);
                                    
                                    return (
                                        <tr key={item.id}>
                                            <td>{renderCell(item.id)}</td>
                                            <td>{renderCell(item.title)}</td>
                                            <td>{item.abstract_en ? `${renderCell(item.abstract_en.substring(0,30))}...` : '-'}</td>
                                            <td>{item.abstract_tr ? `${renderCell(item.abstract_tr.substring(0,30))}...` : '-'}</td>
                                            <td>{renderCell(item.keywords)}</td>
                                            <td>
                                                {item.file_path ? (
                                                    <a href={item.file_path} target="_blank" rel="noopener noreferrer">
                                                        {t('viewFile')}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>{item.notes ? `${renderCell(item.notes.substring(0,30))}...` : '-'}</td>
                                            <td>{renderCell(new Date(item.created_date).toLocaleDateString())}</td>
                                            <td>{renderCell(entryTitle)}</td>
                                            <td>{renderCell(authorName)}</td>
                                            {/* Add action cell if needed */}
                                        </tr>
                                    );
                                })
                             ) : (
                                <tr>
                                     <td colSpan={10} style={{ textAlign: 'center' }}>{t('noAuthorUpdatesFound') || 'No author updates found'}</td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </AccordionSection>

            {/* Referee Updates Section */} 
            <AccordionSection title={t('refereeUpdates') || 'Referee Updates'} sectionKey="refereeUpdates" count={refereeUpdates.length}>
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
                                {/* Add Actions? View Update Details? */}
                            </tr>
                        </thead>
                        <tbody>
                            {refereeUpdates.length > 0 ? (
                                refereeUpdates.map((item) => {
                                    const refereeName = getUserName(item.referee_id);
                                    const entry = journalEntries.find(entry => entry.id === item.entry_id);
                                    const entryTitle = entry ? entry.title : `Entry ID: ${item.entry_id}`;
                                    
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
                                            <td>{item.notes ? `${renderCell(item.notes.substring(0,30))}...` : '-'}</td>
                                            <td>{renderCell(new Date(item.created_date).toLocaleDateString())}</td>
                                            <td>{renderCell(refereeName)}</td>
                                            <td>{renderCell(entryTitle)}</td>
                                            {/* Add action cell if needed */}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                     <td colSpan={6} style={{ textAlign: 'center' }}>{t('noRefereeUpdatesFound') || 'No referee updates found'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AccordionSection>

            {/* Removed Settings, User Management, Link Tables (unless needed later) */}

        </div>
    );
};

export default EditorPage; 