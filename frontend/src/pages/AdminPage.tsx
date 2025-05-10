import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role: string;
    is_auth?: boolean;
}

interface Journal {
    id: number;
    title: string;
    date: string;
    issue: string;
    is_published: boolean;
    publication_date?: string;
}

interface JournalEntry {
    id: number;
    title: string;
    date: string;
    abstract: string;
    content: string;
    file_path?: string;
    status: string;
    created_at: string;
    updated_at: string;
    owner_id?: number;
    journal_id?: number;
}

interface JournalEntryProgress {
    id: number;
    title: string;
    date: string;
    abstract: string;
    content: string;
    file_path?: string;
    created_at: string;
    updated_at: string;
    owner_id?: number;
    owner_role: string;
    journal_entry_id: number;
}

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [journals, setJournals] = useState<Journal[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [journalProgress, setJournalProgress] = useState<JournalEntryProgress[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        // Check if user is authenticated and has admin role
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }

        // Fetch all data
        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersData, journalsData, entriesData, progressData] = await Promise.all([
                    apiService.getAllUsers(),
                    apiService.getAllJournals(),
                    apiService.getAllJournalEntries(),
                    apiService.getAllJournalEntryProgress()
                ]);
                
                setUsers(usersData);
                setJournals(journalsData);
                setJournalEntries(entriesData);
                setJournalProgress(progressData);
            } catch (err: any) {
                console.error('Failed to fetch data:', err);
                setError(err.response?.data?.detail || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, user, navigate]);

    if (loading) {
        return <div className="loading-container">{t('loading')}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="container">
                <h1 className="page-title">{t('adminDashboard')}</h1>
            {/* Users Section */}
            <div className="card">
                <h2>{t('userManagement')}</h2>
                <p>{t('totalUsers')}: {users.length}</p>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('username')}</th>
                                <th>{t('name')}</th>
                                <th>{t('email')}</th>
                                <th>{t('role')}</th>
                                <th>{t('title')}</th>
                                <th>{t('bio')}</th>
                                <th>{t('isAuth')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge badge-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.title || '-'}</td>
                                    <td>{user.bio || '-'}</td>
                                    <td>{user.is_auth ? '✓' : '✗'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Journals Section */}
            <div className="card">
                <h2>{t('journals')}</h2>
                <p>{t('totalJournals')}: {journals.length}</p>

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
                            </tr>
                        </thead>
                        <tbody>
                            {journals.map((journal) => (
                                <tr key={journal.id}>
                                    <td>{journal.id}</td>
                                    <td>{journal.title}</td>
                                    <td>{new Date(journal.date).toLocaleDateString()}</td>
                                    <td>{journal.issue}</td>
                                    <td>{journal.is_published ? '✓' : '✗'}</td>
                                    <td>{journal.publication_date ? new Date(journal.publication_date).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Journal Entries Section */}
            <div className="card">
                <h2>{t('journalEntries')}</h2>
                <p>{t('totalEntries')}: {journalEntries.length}</p>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('title')}</th>
                                <th>{t('date')}</th>
                                <th>{t('abstract')}</th>
                                <th>{t('content')}</th>
                                <th>{t('filePath')}</th>
                                <th>{t('status')}</th>
                                <th>{t('createdAt')}</th>
                                <th>{t('updatedAt')}</th>
                                <th>{t('ownerID')}</th>
                                <th>{t('journalID')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td>{entry.id}</td>
                                    <td>{entry.title}</td>
                                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                                    <td>{entry.abstract.substring(0, 50)}...</td>
                                    <td>{entry.content.substring(0, 50)}...</td>
                                    <td>{entry.file_path || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${entry.status}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                                    <td>{new Date(entry.updated_at).toLocaleDateString()}</td>
                                    <td>{entry.owner_id || '-'}</td>
                                    <td>{entry.journal_id || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Journal Entry Progress Section */}
            <div className="card">
                <h2>{t('journalEntryProgress')}</h2>
                <p>{t('totalProgressRecords')}: {journalProgress.length}</p>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('title')}</th>
                                <th>{t('date')}</th>
                                <th>{t('abstract')}</th>
                                <th>{t('content')}</th>
                                <th>{t('filePath')}</th>
                                <th>{t('createdAt')}</th>
                                <th>{t('updatedAt')}</th>
                                <th>{t('ownerID')}</th>
                                <th>{t('ownerRole')}</th>
                                <th>{t('journalEntryID')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalProgress.map((progress) => (
                                <tr key={progress.id}>
                                    <td>{progress.id}</td>
                                    <td>{progress.title}</td>
                                    <td>{new Date(progress.date).toLocaleDateString()}</td>
                                    <td>{progress.abstract.substring(0, 50)}...</td>
                                    <td>{progress.content.substring(0, 50)}...</td>
                                    <td>{progress.file_path || '-'}</td>
                                    <td>{new Date(progress.created_at).toLocaleDateString()}</td>
                                    <td>{new Date(progress.updated_at).toLocaleDateString()}</td>
                                    <td>{progress.owner_id || '-'}</td>
                                    <td>{progress.owner_role}</td>
                                    <td>{progress.journal_entry_id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage; 