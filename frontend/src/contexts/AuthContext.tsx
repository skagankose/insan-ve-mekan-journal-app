import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import apiService from '../services/apiService'; // Use our API service

// Define the shape of the user object (adjust based on UserRead schema)
interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role: string;
}

// Define the shape of the context data
interface AuthContextType {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean; // To handle initial auth check
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: any) => Promise<void>; // Add register function
}

// Create the context with a default value (usually null or undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading

    // Effect to fetch user data if token exists on initial load
    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    console.log("AuthProvider: Token found, fetching user...");
                    const currentUser = await apiService.getCurrentUser();
                    setUser(currentUser);
                    console.log("AuthProvider: User fetched", currentUser);
                } catch (error) {
                    console.error("AuthProvider: Failed to fetch user with existing token", error);
                    // Token might be invalid/expired, clear it
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false); // Finished loading attempt
        };

        fetchUser();
    }, [token]); // Run when token changes (e.g., after login/logout)

    const login = async (username: string, password: string) => {
        try {
            const data = await apiService.login(username, password);
            localStorage.setItem('authToken', data.access_token);
            setToken(data.access_token);
            // Fetch user details after setting token (useEffect will trigger)
        } catch (error) {
            console.error("AuthProvider: Login failed", error);
            throw error; // Re-throw error to be caught by the component
        }
    };

    const register = async (userData: any) => {
        try {
            // Registration doesn't usually log the user in immediately
            // Adjust if your backend returns a token on registration
            await apiService.register(userData);
        } catch (error) {
            console.error("AuthProvider: Registration failed", error);
            throw error; // Re-throw error
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        // Optionally redirect using useNavigate if needed outside component context
        console.log("AuthProvider: Logged out");
    };

    const contextValue: AuthContextType = {
        token,
        user,
        isAuthenticated: !!token && !!user, // Considered authenticated if token and user exist
        isLoading,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 