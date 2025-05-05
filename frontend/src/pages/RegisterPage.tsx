import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import apiService from '../services/apiService'; // No longer needed directly
import { useAuth } from '../contexts/AuthContext'; // Use the Auth context
import { useLanguage } from '../contexts/LanguageContext';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState('writer');  // Default to writer
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
        console.log("Register attempt:", { username, email, name, title, bio, role });

        try {
            const userData = { 
                username, 
                email, 
                name,
                title: title || undefined,
                bio: bio || undefined,
                role,
                password 
            };
            await register(userData); // Call register from context
            setSuccess('Registration successful! Redirecting to login...');
            // Clear form
            setUsername(''); setEmail(''); setName(''); setTitle(''); setBio(''); setRole('writer'); setPassword('');
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
                    <label htmlFor="username" className="form-label">{t('username')}</label>
                    <input
                        type="text"
                        id="username"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
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
                    <label htmlFor="role" className="form-label">{t('role')}</label>
                    <select
                        id="role"
                        className="form-input"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isSubmitting}
                    >
                        <option value="writer">{t('writer') || 'Writer'}</option>
                        <option value="editor">{t('editor') || 'Editor'}</option>
                        <option value="arbitrator">{t('arbitrator') || 'Arbitrator'}</option>
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