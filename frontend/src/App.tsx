import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JournalCreatePage from './pages/JournalCreatePage';
import JournalEditPage from './pages/JournalEditPage';
import JournalsPage from './pages/JournalsPage';
import JournalCreateFormPage from './pages/JournalCreateFormPage';
import JournalEditFormPage from './pages/JournalEditFormPage';
import AdminPage from './pages/AdminPage';
import ArchivedJournalsPage from './pages/ArchivedJournalsPage';
// Import other components as needed (e.g., JournalDetailPage, JournalCreatePage)

// Import shared components
import Navbar from './components/Navbar';
// Import Sidebar when needed
import Sidebar from './components/Sidebar';

// Import ProtectedRoute component (create next)
// import ProtectedRoute from './components/ProtectedRoute';

// Admin route wrapper component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <div className="app-container">
      <Navbar /> 
      <div className="content-area">
        <Sidebar /> 
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/entries/new" element={<JournalCreatePage />} />
            <Route path="/entries/edit/:id" element={<JournalEditPage />} />
            <Route path="/archive" element={<ArchivedJournalsPage />} />
            
            {/* Admin Routes */}
            <Route path="/" element={
              <AdminRoute>
                <JournalsPage />
              </AdminRoute>
            } />
            <Route path="/journals" element={
              <AdminRoute>
                <JournalsPage />
              </AdminRoute>
            } />
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
            
            {/* Add a 404 Not Found route */}
            <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
