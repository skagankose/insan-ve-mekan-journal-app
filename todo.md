All Pages in the Project

Public/Authentication Pages
[ + ] LoginPage - User login page
[ - ] RegisterPage - User registration page
[ - ] AutoLoginPage - Automatic login handling page
[ - ] ForgotPasswordPage - Password recovery page
[ - ] ResetPasswordPage - Password reset page (with token parameter)

Admin-Only Pages
[ - ] AdminPage - Main admin dashboard
[ - ] JournalCreateFormPage - Admin form to create new journals
[ - ] JournalEditFormPage - Admin form to edit existing journals
[ - ] EditUserPage - Admin page to edit user details
[ - ] CreateUserPage - Admin page to create new users

Protected User Pages
[ - ] UserProfilePage - User profile display page
[ - ] ProfileEditPage - Edit user profile page
[ - ] JournalCreatePage - Create new journal entry page
[ - ] JournalEditPage - Edit existing journal entry page
[ - ] AuthorUpdateFormPage - Form for author updates
[ - ] RefereeUpdateFormPage - Form for referee updates
[ - ] JournalEntryUpdateDetailsPage - View/manage journal entry updates

Public Content Pages
[ + ] ArchivedJournalsPage - Browse archived journals (also serves as homepage "/")
[ - ] JournalDetailsPage - Detailed view of a specific journal
[ ? ] JournalEntriesPage - View entries for a specific archived journal
[ - ] JournalEntryDetailsPage - Detailed view of a specific journal entry

Editor-Only Pages
[ + ] EditorJournalsPage - Editor dashboard for managing journals

Error/Fallback Pages
[ + ] 404 Not Found - Generic fallback for unmatched routes (inline component)

Page Access Levels:
Public: 5 pages (authentication + password recovery)
User Protected: 7 pages (requires login)
Public Content: 4 pages (viewable by anyone)
Editor Only: 1 page (requires editor+ role)
Admin Only: 5 pages (requires admin+ role)