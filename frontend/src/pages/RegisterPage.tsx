import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import apiService from '../services/apiService'; // No longer needed directly
import { useAuth } from '../contexts/AuthContext'; // Use the Auth context
import { useLanguage } from '../contexts/LanguageContext';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [telephone, setTelephone] = useState('');
    const [scienceBranch, setScienceBranch] = useState('');
    const [location, setLocation] = useState('');
    const [yoksisId, setYoksisId] = useState('');
    const [orcidId, setOrcidId] = useState('');
    const [role, setRole] = useState('author');  // Default to author
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth(); // Get register function
    const { t } = useLanguage();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);
        // console.log("Register attempt:", { email, name, title, bio, telephone, scienceBranch, location, yoksisId, orcidId, role });

        try {
            const userData = { 
                email, 
                name,
                title: title || undefined,
                bio: bio || undefined,
                telephone: telephone || undefined,
                science_branch: scienceBranch || undefined,
                location: location || undefined,
                yoksis_id: yoksisId || undefined,
                orcid_id: orcidId || undefined,
                role,
                password 
            };
            await register(userData); // Call register from context
            setSuccess('Registration successful! Redirecting to login...');
            // Clear form
            setEmail(''); setName(''); setTitle(''); setBio(''); 
            setTelephone(''); setScienceBranch(''); setLocation(''); 
            setYoksisId(''); setOrcidId(''); setRole('author'); setPassword('');
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000); 
        } catch (err: any) {
            console.error("Registration failed:", err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <div className="page-header">
                <h1 className="page-title">{t('createAccount')}</h1>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit} className="card">
                <div className="form-group">
                    <label htmlFor="email" className="form-label">{t('email')}</label>
                    <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="name" className="form-label">{t('name')}</label>
                    <input
                        type="text"
                        id="name"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="title" className="form-label">{t('title')} (Optional)</label>
                    <input
                        type="text"
                        id="title"
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="bio" className="form-label">{t('bio')} (Optional)</label>
                    <textarea
                        id="bio"
                        className="form-input"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="telephone" className="form-label">{t('telephone') || 'Phone Number'} (Optional)</label>
                    <input
                        type="text"
                        id="telephone"
                        className="form-input"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="scienceBranch" className="form-label">{t('scienceBranch') || 'Science Branch'} (Optional)</label>
                    <input
                        type="text"
                        id="scienceBranch"
                        className="form-input"
                        value={scienceBranch}
                        onChange={(e) => setScienceBranch(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="location" className="form-label">{t('location') || 'Location'} (Optional)</label>
                    <input
                        type="text"
                        id="location"
                        className="form-input"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="yoksisId" className="form-label">{t('yoksisId') || 'YÖKSİS ID'} (Optional)</label>
                    <input
                        type="text"
                        id="yoksisId"
                        className="form-input"
                        value={yoksisId}
                        onChange={(e) => setYoksisId(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="orcidId" className="form-label">{t('orcidId') || 'ORCID ID'} (Optional)</label>
                    <input
                        type="text"
                        id="orcidId"
                        className="form-input"
                        value={orcidId}
                        onChange={(e) => setOrcidId(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="role" className="form-label">{t('role')}</label>
                    <select
                        id="role"
                        className="form-input"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isSubmitting}
                    >
                        <option value="author">{t('writer') || 'Writer'}</option>
                        <option value="editor">{t('editor') || 'Editor'}</option>
                        <option value="referee">{t('arbitrator') || 'Arbitrator'}</option>
                        <option value="admin">{t('admin') || 'Admin'}</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="password" className="form-label">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="form-group" style={{ marginTop: 'var(--spacing-6)' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmitting}
                        style={{ width: '100%' }}
                    >
                        {isSubmitting ? t('creatingAccount') : t('registerButton')}
                    </button>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <p className="text-secondary">
                        {t('alreadyHaveAccount')} <Link to="/login">{t('loginText')}</Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage; 