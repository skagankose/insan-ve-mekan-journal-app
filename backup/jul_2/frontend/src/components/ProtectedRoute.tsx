import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Show a loading indicator while checking authentication
        return <div>Loading...</div>; // Or a spinner
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them back after login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>; // Render the children if authenticated
};

export default ProtectedRoute; 