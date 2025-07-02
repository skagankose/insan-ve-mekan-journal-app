import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import * as apiService from '../services/apiService'; // Use our API service

// Define the shape of the user object (adjust based on UserRead schema)
export interface User {
    id: number;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    telephone?: string;
    science_branch?: string;
    location?: string;
    yoksis_id?: string;
    orcid_id?: string;
    role: string;
    is_auth: boolean;
    marked_for_deletion?: boolean;
    tutorial_done?: boolean;
}

// Define the shape of the context data
interface AuthContextType {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean; // To handle initial auth check
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<User>;
    logout: () => void;
    register: (userData: any) => Promise<void>; // Add register function
    setAuthState: (isAuthenticated: boolean, user: User | null) => void; // Add method to set auth state
    refreshUser: () => Promise<void>; // Add method to refresh user data
}

// Create the context with a default value (usually null or undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
    const isFetchingUser = useRef(false);

    // Effect to fetch user data if token exists on initial load
    useEffect(() => {
        const fetchUser = async () => {
            if (token && !isFetchingUser.current) {
                isFetchingUser.current = true;
                try {
                    // console.log("AuthProvider: Token found, fetching user...");
                    const currentUser = await apiService.getCurrentUser();
                    setUser(currentUser);
                    // console.log("AuthProvider: User fetched", currentUser);
                } catch (error) {
                    console.error("AuthProvider: Failed to fetch user with existing token", error);
                    // Token might be invalid/expired, clear it
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                } finally {
                    isFetchingUser.current = false;
                    setIsLoading(false); // Finished loading attempt
                }
            } else if (!token) {
                setIsLoading(false); // No token, not loading
            }
        };

        fetchUser();
        // Don't include isFetchingUser in the dependency array as it's a ref
    }, [token]);

    const login = async (email: string, password: string) => {
        try {
            const data = await apiService.login(email, password);
            // Set token first
            localStorage.setItem('authToken', data.access_token);
            setToken(data.access_token);
            
            // Then fetch user details
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            // If anything fails, clean up
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
            console.error("AuthProvider: Login failed", error);
            throw error;
        }
    };

    const loginWithGoogle = async (credential: string) => {
        try {
            const data = await apiService.loginWithGoogle(credential);
            localStorage.setItem('authToken', data.access_token);
            setToken(data.access_token);
            
            // Fetch user details immediately after setting token
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            
            return currentUser; // Return the user data for the component to use
        } catch (error) {
            console.error("AuthProvider: Google login failed", error);
            throw error;
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
        // console.log("AuthProvider: Logged out");
    };

    // Add a method to directly set the authentication state
    const setAuthState = (isAuthenticated: boolean, newUser: User | null) => {
        // When we're setting auth state directly with a user object,
        // we don't need to trigger another API call
        isFetchingUser.current = true; // Prevent the useEffect from fetching user again
        
        if (isAuthenticated && newUser) {
            // Set user first, then allow the token to be processed
            setUser(newUser);
            // Force a state update cycle to complete
            setTimeout(() => {
                isFetchingUser.current = false;
            }, 200);
        } else {
            setUser(null);
            localStorage.removeItem('authToken');
            setToken(null);
            isFetchingUser.current = false;
        }
    };

    // Add a method to refresh the user data
    const refreshUser = async () => {
        try {
            if (token) {
                const currentUser = await apiService.getCurrentUser();
                setUser(currentUser);
                // console.log("AuthProvider: User refreshed", currentUser);
            }
        } catch (error) {
            console.error("AuthProvider: Failed to refresh user", error);
            // Token might be invalid/expired, clear it
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
        }
    };

    const contextValue: AuthContextType = {
        token,
        user,
        isAuthenticated: !!token && !!user, // Considered authenticated if token and user exist
        isLoading,
        login,
        loginWithGoogle,
        logout,
        register,
        setAuthState,
        refreshUser // Add the refreshUser function to the context value
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