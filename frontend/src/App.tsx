import './App.css'
import { Routes, Route } from 'react-router-dom';

// Import page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JournalCreatePage from './pages/JournalCreatePage';
import JournalEditPage from './pages/JournalEditPage';
import JournalsPage from './pages/JournalsPage';
import JournalCreateFormPage from './pages/JournalCreateFormPage';
import AdminPage from './pages/AdminPage';
// Import other components as needed (e.g., JournalDetailPage, JournalCreatePage)

// Import shared components
import Navbar from './components/Navbar';
// Import Sidebar when needed
import Sidebar from './components/Sidebar';

// Import ProtectedRoute component (create next)
// import ProtectedRoute from './components/ProtectedRoute';

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
            <Route path="/" element={<JournalsPage />} />
            <Route path="/entries/new" element={<JournalCreatePage />} />
            <Route path="/entries/edit/:id" element={<JournalEditPage />} />
            <Route path="/journals" element={<JournalsPage />} />
            <Route path="/journals/new" element={<JournalCreateFormPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Add a 404 Not Found route */}
            <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
