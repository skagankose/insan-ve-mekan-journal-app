import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Import our API service
import { Link } from 'react-router-dom'; // Import Link (useNavigate is not used here)
import { useAuth } from '../contexts/AuthContext'; // To check auth state
import { useLanguage } from '../contexts/LanguageContext';

// Match the interface in apiService
interface JournalEntry {
    id: number;
    title: string;
    content: string;
    abstract: string;
    created_at: string;
    updated_at: string;
    owner_id: number;
}

const JournalListPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authLoading } = useAuth(); // Get auth state
    const { t } = useLanguage();

    useEffect(() => {
        // Only fetch if authenticated and auth check is complete
        if (!authLoading && isAuthenticated) {
            const fetchEntries = async () => {
                setLoading(true);
                setError(null);
                console.log("Fetching journal entries...");
                try {
                    const fetchedEntries = await apiService.getEntries();
                    setEntries(fetchedEntries);
                    console.log("Fetched entries:", fetchedEntries);
                } catch (err: any) {
                    console.error("Failed to fetch entries:", err);
                     // Handle specific errors like 401 Unauthorized
                    if (err.response?.status === 401) {
                         setError("Authentication error. Please log in again.");
                         // Optionally logout or redirect to login here
                     } else {
                         setError('Failed to load journal entries.');
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchEntries();
        } else if (!authLoading && !isAuthenticated) {
            // If auth is checked and user is not authenticated, stop loading
            setLoading(false);
            setEntries([]); // Clear entries if user logs out
        }

        // Dependency array includes auth state to refetch on login/logout
    }, [isAuthenticated, authLoading]); 

    const handleDelete = async (id: number) => {
        console.log("Deleting entry:", id);
        if (window.confirm('Are you sure you want to delete this entry?')) {
             try {
                await apiService.deleteEntry(id); // Use API service
                // Refresh list after delete
                setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
                // Optional: Show success message
            } catch (err: any) {
                console.error("Failed to delete entry:", err);
                alert('Failed to delete entry.'); // Keep simple alert for now
            }
        }
    };

    // Loading state
    if (authLoading || loading) {
        return <div className="loading">{t('loadingEntries')}</div>;
    }
    
    // Not authenticated state
    if (!isAuthenticated) {
        return (
            <div className="card">
                <p>{t('pleaseLogin')} <Link to="/login">{t('loginText')}</Link></p>
            </div>
        );
    }

    // Error state
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    // Main content when authenticated and loaded
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('myJournal')}</h1>
                <Link to="/entries/new" className="btn btn-primary">
                    {t('createEntry')}
                </Link>
            </div>

            {entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>{t('noEntries')}</h3>
                    <p>{t('createEntryPrompt')}</p>
                </div>
            ) : (
                <div>
                    {entries.map((entry) => (
                        <div key={entry.id} className="journal-entry">
                            <h3>{entry.title}</h3>
                            <div className="journal-entry-meta">
                                <span>Created: {new Date(entry.created_at).toLocaleString()}</span>
                                <span> | </span>
                                <span>Updated: {new Date(entry.updated_at).toLocaleString()}</span>
                            </div>
                            <div className="journal-entry-actions">
                                <Link to={`/entries/edit/${entry.id}`} className="btn btn-secondary">
                                    {t('edit')}
                                </Link>
                                <button 
                                    onClick={() => handleDelete(entry.id)}
                                    className="btn btn-danger">
                                    {t('delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JournalListPage; 