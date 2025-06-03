import React, { useState, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActiveJournal } from '../contexts/ActiveJournalContext';
import { Journal, JournalEntryRead } from '../services/apiService';
import Footer from '../components/Footer';

interface JournalWithEntries extends Journal {
    entries: JournalEntryRead[];
    isExpanded: boolean;
    isLoading: boolean;
}

const styles = `
    .hover-effect:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
`;

const EditorJournalsPage: React.FC = () => {
    const [journalsWithEntries, setJournalsWithEntries] = useState<JournalWithEntries[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { t } = useLanguage();
    const { activeJournal } = useActiveJournal();

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    useEffect(() => {
        if (!authLoading && isAuthenticated && user && (user.role === 'editor' || user.role === 'admin' || user.role === 'owner')) {
            const fetchEditorJournals = async () => {
                setLoading(true);
                setError(null);
                try {
                    const fetchedJournals = await apiService.getEditorJournals();
                    const sortedJournals = [...fetchedJournals].sort((a, b) => 
                        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
                    );
                    const journalsData = sortedJournals.map(journal => ({
                        ...journal,
                        entries: [],
                        isExpanded: false,
                        isLoading: false
                    }));
                    setJournalsWithEntries(journalsData);
                } catch (err: any) {
                    console.error("Failed to fetch editor journals:", err);
                    if (err.response?.status === 401) {
                        setError("Authentication error. Please log in again.");
                    } else {
                        setError(t('failedToLoadJournals') || 'Failed to load journals.');
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchEditorJournals();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
            setJournalsWithEntries([]);
        }
    }, [isAuthenticated, authLoading, user, t]);

    const toggleJournalExpansion = async (journalId: number) => {
        setJournalsWithEntries(prevJournals => {
            return prevJournals.map(journal => {
                if (journal.id === journalId) {
                    if (!journal.isExpanded && journal.entries.length === 0) {
                        loadJournalEntries(journalId);
                    }
                    return { ...journal, isExpanded: !journal.isExpanded };
                }
                return journal;
            });
        });
    };

    const loadJournalEntries = async (journalId: number) => {
        setJournalsWithEntries(prevJournals => 
            prevJournals.map(j => j.id === journalId ? { ...j, isLoading: true } : j)
        );
        try {
            const entries = await apiService.getEntriesByJournal(journalId);
            setJournalsWithEntries(prevJournals => 
                prevJournals.map(j => j.id === journalId ? { ...j, entries, isLoading: false } : j)
            );
        } catch (err) {
            console.error(`Failed to load entries for journal ${journalId}:`, err);
            setJournalsWithEntries(prevJournals => 
                prevJournals.map(j => j.id === journalId ? { ...j, isLoading: false } : j)
            );
        }
    };

    if (authLoading || loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '24px'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '3px solid rgba(20, 184, 166, 0.1)',
                    borderTopColor: '#14B8A6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{
                    fontSize: '16px',
                    color: '#64748B',
                    fontWeight: '500',
                    letterSpacing: '0.025em'
                }}>{t('loadingJournals') || 'Loading Journals...'}</p>
            </div>
        );
    }

    if (!isAuthenticated || !user || (user.role !== 'editor' && user.role !== 'admin' && user.role !== 'owner')) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '60px auto',
                padding: '32px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
            }}>
                 <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 24px',
                    background: '#EF4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'white'
                }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1E293B', marginBottom: '12px' }}>{t('editorAccessRequired')}</h3>
                <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.6' }}>
                    {t('pleaseLoginAsEditor') || 'Please log in with an editor, admin, or owner account to view this page.'}
                </p>
                <Link to="/login" style={{
                    display: 'inline-block',
                    marginTop: '24px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600'
                }}>
                    {t('loginText') || 'Login'}
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '60px auto',
                padding: '32px',
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.1)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 24px',
                    background: '#EF4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'white'
                }}>⚠️</div>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#991B1B',
                    marginBottom: '12px'
                }}>{t('errorLoadingJournals') || 'Error Loading Journals'}</h3>
                <p style={{
                    fontSize: '16px',
                    color: '#DC2626',
                    lineHeight: '1.6'
                }}>{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="page-title-section">
                <h1>{t('myJournals') || 'My Journals'}</h1>
            </div>

            <div className="page-content-section" style={{
                paddingBottom: '0px'
            }}>
                {journalsWithEntries.length === 0 ? (
                    <div style={{
                        maxWidth: '600px',
                        margin: '80px auto',
                        textAlign: 'center',
                        padding: '60px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto 32px',
                            background: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            color: '#0D9488'
                        }}>📚</div> 
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#1E293B',
                            marginBottom: '12px'
                        }}>{t('noJournalsAssigned') || 'No Journals Assigned'}</h3>
                        <p style={{
                            fontSize: '16px',
                            color: '#64748B',
                            lineHeight: '1.6'
                        }}>{t('contactAdminForJournalAssignment') || 'Contact an administrator if you believe this is an error.'}</p>
                    </div>
                ) : (
                    <div style={{ margin: '0 auto' }}>
                        {journalsWithEntries.map((journal, index) => (
                            <div 
                                key={journal.id} 
                                className="journal-card"
                                style={{
                                    marginBottom: '24px',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: journal.isExpanded 
                                        ? '0 20px 40px rgba(0, 0, 0, 0.1)' 
                                        : '0 4px 20px rgba(0, 0, 0, 0.08)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: journal.isExpanded ? 'scale(1.02)' : 'scale(1)',
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                                    cursor: 'pointer',
                                    border: activeJournal?.id === journal.id 
                                        ? '2px solid #14B8A6' 
                                        : '1px solid rgba(20, 184, 166, 0.2)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.16)';
                                    e.currentTarget.style.transform = `translateY(-6px) ${journal.isExpanded ? 'scale(1.02)' : 'scale(1.005)'}`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = journal.isExpanded
                                        ? '0 20px 40px rgba(0, 0, 0, 0.1)'
                                        : '0 4px 20px rgba(0, 0, 0, 0.08)';
                                    e.currentTarget.style.transform = journal.isExpanded ? 'scale(1.02)' : 'scale(1)';
                                }}
                            >
                                <div 
                                    onClick={() => toggleJournalExpansion(journal.id)}
                                    style={{
                                        padding: '32px',
                                        background: journal.isExpanded 
                                            ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
                                            : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.4s ease'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, right: 0, width: '300px', height: '300px',
                                        background: journal.isExpanded 
                                            ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                                            : 'radial-gradient(circle, rgba(20,184,166,0.03) 0%, transparent 70%)',
                                        transform: 'translate(50%, -50%)', pointerEvents: 'none'
                                    }}></div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px',
                                                    background: journal.isExpanded 
                                                        ? 'rgba(255, 255, 255, 0.2)'
                                                        : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.4s ease',
                                                    boxShadow: journal.isExpanded ? 'none' : '0 4px 15px rgba(20, 184, 166, 0.3)'
                                                }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: journal.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.4s ease' }}>
                                                        <path d="M9 6L15 12L9 18" stroke={journal.isExpanded ? 'white' : 'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: journal.isExpanded ? 'white' : '#1E293B', letterSpacing: '-0.025em', transition: 'color 0.4s ease' }}>
                                                    {journal.title}
                                                    {activeJournal?.id === journal.id && (
                                                        <span style={{
                                                            marginLeft: '12px',
                                                            fontSize: '12px', 
                                                            backgroundColor: journal.isExpanded ? 'rgba(255,255,255,0.2)' : '#14B8A6',
                                                            color: journal.isExpanded ? 'white' : 'white',
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {t('active') || 'Active'}
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: journal.isExpanded ? 'rgba(255, 255, 255, 0.9)' : '#64748B', transition: 'color 0.4s ease' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 11H15M9 15H15M17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{t('issue')}: #{journal.issue}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: journal.isExpanded ? 'rgba(255, 255, 255, 0.9)' : '#64748B', transition: 'color 0.4s ease' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{new Date(journal.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Link 
                                                to={`/journals/${journal.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: journal.isExpanded ? 'white' : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                                    color: journal.isExpanded ? '#14B8A6' : 'white',
                                                    borderRadius: '12px', fontSize: '14px', fontWeight: '600', textDecoration: 'none',
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease',
                                                    boxShadow: journal.isExpanded ? '0 4px 15px rgba(0, 0, 0, 0.1)' : '0 4px 15px rgba(20, 184, 166, 0.3)',
                                                    transform: 'translateY(0)', letterSpacing: '0.025em'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = journal.isExpanded ? '0 8px 20px rgba(0, 0, 0, 0.15)' : '0 8px 20px rgba(20, 184, 166, 0.4)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = journal.isExpanded ? '0 4px 15px rgba(0, 0, 0, 0.1)' : '0 4px 15px rgba(20, 184, 166, 0.3)'; }}
                                            >
                                                <span>{t('viewJournal') || 'View Journal'}</span>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{
                                    maxHeight: journal.isExpanded ? '2000px' : '0',
                                    opacity: journal.isExpanded ? '1' : '0',
                                    overflow: 'hidden',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: 'rgba(248, 250, 252, 0.8)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ padding: '40px', opacity: journal.isExpanded ? '1' : '0', transform: journal.isExpanded ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.4s ease 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                            <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #14B8A6 0%, #0D9488 100%)', borderRadius: '2px' }}></div>
                                            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1E293B', letterSpacing: '-0.025em' }}>
                                                {t('entriesInJournal') || 'Entries in this Journal'}
                                            </h4>
                                            {journal.entries.length > 0 && (
                                                <span style={{ padding: '4px 12px', background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                                    {journal.entries.length}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {journal.isLoading ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '20px' }}>
                                                <div style={{ width: '48px', height: '48px', border: '3px solid rgba(20, 184, 166, 0.1)', borderTopColor: '#14B8A6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                <p style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>{t('loadingEntries') || 'Loading entries...'}</p>
                                            </div>
                                        ) : journal.entries.length === 0 ? (
                                            <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '2px dashed #E2E8F0' }}>
                                                <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📄</div>
                                                <p style={{ fontSize: '16px', color: '#64748B', fontWeight: '500' }}>{t('noEntriesInJournal') || 'No entries in this journal yet.'}</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                                                {journal.entries.map((entry, entryIndex) => (
                                                    <Link 
                                                        key={entry.id} 
                                                        to={`/entries/${entry.id}`}
                                                        style={{ display: 'block', textDecoration: 'none', animation: `fadeInUp 0.6s ease-out ${entryIndex * 0.1}s both` }}
                                                    >
                                                        <div style={{
                                                            background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '28px',
                                                            height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                                                            border: '1px solid #E2E8F0', transition: 'all 0.3s ease', cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#14B8A6'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                                                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', borderRadius: '50%', opacity: '0.1' }}></div>
                                                            <h5 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1E293B', lineHeight: '1.4', letterSpacing: '-0.025em', position: 'relative', zIndex: 1 }}>{entry.title}</h5>
                                                            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', position: 'relative', zIndex: 1 }}>
                                                                {entry.abstract_tr || entry.abstract_en || 'No abstract available.'}
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #F1F5F9', position: 'relative', zIndex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '12px' }}>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                                    </svg>
                                                                    <span>{new Date(entry.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                </div>
                                                                {entry.status && (() => {
                                                                    let backgroundColor = 'rgba(107, 114, 128, 0.1)'; // Default gray
                                                                    let textColor = '#6B7280'; // Default gray

                                                                    switch (entry.status.toLowerCase()) {
                                                                        case 'accepted':
                                                                            backgroundColor = 'rgba(22, 163, 74, 0.1)'; // Light Green
                                                                            textColor = '#16A34A'; // Green
                                                                            break;
                                                                        case 'rejected':
                                                                            backgroundColor = 'rgba(220, 38, 38, 0.1)'; // Light Red
                                                                            textColor = '#DC2626'; // Red
                                                                            break;
                                                                        case 'pending':
                                                                            backgroundColor = 'rgba(245, 158, 11, 0.1)'; // Light Amber
                                                                            textColor = '#D97706'; // Amber
                                                                            break;
                                                                        case 'under review':
                                                                        case 'review':
                                                                            backgroundColor = 'rgba(59, 130, 246, 0.1)'; // Light Blue
                                                                            textColor = '#3B82F6'; // Blue
                                                                            break;
                                                                        case 'revision required':
                                                                        case 'revisions':
                                                                            backgroundColor = 'rgba(249, 115, 22, 0.1)'; // Light Orange
                                                                            textColor = '#F97316'; // Orange
                                                                            break;
                                                                        case 'submitted':
                                                                            backgroundColor = 'rgba(168, 85, 247, 0.1)'; // Light Purple
                                                                            textColor = '#A855F7'; // Purple
                                                                            break;
                                                                        default:
                                                                            // Keep default gray for other statuses
                                                                            break;
                                                                    }

                                                                    return (
                                                                        <div style={{
                                                                            padding: '3px 10px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            textTransform: 'capitalize',
                                                                            backgroundColor: backgroundColor,
                                                                            color: textColor
                                                                        }}>
                                                                            {t(entry.status) || entry.status}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ marginTop: '16px', marginBottom: '0px' }}>
                    <div className="transparent-footer">
                        <Footer />
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .journal-card {
                    will-change: box-shadow, transform;
                }
                .transparent-footer .footer-content {
                    background: transparent !important;
                    border-top: none !important;
                }
            `}</style>
        </>
    );
};

export default EditorJournalsPage; 