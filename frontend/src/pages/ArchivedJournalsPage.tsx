import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { Journal } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const ArchivedJournalsPage: React.FC = () => {
    const [archivedJournals, setArchivedJournals] = useState<Journal[]>([]);
    const [loadingJournals, setLoadingJournals] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPublishedJournals = async () => {
            setLoadingJournals(true);
            setError(null);
            try {
                const fetchedJournals = await apiService.getPublishedJournals();
                
                const sortedJournals = [...fetchedJournals].sort((a, b) => 
                    new Date(b.publication_date || b.date).getTime() - new Date(a.publication_date || a.date).getTime()
                );
                
                setArchivedJournals(sortedJournals);
            } catch (err: any) {
                console.error("Failed to fetch published journals:", err);
                setError(err.response?.data?.detail || t('failedToLoadPublishedJournals') || 'Failed to load published journals.');
            } finally {
                setLoadingJournals(false);
            }
        };

        fetchPublishedJournals();
    }, [t]);

    const handleJournalClick = (journalId: number) => {
        navigate(`/archive/journal/${journalId}`);
    };

    if (loadingJournals) {
        return <div className="loading">{t('loadingPublishedJournals') || 'Loading published journals...'}</div>;
    }
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('publishedJournals')}</h1>
            </div>

            {archivedJournals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🗄️</div>
                    <h3>{t('noPublishedJournals') || 'No published journals found.'}</h3>
                </div>
            ) : (
                <div className="journals-list">
                    {archivedJournals.map((journal) => (
                        <div 
                            key={journal.id} 
                            className="journal-card clickable"
                            onClick={() => handleJournalClick(journal.id)}
                        >
                            <div className="journal-header">
                                <div>
                                    <h3>{journal.title}</h3>
                                    <p>{t('issue')}: {journal.issue}</p>
                                    <p>{t('publicationDate')}: {journal.publication_date ? new Date(journal.publication_date).toLocaleDateString() : t('notAvailable') || 'N/A'}</p>
                                </div>
                                <div className="journal-arrow">→</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArchivedJournalsPage; 