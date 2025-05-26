import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import './EditUserPage.css'; // Reuse the same styling
import ReCAPTCHA from 'react-google-recaptcha';
import PhoneInput from 'react-phone-input-2';
import FormattedIdInput from '../components/FormattedIdInput';
import LocationInput from '../components/LocationInput';
import 'react-phone-input-2/lib/style.css';
import '../styles/PhoneInput.css';
import '../styles/FormattedIdInput.css';

interface UserForm {
    email: string;
    name: string;
    title: string;
    bio: string;
    telephone: string;
    science_branch: string;
    location: string;
    yoksis_id: string;
    orcid_id: string;
    role: string;
    password: string;
    is_auth: boolean;
}

const CreateUserPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [captchaValue, setCaptchaValue] = useState<string | null>(null);
    const [formData, setFormData] = useState<UserForm>({
        email: '',
        name: '',
        title: '',
        bio: '',
        telephone: '',
        science_branch: '',
        location: '',
        yoksis_id: '',
        orcid_id: '',
        role: 'author',
        password: '',
        is_auth: true
    });

    useEffect(() => {
        // Ensure only admin or owner users can access this page
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (currentUser?.role !== 'admin' && currentUser?.role !== 'owner') {
            navigate('/');
            return;
        }
    }, [isAuthenticated, currentUser, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setFormData({
                ...formData,
                [name]: checkbox.checked
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleCaptchaChange = (value: string | null) => {
        setCaptchaValue(value);
        if (!value) {
            setError(t('captchaExpired') || 'CAPTCHA verification expired. Please verify again.');
        } else {
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!captchaValue) {
            setError(t('pleaseVerifyCaptcha') || 'Please verify that you are human');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            
            // Use the register function from apiService
            await apiService.register({
                email: formData.email,
                name: formData.name,
                title: formData.title || undefined,
                bio: formData.bio || undefined,
                telephone: formData.telephone || undefined,
                science_branch: formData.science_branch || undefined,
                location: formData.location || undefined,
                yoksis_id: formData.yoksis_id || undefined,
                orcid_id: formData.orcid_id || undefined,
                role: formData.role,
                password: formData.password,
                is_auth: formData.is_auth,
                recaptcha_token: captchaValue
            });
            
            setSuccess(true);
            // Reset the form after successful submission
            setFormData({
                email: '',
                name: '',
                title: '',
                bio: '',
                telephone: '',
                science_branch: '',
                location: '',
                yoksis_id: '',
                orcid_id: '',
                role: 'author',
                password: '',
                is_auth: true
            });
            setCaptchaValue(null);
            
            // Navigate back to admin page after a short delay
            navigate('/admin');
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container edit-user-page">
            <h1 className="page-title">{t('createUser')}</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{t('userCreatedSuccessfully')}</div>}
            
            <form onSubmit={handleSubmit} className="edit-user-form">
                <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        maxLength={200}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="name">{t('name')}</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        maxLength={200}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                        maxLength={100}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="title">{t('title')}</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        maxLength={200}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="bio">{t('bio')}</label>
                    <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        maxLength={400}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="telephone">{t('telephone')}</label>
                    <PhoneInput
                        country={'tr'}
                        value={formData.telephone}
                        onChange={(phone: string) => handleInputChange({
                            target: { name: 'telephone', value: phone }
                        } as React.ChangeEvent<HTMLInputElement>)}
                        inputProps={{
                            id: 'telephone',
                            disabled: loading
                        }}
                        containerClass="phone-input-container"
                        inputClass="form-input"
                        buttonClass="country-dropdown"
                        disabled={loading}
                        enableSearch={true}
                        searchPlaceholder={t('searchCountry') || 'Search country'}
                        searchNotFound={t('countryNotFound') || 'Country not found'}
                        preferredCountries={['tr']}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="science_branch">{t('scienceBranch')}</label>
                    <input
                        type="text"
                        id="science_branch"
                        name="science_branch"
                        value={formData.science_branch}
                        onChange={handleInputChange}
                        maxLength={300}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="location">{t('location')}</label>
                    <LocationInput
                        value={formData.location}
                        onChange={(value) => handleInputChange({
                            target: { name: 'location', value }
                        } as React.ChangeEvent<HTMLInputElement>)}
                        id="location"
                        name="location"
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="yoksis_id">{t('yoksisId')}</label>
                    <FormattedIdInput
                        type="yoksis"
                        value={formData.yoksis_id}
                        onChange={(value) => handleInputChange({
                            target: { name: 'yoksis_id', value }
                        } as React.ChangeEvent<HTMLInputElement>)}
                        id="yoksis_id"
                        name="yoksis_id"
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="orcid_id">{t('orcidId')}</label>
                    <FormattedIdInput
                        type="orcid"
                        value={formData.orcid_id}
                        onChange={(value) => handleInputChange({
                            target: { name: 'orcid_id', value }
                        } as React.ChangeEvent<HTMLInputElement>)}
                        id="orcid_id"
                        name="orcid_id"
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="role">{t('role')}</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="author">Author</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                        <option value="referee">Referee</option>
                    </select>
                </div>
                
                <div className="form-group checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            id="is_auth"
                            name="is_auth"
                            checked={formData.is_auth}
                            onChange={handleInputChange}
                        />
                        {t('isAuth')}
                    </label>
                </div>

                <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
                    <ReCAPTCHA
                        sitekey="6Lc0kEYrAAAAACSgj_HzCdsBIdsl60GEN8uv7m43"
                        onChange={handleCaptchaChange}
                    />
                </div>
                
                <div className="form-buttons">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/admin')}
                        disabled={loading}
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading || !captchaValue}
                    >
                        {loading ? t('saving') : t('createUser')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUserPage; 