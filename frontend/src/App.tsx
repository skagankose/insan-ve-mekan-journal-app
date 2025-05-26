import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JournalCreatePage from './pages/JournalCreatePage';
import JournalEditPage from './pages/JournalEditPage';
import JournalCreateFormPage from './pages/JournalCreateFormPage';
import JournalEditFormPage from './pages/JournalEditFormPage';
import AdminPage from './pages/AdminPage';
import EditorJournalsPage from './pages/EditorJournalsPage';
import ArchivedJournalsPage from './pages/ArchivedJournalsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
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
import Footer from './components/Footer';

// Import ProtectedRoute component (create next)
// import ProtectedRoute from './components/ProtectedRoute';

// Admin route wrapper component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Check if user is authenticated and has admin or owner role
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Editor route wrapper component
const EditorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
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

const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('Google Client ID is not set in environment variables');
    return <div>Configuration Error: Google Client ID is missing</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="app-container">
        <Navbar /> 
        <div className="content-area">
          <Sidebar /> 
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
              <Route path="/archive/journal/:journalId" element={<JournalEntriesPage />} />
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
              <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Page Not Found</div>} />
            </Routes>
          </main>
        </div>
        <Footer />
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </GoogleOAuthProvider>
  )
}

export default App
