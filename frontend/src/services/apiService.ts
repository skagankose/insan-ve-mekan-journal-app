import axios from 'axios';

// Define interfaces for expected API responses/requests
// (These might mirror backend schemas, adjust as needed)
interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface UserRead {
    email: string;
    name: string;
    title?: string; // Now a plain string
    bio?: string;
    telephone?: string;
    science_branch?: string | undefined; // Now a plain string
    location?: string;
    yoksis_id?: string;
    orcid_id?: string;
    role: string; // Corresponds to UserRole enum
    id: number;
    is_auth: boolean;
    confirmation_token?: string;
    confirmation_token_created_at?: string;
    editor_in_chief_id?: number;
}

interface UserCreate {
    email: string;
    name: string;
    title?: string;
    bio?: string;
    telephone?: string;
    science_branch?: string;
    location?: string;
    yoksis_id?: string;
    orcid_id?: string;
    role?: string;
    password: string;
    is_auth?: boolean;
}

// Add Journal Entry interfaces (matching backend schemas)
export interface JournalEntryRead {
    id: number;
    title: string;
    date?: string; // ISO format string for datetime
    abstract_tr: string;
    abstract_en?: string;
    keywords?: string;
    page_number?: string;
    article_type?: string; // Corresponds to ArticleType enum
    language?: string; // Corresponds to ArticleLanguage enum
    doi?: string;
    random_token?: string; // Entry ID + 8 random uppercase letters/numbers
    download_count: number;
    read_count: number;
    created_at: string; // ISO format string
    updated_at: string; // ISO format string
    authors?: UserRead[];
    referees?: UserRead[];
    status?: string; // Added status field, assuming backend can provide it - Corresponds to JournalEntryStatus enum
    journal_id?: number;
    file_path?: string; // Added for JournalEditPage
}

export interface JournalEntryCreate {
    title: string;
    abstract_tr: string;
    abstract_en?: string;
    keywords?: string;
    article_type?: string;
    language?: string;
    journal_id?: number;
    authors_ids?: number[];
    referees_ids?: number[];
}

interface JournalEntryUpdate {
    title?: string;
    abstract_tr?: string;
    abstract_en?: string;
    keywords?: string;
    article_type?: string;
    language?: string;
    authors_ids?: number[];
    referees_ids?: number[];
    journal_id?: number | null;
}

// Add Journal interface
interface Journal { // This will serve as JournalRead for admin purposes too
    id: number;
    title: string;
    date: string; // ISO format string for datetime
    issue: string;
    is_published: boolean;
    publication_date?: string | null; // ISO format string for datetime
    publication_place?: string;
    cover_photo?: string;
    meta_files?: string;
    editor_notes?: string;
    full_pdf?: string;
    editor_in_chief_id?: number;
}

// Add JournalCreate interface
interface JournalCreate {
    title: string;
    issue: string;
    is_published: boolean;
    publication_date?: string | null;
    publication_place?: string;
    cover_photo?: string;
    meta_files?: string;
    editor_notes?: string;
    full_pdf?: string;
    editor_in_chief_id?: number;
}

interface JournalUpdate {
    title?: string;
    issue?: string;
    date?: string; // Add date field
    is_published?: boolean;
    publication_date?: string | null;
    publication_place?: string;
    cover_photo?: string;
    meta_files?: string;
    editor_notes?: string;
    full_pdf?: string;
    editor_in_chief_id?: number;
}

export interface Settings {
    id: number; // Typically 1 for a single settings row
    active_journal_id: number | null;
    about: string | null;
}

interface SettingsUpdate {
    active_journal_id?: number | null;
    about?: string | null;
}

// --- New Interfaces for Admin Page ---
interface AdminUserRead extends UserRead {
    // Includes all fields from UserRead
    // Add fields from User model in models.py that are safe for admin view
    confirmation_token?: string;
    confirmation_token_created_at?: string;
}

interface AdminJournalRead extends Journal {
    // Includes all fields from Journal
    // Potentially add editor_ids or entry_ids if backend provides them
}

interface AdminJournalEntryRead extends JournalEntryRead {
    // Includes all fields from JournalEntryRead
    // Potentially add progress_record_ids, author_update_ids, referee_update_ids if backend provides
}

interface AuthorUpdateRead {
    id: number;
    title?: string;
    abstract_en?: string;
    abstract_tr?: string;
    keywords?: string;
    file_path?: string;
    notes?: string;
    created_date: string; // ISO format string for datetime
    entry_id: number;
    author_id: number;
}

interface AuthorUpdateCreate {
    title?: string;
    abstract_en?: string;
    abstract_tr?: string;
    keywords?: string;
    file_path?: string;
    notes?: string;
}

interface RefereeUpdateRead {
    id: number;
    file_path?: string;
    notes?: string;
    created_date: string; // ISO format string for datetime
    referee_id: number;
    entry_id: number;
}

interface RefereeUpdateCreate {
    file_path?: string;
    notes?: string;
}

/* interface JournalEntryProgressRead {
    id: number;
    owner_id?: number; // This refers to a User ID
    journal_entry_id: number;
} */

interface JournalEditorLinkRead {
    journal_id: number;
    user_id: number;
}

interface JournalEntryAuthorLinkRead {
    journal_entry_id: number;
    user_id: number;
}

interface JournalEntryRefereeLinkRead {
    journal_entry_id: number;
    user_id: number;
}

interface UserUpdate {
    email?: string;
    name?: string;
    title?: string;
    bio?: string;
    telephone?: string;
    science_branch?: string;
    location?: string;
    yoksis_id?: string;
    orcid_id?: string;
    role?: string;
    is_auth?: boolean;
}

// Add search results interface
export interface SearchResults {
    users: UserRead[];
    journals: Journal[];
    entries: JournalEntryRead[];
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

const login = async (email: string, password: string): Promise<TokenResponse> => {
    // FastAPI's OAuth2PasswordRequestForm expects form data
    const params = new URLSearchParams();
    params.append('username', email); // Keep 'username' as param name for OAuth2 compatibility
    params.append('password', password);

    const response = await apiClient.post<TokenResponse>(
        '/token',
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

const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/forgot-password', { 
        email 
    });
    return response.data;
};

const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/reset-password/${token}`, { 
        password 
    });
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

const getPublicEntryById = async (entryId: number): Promise<JournalEntryRead> => {
    const response = await axios.get<JournalEntryRead>(`/api/public/entries/${entryId}`);
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

const updateJournal = async (journalId: number, journalData: JournalUpdate): Promise<Journal> => {
    const response = await apiClient.put<Journal>(`/journals/${journalId}`, journalData);
    return response.data;
};

// Add function to delete a journal
const deleteJournal = async (journalId: number): Promise<void> => {
    await apiClient.delete(`/journals/${journalId}`);
};

// --- Admin API Calls ---

const getAllUsers = async (skip: number = 0, limit: number = 100): Promise<AdminUserRead[]> => {
    const response = await apiClient.get<AdminUserRead[]>('/admin/users', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournals = async (skip: number = 0, limit: number = 100): Promise<AdminJournalRead[]> => {
    const response = await apiClient.get<AdminJournalRead[]>('/journals/', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournalEntries = async (skip: number = 0, limit: number = 100): Promise<AdminJournalEntryRead[]> => {
    const response = await apiClient.get<AdminJournalEntryRead[]>('/admin/journal-entries', {
        params: { skip, limit }
    });
    return response.data;
};

/* const getAllJournalEntryProgress = async (skip: number = 0, limit: number = 100): Promise<JournalEntryProgressRead[]> => {
    const response = await apiClient.get<JournalEntryProgressRead[]>('/admin/journal-entry-progress', {
        params: { skip, limit }
    });
    return response.data;
}; */

const updateSettings = async (settingsData: SettingsUpdate): Promise<Settings> => {
    const response = await apiClient.put<Settings>('/admin/settings', settingsData);
    return response.data;
};

// --- New Admin API functions ---
const getSettings = async (): Promise<Settings> => {
    const response = await apiClient.get<Settings>('/admin/settings');
    return response.data;
};

const getAllAuthorUpdates = async (skip: number = 0, limit: number = 100): Promise<AuthorUpdateRead[]> => {
    const response = await apiClient.get<AuthorUpdateRead[]>('/admin/author-updates', {
        params: { skip, limit }
    });
    return response.data;
};

// Add new method to get author updates for a specific entry
const getEntryAuthorUpdates = async (entryId: number): Promise<AuthorUpdateRead[]> => {
    const response = await apiClient.get<AuthorUpdateRead[]>(`/entries/${entryId}/author-updates`);
    return response.data;
};

const getAllRefereeUpdates = async (skip: number = 0, limit: number = 100): Promise<RefereeUpdateRead[]> => {
    const response = await apiClient.get<RefereeUpdateRead[]>('/admin/referee-updates', {
        params: { skip, limit }
    });
    return response.data;
};

// Add new method to get referee updates for a specific entry
const getEntryRefereeUpdates = async (entryId: number): Promise<RefereeUpdateRead[]> => {
    const response = await apiClient.get<RefereeUpdateRead[]>(`/entries/${entryId}/referee-updates`);
    return response.data;
};

const createAuthorUpdate = async (entryId: number, authorUpdateData: AuthorUpdateCreate): Promise<AuthorUpdateRead> => {
    const response = await apiClient.post<AuthorUpdateRead>(`/entries/${entryId}/author-updates`, authorUpdateData);
    return response.data;
};

// Add function to create author update with file upload
const createAuthorUpdateWithFile = async (entryId: number, formData: FormData): Promise<AuthorUpdateRead> => {
    const response = await apiClient.post<AuthorUpdateRead>(`/entries/${entryId}/author-updates/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const createRefereeUpdate = async (entryId: number, refereeUpdateData: RefereeUpdateCreate): Promise<RefereeUpdateRead> => {
    const response = await apiClient.post<RefereeUpdateRead>(`/entries/${entryId}/referee-updates`, refereeUpdateData);
    return response.data;
};

// Add function to create referee update with file upload
const createRefereeUpdateWithFile = async (entryId: number, formData: FormData): Promise<RefereeUpdateRead> => {
    const response = await apiClient.post<RefereeUpdateRead>(`/entries/${entryId}/referee-updates/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const getAllJournalEditorLinks = async (skip: number = 0, limit: number = 100): Promise<JournalEditorLinkRead[]> => {
    const response = await apiClient.get<JournalEditorLinkRead[]>('/admin/journal-editor-links', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournalEntryAuthorLinks = async (skip: number = 0, limit: number = 100): Promise<JournalEntryAuthorLinkRead[]> => {
    const response = await apiClient.get<JournalEntryAuthorLinkRead[]>('/admin/journal-entry-author-links', {
        params: { skip, limit }
    });
    return response.data;
};

const getAllJournalEntryRefereeLinks = async (skip: number = 0, limit: number = 100): Promise<JournalEntryRefereeLinkRead[]> => {
    const response = await apiClient.get<JournalEntryRefereeLinkRead[]>('/admin/journal-entry-referee-links', {
        params: { skip, limit }
    });
    return response.data;
};

// Add a function to get published journals (no auth required)
const getPublishedJournals = async (skip: number = 0, limit: number = 100): Promise<Journal[]> => {
    const response = await axios.get<Journal[]>('/api/public/journals', {
        params: { skip, limit }
    });
    return response.data;
};

// Add a function to get a journal by ID regardless of publication status
const getJournalById = async (journalId: number): Promise<Journal> => {
    const response = await axios.get<Journal>(`/api/public/journals/${journalId}`);
    return response.data;
};

// Add a function to get journal editors for a specific journal
export const getPublicJournalEditors = async (journalId: number): Promise<JournalEditorLinkRead[]> => {
    const response = await axios.get<JournalEditorLinkRead[]>(`/api/public/journals/${journalId}/editors`);
    return response.data;
};

// Add a function to get public user information without authentication
export const getPublicUserInfo = async (userId: string): Promise<UserRead> => {
    const response = await axios.get<UserRead>(`/api/public/users/${userId}`);
    return response.data;
};

// Add function to get published journal entries
const getPublishedJournalEntries = async (journalId: number, skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await axios.get<JournalEntryRead[]>(`/api/public/journals/${journalId}/entries`, {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to update user
const updateUser = async (userId: number, userData: UserUpdate): Promise<UserRead> => {
    const response = await apiClient.put<UserRead>(`/admin/users/${userId}`, userData);
    return response.data;
};

// Add function to generate auto-login token for a user
const generateUserLoginToken = async (userId: number): Promise<string> => {
    const response = await apiClient.post<{token: string}>(`/admin/users/${userId}/login-token`);
    return response.data.token;
};

// Add function to login with a token
const loginWithToken = async (token: string, userId: number): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/token/login-with-token', {
        token,
        user_id: userId
    });
    return response.data;
};

// Add function to send login link via email
const sendLoginLinkEmail = async (userId: number, loginLink: string, emailAddress?: string): Promise<void> => {
    const response = await apiClient.post(`/admin/users/${userId}/send-login-link`, {
        login_link: loginLink,
        email_address: emailAddress
    });
    return response.data;
};

const deleteUser = async (userId: number, transferToUserId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`, { 
        data: { transfer_to_user_id: transferToUserId }
    });
};

// Add function to get entries for the currently authenticated user
const getMyJournalEntries = async (skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>('/users/me/entries', {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to get entries where the current user is a referee
const getMyRefereeEntries = async (skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>('/users/me/referee-entries', {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to get journals where the current user is an editor
const getMyEditedJournals = async (skip: number = 0, limit: number = 100): Promise<Journal[]> => {
    const response = await apiClient.get<Journal[]>('/users/me/edited-journals', {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to get user by ID (for admin)
const getUserById = async (userId: string): Promise<UserRead> => {
    const response = await apiClient.get<UserRead>(`/admin/users/${userId}/details`);
    return response.data;
};

// Add a function to get basic user information by ID (accessible to all authenticated users)
const getUserBasicInfo = async (userId: string): Promise<UserRead> => {
    const response = await apiClient.get<UserRead>(`/users/${userId}/basic-info`);
    return response.data;
};

// Add function to get journal entries for a specific user (for admin)
const getUserJournalEntries = async (userId: string, skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>(`/admin/users/${userId}/author-entries`, {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to get referee entries for a specific user (for admin)
const getUserRefereeEntries = async (userId: string, skip: number = 0, limit: number = 100): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>(`/admin/users/${userId}/referee-entries`, {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to get journals edited by a specific user (for admin)
const getUserEditedJournals = async (userId: string, skip: number = 0, limit: number = 100): Promise<Journal[]> => {
    const response = await apiClient.get<Journal[]>(`/admin/users/${userId}/edited-journals`, {
        params: { skip, limit }
    });
    return response.data;
};

// Add function to update the current user's profile
const updateMyProfile = async (userData: UserUpdate): Promise<UserRead> => {
    const response = await apiClient.put<UserRead>('/users/me', userData);
    return response.data;
};

// --- Editor Specific Endpoints ---

// Fetch journals the current editor is assigned to
export const getEditorJournals = async (): Promise<Journal[]> => {
    const response = await apiClient.get<Journal[]>('/editors/journals');
    return response.data;
};

// Fetch journal entries related to the journals the current editor manages
export const getEditorJournalEntries = async (): Promise<JournalEntryRead[]> => {
    const response = await apiClient.get<JournalEntryRead[]>('/editors/journal_entries');
    return response.data;
};

// Fetch users data for editor dashboard
export const getEditorUsers = async (): Promise<UserRead[]> => {
    const response = await apiClient.get<UserRead[]>('/editors/users');
    return response.data;
};

// Fetch journal-editor links for the editor dashboard
export const getEditorJournalEditorLinks = async (): Promise<JournalEditorLinkRead[]> => {
    const response = await apiClient.get<JournalEditorLinkRead[]>('/editors/journal_editor_links');
    return response.data;
};

// Fetch journal entry-author links for the editor dashboard
export const getEditorJournalEntryAuthorLinks = async (): Promise<JournalEntryAuthorLinkRead[]> => {
    const response = await apiClient.get<JournalEntryAuthorLinkRead[]>('/editors/journal_entry_author_links');
    return response.data;
};

// Fetch journal entry-referee links for the editor dashboard
export const getEditorJournalEntryRefereeLinks = async (): Promise<JournalEntryRefereeLinkRead[]> => {
    const response = await apiClient.get<JournalEntryRefereeLinkRead[]>('/editors/journal_entry_referee_links');
    return response.data;
};

// Fetch author updates related to the journals the current editor manages
export const getEditorAuthorUpdates = async (): Promise<AuthorUpdateRead[]> => {
    const response = await apiClient.get<AuthorUpdateRead[]>('/editors/author_updates');
    return response.data;
};

// Fetch referee updates related to the journals the current editor manages
export const getEditorRefereeUpdates = async (): Promise<RefereeUpdateRead[]> => {
    const response = await apiClient.get<RefereeUpdateRead[]>('/editors/referee_updates');
    return response.data;
};

// Add function to set editor-in-chief for a journal
export const setJournalEditorInChief = async (journalId: number, editorInChiefId: number): Promise<Journal> => {
    const response = await apiClient.put<Journal>(`/admin/journals/${journalId}/editor-in-chief`, { editor_in_chief_id: editorInChiefId });
    return response.data;
};

// Add function to add editor to a journal
export const addJournalEditor = async (journalId: number, editorId: number): Promise<JournalEditorLinkRead> => {
    const response = await apiClient.post<JournalEditorLinkRead>(`/admin/journals/${journalId}/editors`, { user_id: editorId });
    return response.data;
};

// Add function to remove editor from a journal
export const removeJournalEditor = async (journalId: number, editorId: number): Promise<void> => {
    await apiClient.delete(`/admin/journals/${journalId}/editors/${editorId}`);
};

// Get users with admin role
export const getAdminUsers = async (): Promise<UserRead[]> => {
    const response = await apiClient.get<UserRead[]>('/admin/users/role/admin');
    return response.data;
};

// Get users with editor role
export const getEditorRoleUsers = async (): Promise<UserRead[]> => {
    const response = await apiClient.get<UserRead[]>('/admin/users/role/editor');
    return response.data;
};

// Get users with author role
export const getAuthorUsers = async (): Promise<UserRead[]> => {
    const response = await apiClient.get<UserRead[]>('/admin/users/role/author');
    return response.data;
};

// Get users with referee role
export const getRefereeUsers = async (): Promise<UserRead[]> => {
    const response = await apiClient.get<UserRead[]>('/admin/users/role/referee');
    return response.data;
};

// Add author to an entry
export const addEntryAuthor = async (entryId: number, authorId: number): Promise<JournalEntryAuthorLinkRead> => {
    // Try the admin endpoint first, and if it fails, try the editor endpoint
    try {
        const response = await apiClient.post<JournalEntryAuthorLinkRead>(
            `/admin/entries/${entryId}/authors`, 
            { user_id: authorId }
        );
        return response.data;
    } catch (error) {
        // Try the editor endpoint
        const response = await apiClient.post<JournalEntryAuthorLinkRead>(
            `/editors/entries/${entryId}/authors`, 
            { user_id: authorId }
        );
        return response.data;
    }
};

// Remove author from an entry
export const removeEntryAuthor = async (entryId: number, authorId: number): Promise<void> => {
    try {
        // Try the admin endpoint first
        await apiClient.delete(`/admin/entries/${entryId}/authors/${authorId}`);
    } catch (error) {
        // Try the editor endpoint
        await apiClient.delete(`/editors/entries/${entryId}/authors/${authorId}`);
    }
};

// Add referee to an entry
export const addEntryReferee = async (entryId: number, refereeId: number): Promise<JournalEntryRefereeLinkRead> => {
    // Try the admin endpoint first, and if it fails, try the editor endpoint
    try {
        const response = await apiClient.post<JournalEntryRefereeLinkRead>(
            `/admin/entries/${entryId}/referees`, 
            { user_id: refereeId }
        );
        return response.data;
    } catch (error) {
        // Try the editor endpoint
        const response = await apiClient.post<JournalEntryRefereeLinkRead>(
            `/editors/entries/${entryId}/referees`, 
            { user_id: refereeId }
        );
        return response.data;
    }
};

// Remove referee from an entry
export const removeEntryReferee = async (entryId: number, refereeId: number): Promise<void> => {
    try {
        // Try the admin endpoint first
        await apiClient.delete(`/admin/entries/${entryId}/referees/${refereeId}`);
    } catch (error) {
        // Try the editor endpoint
        await apiClient.delete(`/editors/entries/${entryId}/referees/${refereeId}`);
    }
};

const deleteAuthorUpdate = async (updateId: number): Promise<void> => {
    await apiClient.delete(`/entries/author-updates/${updateId}`);
};

const deleteRefereeUpdate = async (updateId: number): Promise<void> => {
    await apiClient.delete(`/entries/referee-updates/${updateId}`);
};

// Add the search function
const searchAll = async (query: string): Promise<SearchResults> => {
    const response = await apiClient.get<SearchResults>(`/public/search`, {
        params: { q: query }
    });
    return response.data;
};

const uploadJournalFiles = async (journalId: number, formData: FormData): Promise<Journal> => {
    const response = await apiClient.post<Journal>(`/journals/${journalId}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const uploadEntryFile = async (entryId: number, formData: FormData): Promise<JournalEntryRead> => {
    const response = await apiClient.post<JournalEntryRead>(`/entries/${entryId}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export {
    // List all functions that are *not* individually exported with 'export const'
    login,
    register,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    getEntries,
    getEntriesByJournal,
    getEntryById,
    getPublicEntryById,
    createEntry,
    updateEntry,
    deleteEntry,
    createJournal,
    updateJournal,
    deleteJournal,
    getJournals,
    getAllUsers,
    getAllJournals,
    getAllJournalEntries,
    updateSettings,
    getSettings,
    getAllAuthorUpdates,
    getAllRefereeUpdates,
    getEntryAuthorUpdates,
    getEntryRefereeUpdates,
    createAuthorUpdate,
    createAuthorUpdateWithFile,
    createRefereeUpdate,
    createRefereeUpdateWithFile,
    deleteAuthorUpdate,
    deleteRefereeUpdate,
    getAllJournalEditorLinks,
    getAllJournalEntryAuthorLinks,
    getAllJournalEntryRefereeLinks,
    getPublishedJournals,
    getPublishedJournalEntries,
    updateUser,
    generateUserLoginToken,
    loginWithToken,
    sendLoginLinkEmail,
    deleteUser,
    getMyJournalEntries,
    getMyRefereeEntries,
    getMyEditedJournals,
    getUserById,
    getUserBasicInfo,
    getUserJournalEntries,
    getUserRefereeEntries,
    getUserEditedJournals,
    updateMyProfile,
    // Note: getEditorJournals, getEditorJournalEntries, 
    // getEditorAuthorUpdates, getEditorRefereeUpdates are intentionally omitted 
    // because they use 'export const' above.
    getJournalById,
    // The following functions are already exported with 'export const'
    // setJournalEditorInChief,
    // addJournalEditor,
    // removeJournalEditor,
    // getAdminUsers,
    // getEditorRoleUsers,
    // getAuthorUsers,
    // getRefereeUsers,
    // addEntryAuthor,
    // removeEntryAuthor,
    // addEntryReferee,
    // removeEntryReferee,
    searchAll,
    uploadJournalFiles,
    uploadEntryFile,
};

export type {
    // These interfaces are already exported directly above
    // TokenResponse,
    // UserRead, 
    // UserCreate,
    // JournalEntryRead,
    // JournalEntryCreate,
    JournalEntryUpdate,
    Journal,
    JournalCreate,
    JournalUpdate,
    // Settings,
    SettingsUpdate,
    AdminUserRead,
    AdminJournalRead,
    AdminJournalEntryRead,
    AuthorUpdateRead,
    AuthorUpdateCreate,
    RefereeUpdateRead,
    RefereeUpdateCreate,
    JournalEditorLinkRead,
    JournalEntryAuthorLinkRead,
    JournalEntryRefereeLinkRead,
    UserUpdate
}; 