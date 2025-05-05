import axios from 'axios';

// Define interfaces for expected API responses/requests
// (These might mirror backend schemas, adjust as needed)
interface TokenResponse {
    access_token: string;
    token_type: string;
}

interface UserRead {
    username: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role: string;
    id: number;
}

interface UserCreate {
    username: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role?: string;
    password: string;
}

// Add Journal Entry interfaces (matching backend schemas)
interface JournalEntryRead {
    id: number;
    title: string;
    content: string;
    abstract: string;
    created_at: string; // ISO format string
    updated_at: string; // ISO format string
    owner_id: number;
}

interface JournalEntryCreate {
    title: string;
    content: string;
    abstract: string;
    journal_id?: number;
    // owner_id is added by the backend based on the token
}

interface JournalEntryUpdate {
    title?: string;
    content?: string;
    abstract?: string;
}

// Add Journal interface
interface Journal {
    id: number;
    title: string;
    date: string;
    issue: string;
}

// Add JournalCreate interface
interface JournalCreate {
    title: string;
    issue: string;
}

// Create an Axios instance
const apiClient = axios.create({
    // Use the proxied path. Requests to /api/token will go to http://localhost:8000/token
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Request Interceptor --- 
// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Or get from context/state management
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Authentication API Calls --- 

const login = async (username: string, password: string): Promise<TokenResponse> => {
    // FastAPI's OAuth2PasswordRequestForm expects form data
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await apiClient.post<TokenResponse>(
        '/token', // Backend endpoint
        params, 
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
    );
    return response.data;
};

const register = async (userData: UserCreate): Promise<UserRead> => {
    const response = await apiClient.post<UserRead>('/users/', userData);
    return response.data;
};

const getCurrentUser = async (): Promise<UserRead> => {
    const response = await apiClient.get<UserRead>('/users/me');
    return response.data;
};

// --- Journal Entry API Calls --- 

const getEntries = async (skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>('/entries/', {
        params: { skip, limit }
    });
    return response.data;
};

const getEntriesByJournal = async (journalId: number, skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>(`/entries/by-journal/${journalId}`, {
        params: { skip, limit }
    });
    return response.data;
};

const getJournals = async (skip: number = 0, limit: number = 100): Promise<Journal[]> => {
    const response = await apiClient.get<Journal[]>('/entries/journals', {
        params: { skip, limit }
    });
    return response.data;
};

const getEntryById = async (entryId: number): Promise<JournalEntryRead> => {
    const response = await apiClient.get<JournalEntryRead>(`/entries/${entryId}`);
    return response.data;
};

const createEntry = async (entryData: JournalEntryCreate): Promise<JournalEntryRead> => {
    const response = await apiClient.post<JournalEntryRead>('/entries/', entryData);
    return response.data;
};

const updateEntry = async (entryId: number, entryData: JournalEntryUpdate): Promise<JournalEntryRead> => {
    const response = await apiClient.put<JournalEntryRead>(`/entries/${entryId}`, entryData);
    return response.data;
};

const deleteEntry = async (entryId: number): Promise<void> => {
    // Expects a 204 No Content response, so no return data needed
    await apiClient.delete(`/entries/${entryId}`);
};

const createJournal = async (journalData: JournalCreate): Promise<Journal> => {
    const response = await apiClient.post<Journal>('/journals/', journalData);
    return response.data;
};

// --- Admin API Calls ---

const getAllUsers = async (skip: number = 0, limit: number = 100): Promise<UserRead[]> => {
    const response = await apiClient.get<UserRead[]>('/admin/users', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournals = async (skip: number = 0, limit: number = 100) => {
    const response = await apiClient.get('/admin/journals', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournalEntries = async (skip: number = 0, limit: number = 100) => {
    const response = await apiClient.get('/admin/journal-entries', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournalEntryProgress = async (skip: number = 0, limit: number = 100) => {
    const response = await apiClient.get('/admin/journal-entry-progress', {
        params: { skip, limit }
    });
    return response.data;
};

export type { JournalEntryRead, JournalEntryCreate, JournalEntryUpdate, Journal };

export default {
    login,
    register,
    getCurrentUser,
    // Export journal functions
    getEntries,
    getEntryById,
    createEntry,
    updateEntry,
    deleteEntry,
    getJournals,
    createJournal,
    getEntriesByJournal,
    // Admin functions
    getAllUsers,
    getAllJournals,
    getAllJournalEntries,
    getAllJournalEntryProgress,
    // apiClient, // Optionally export the instance if needed elsewhere
}; 