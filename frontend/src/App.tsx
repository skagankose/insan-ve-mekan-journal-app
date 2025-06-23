import './App.css'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { FaBuilding, FaSearch } from 'react-icons/fa';
import { MdExplore } from 'react-icons/md';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import GeneralInfoPage from './pages/GeneralInfoPage';
import JournalCreatePage from './pages/JournalCreatePage';
import JournalEditPage from './pages/JournalEditPage';
import JournalCreateFormPage from './pages/JournalCreateFormPage';
import JournalEditFormPage from './pages/JournalEditFormPage';
import AdminPage from './pages/AdminPage';
import EditorJournalsPage from './pages/EditorJournalsPage';
import ArchivedJournalsPage from './pages/ArchivedJournalsPage';
import JournalDetailsPage from './pages/JournalDetailsPage';
import JournalEntryDetailsPage from './pages/JournalEntryDetailsPage';
import EditUserPage from './pages/EditUserPage';
import CreateUserPage from './pages/CreateUserPage';
import AutoLoginPage from './pages/AutoLoginPage';
import UserProfilePage from './pages/UserProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import JournalEntryUpdateDetailsPage from './pages/JournalEntryUpdateDetailsPage';
import AuthorUpdateFormPage from './pages/AuthorUpdateFormPage';
import RefereeUpdateFormPage from './pages/RefereeUpdateFormPage';
// Import other components as needed (e.g., JournalDetailPage, JournalCreatePage)

// Import shared components
import Navbar from './components/Navbar';
// Import Sidebar when needed
import Sidebar from './components/Sidebar';

// Import ProtectedRoute component (create next)
// import ProtectedRoute from './components/ProtectedRoute';

// Admin route wrapper component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // If still loading auth state, show a loading spinner
  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }
  
  // Check if user is authenticated and has admin or owner role
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Editor route wrapper component
const EditorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // If still loading auth state, show a loading spinner
  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }
  
  // Check if user is authenticated and has editor, admin, or owner role
  if (!isAuthenticated || !user || (user.role !== 'editor' && user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// User route wrapper component for protected user routes
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If still loading auth state, show a loading spinner
  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If we have a user, render the protected content
  return <>{children}</>;
};

// NotFoundPage component
const NotFoundPage = () => {
  const { t } = useLanguage();
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '70vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '700px',
          width: '100%'
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <FaBuilding size={120} color="#14b8a6" style={{ marginBottom: '1rem' }} />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '4rem', 
            margin: '0 0 1rem 0', 
            color: '#374151',
            fontWeight: 'bold'
          }}>
            404
          </h1>
          <h2 style={{ 
            fontSize: '1.8rem', 
            margin: '0 0 1rem 0', 
            color: '#6b7280',
            fontWeight: '600'
          }}>
            {t('pageNotFoundTitle')}
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#9ca3af', 
            maxWidth: '600px',
            lineHeight: '1.6',
            margin: '0 auto'
          }}>
            {t('pageNotFoundDescription')}
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdExplore size={20} color="#14b8a6" />
            <span>{t('exploreJournalsText')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaSearch size={16} color="#14b8a6" />
            <span>{t('searchContentText')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DesktopOnlyMessage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="desktop-only-message">
      <div className="desktop-only-message-box">
        <div className="desktop-only-logo-container">
          <div className="desktop-only-logo">
            <img 
              src="/logo.png" 
              alt="Human & Space Logo" 
              className="desktop-only-logo-image"
            />
          </div>
        </div>
        <h1>
          {language === 'en' ? 'Human & Space' : 'İnsan & Mekan'}
        </h1>
        <p>
          {language === 'en' 
            ? 'This web application is designed for a rich, interactive experience on desktop computers and tablets. For full functionality, including dashboards and detailed views, please switch to a larger screen.' 
            : 'Bu platform, masaüstü bilgisayar ve tabletlerde zengin ve etkileşimli bir deneyim için tasarlanmıştır. İşlevsel olarak uygulamayı kullanabilmek için lütfen daha büyük bir ekrana geçin.'}
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const location = useLocation();
  
  // Check if current route should hide sidebar
  const hideSidebar = ['/login', '/register'].includes(location.pathname);

  if (!googleClientId) {
    console.error('Google Client ID is not set in environment variables');
    return <div>Configuration Error: Google Client ID is missing</div>;
  }

  return (
    <>
      <DesktopOnlyMessage />
      <GoogleOAuthProvider clientId={googleClientId}>
        <div className="app-container">
          <Navbar /> 
          <div className="content-area">
            {!hideSidebar && <Sidebar />}
            <main className={`main-content ${hideSidebar ? 'no-sidebar' : ''}`}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/general-info" element={<GeneralInfoPage />} />
                <Route path="/auto-login" element={<AutoLoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Protected Routes */}
                <Route path="/entries/new" element={
                  <UserRoute>
                    <JournalCreatePage />
                  </UserRoute>
                } />
                <Route path="/entries/edit/:id" element={
                  <UserRoute>
                    <JournalEditPage />
                  </UserRoute>
                } />
                <Route path="/entries/:entryId/updates" element={
                  <UserRoute>
                    <JournalEntryUpdateDetailsPage />
                  </UserRoute>
                } />
                <Route path="/entries/:entryId" element={<JournalEntryDetailsPage />} />
                <Route path="/entries/:entryId/author-update/new" element={
                  <UserRoute>
                    <AuthorUpdateFormPage />
                  </UserRoute>
                } />
                <Route path="/entries/:entryId/referee-update/new" element={
                  <UserRoute>
                    <RefereeUpdateFormPage />
                  </UserRoute>
                } />
                <Route path="/archive" element={<ArchivedJournalsPage />} />
                <Route path="/profile" element={
                  <UserRoute>
                    <UserProfilePage />
                  </UserRoute>
                } />
                <Route path="/profile/edit" element={
                  <UserRoute>
                    <ProfileEditPage />
                  </UserRoute>
                } />
                
                <Route path="/editor/journals" element={
                  <EditorRoute>
                    <EditorJournalsPage />
                  </EditorRoute>
                } />
                
                <Route path="/journals/:journalId" element={<JournalDetailsPage />} />
                
                {/* Admin Routes */}
                <Route path="/" element={<ArchivedJournalsPage />} />
                
                <Route path="/journals/new" element={
                  <AdminRoute>
                    <JournalCreateFormPage />
                  </AdminRoute>
                } />
                <Route path="/journals/edit/:id" element={
                  <AdminRoute>
                    <JournalEditFormPage />
                  </AdminRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                } />
                <Route path="/admin/users/edit/:id" element={
                  <AdminRoute>
                    <EditUserPage />
                  </AdminRoute>
                } />
                <Route path="/admin/users/create" element={
                  <AdminRoute>
                    <CreateUserPage />
                  </AdminRoute>
                } />
                <Route path="/admin/users/profile/:id" element={
                  <AdminRoute>
                    <UserProfilePage />
                  </AdminRoute>
                } />
                
                {/* Add a 404 Not Found route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
          <ToastContainer position="top-right" autoClose={5000} />
        </div>
      </GoogleOAuthProvider>
    </>
  )
}

export default App
