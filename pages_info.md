# Pages Access Control and Role Permissions Analysis

## User Roles in System
- **owner** - Highest privilege, system owner
- **admin** - Administrative privileges
- **editor** - Editorial privileges for journals
- **referee** - Can review and evaluate papers
- **author** - Can submit papers and updates
- **unauthorized user** - Not logged in, public access only

## Page Access Control and Permissions

### 🔓 Public Pages (Unauthorized Users Can Access)

#### LoginPage - User Login
- **Access**: All users (public)
- **Actions**:
  - **All users**: Login with email/password, Login with Google, Navigate to registration, Request password reset, Resend confirmation email

#### RegisterPage - User Register  
- **Access**: All users (public)
- **Actions**:
  - **All users**: Create new account, Upload profile documents, Navigate to login

#### AutoLoginPage - Automatic Login
- **Access**: All users (public, with valid token)
- **Actions**:
  - **All users**: Automatic authentication via token, Redirect to dashboard

#### ForgotPasswordPage - Password Recovery
- **Access**: All users (public)
- **Actions**:
  - **All users**: Request password reset email

#### ResetPasswordPage - Password Reset (with token parameter)
- **Access**: All users (public, with valid reset token)
- **Actions**:
  - **All users**: Reset password with valid token

#### EmailConfirmationPage - Confirming E-mail
- **Access**: All users (public, with valid confirmation token)
- **Actions**:
  - **All users**: Confirm email address with valid token

#### ArchivedJournalsPage - Journal List - Published
- **Access**: All users (public)
- **Actions**:
  - **All users**: View published journals, View published entries, Browse archives, Download PDFs
  - **Admin/Owner**: Additional management options may be visible

#### JournalDetailsPage - Journal Details
- **Access**: All users (public) 
- **Actions**:
  - **All users**: View journal information, View journal entries, Download files
  - **Admin/Owner**: Edit journal, Manage journal settings
  - **Editor** (of specific journal): Edit journal, Manage entries

#### JournalEntryDetailsPage - Entry Details
- **Access**: All users (public) for published entries, Role-based for draft entries
- **Actions**:
  - **All users**: View entry details, Download files, Increment read count
  - **Author** (of entry): View private details, Access update forms, View payment info
  - **Referee** (assigned): View referee information, Access review forms
  - **Editor**: Manage entry, Assign referees, Change status
  - **Admin/Owner**: Full management access, View all details

#### AboutPage - About Page
- **Access**: All users (public)
- **Actions**:
  - **All users**: View about information

#### GeneralInfoPage - General Information Page
- **Access**: All users (public)
- **Actions**:
  - **All users**: View general information and policies

---

### 🔐 Authenticated User Pages (Login Required)

#### UserProfilePage - User Profile
- **Access**: Authenticated users (own profile) + Admin/Owner (any profile)
- **Actions**:
  - **User** (own profile): View profile, View own entries, View own referee work
  - **Admin/Owner**: View any user profile, Edit user via admin panel, View all user activities

#### ProfileEditPage - User Edit Profile
- **Access**: Authenticated users (own profile only)
- **Actions**:
  - **User**: Edit own profile information, Update personal details, Upload documents

#### JournalCreatePage - Entry Create
- **Access**: Authenticated users (authors)
- **Actions**:
  - **Author**: Create new journal entry, Upload documents, Submit for review
  - **Admin/Owner**: Create entries, Assign to journals

#### JournalEditPage - Entry Edit
- **Access**: Entry authors + Editor + Admin/Owner
- **Actions**:
  - **Author** (of entry): Edit own entries, Update content, Upload new versions
  - **Editor**: Edit entries in their journals, Update entry status
  - **Admin/Owner**: Edit any entry, Full management access

#### AuthorUpdateFormPage - Author Update Create
- **Access**: Entry authors + Admin/Owner
- **Actions**:
  - **Author** (of entry): Submit author updates, Upload revised documents, Add notes
  - **Admin/Owner**: Create updates on behalf of authors

#### RefereeUpdateFormPage - Referee Update Create
- **Access**: Assigned referees + Admin/Owner
- **Actions**:
  - **Referee** (assigned): Submit referee reviews, Upload review documents, Add evaluation notes
  - **Admin/Owner**: Create updates on behalf of referees

#### JournalEntryUpdateDetailsPage - Entry Update Details
- **Access**: Entry authors, assigned referees, editors, admin/owner
- **Actions**:
  - **Author** (of entry): View all updates, Download documents, Submit new updates
  - **Referee** (assigned): View updates, Submit reviews, Download materials
  - **Editor**: View all updates, Manage review process, Communicate with authors/referees
  - **Admin/Owner**: Full access to all updates and management

---

### 👥 Editor Pages (Editor + Admin + Owner)

#### EditorJournalsPage - Journal List - All
- **Access**: Editor + Admin + Owner
- **Actions**:
  - **Editor**: View assigned journals, Manage entries in own journals, Review submissions
  - **Admin/Owner**: View all journals, Assign editors, Full journal management

---

### 🛡️ Admin Pages (Admin + Owner Only)

#### AdminPage - Dashboard
- **Access**: Admin + Owner only
- **Actions**:
  - **Admin/Owner**: 
    - View all users, journals, entries
    - Search across all content
    - User management dashboard
    - System statistics and monitoring
    - Delete/manage content
    - View users marked for deletion

#### JournalCreateFormPage - Journal Create
- **Access**: Admin + Owner only
- **Actions**:
  - **Admin/Owner**: 
    - Create new journals
    - Set publication settings
    - Assign editors
    - Upload journal files and metadata

#### JournalEditFormPage - Journal Edit
- **Access**: Admin + Owner only
- **Actions**:
  - **Admin/Owner**: 
    - Edit journal information
    - Change publication status
    - Manage editors
    - Update journal files and settings

#### CreateUserPage - User Create
- **Access**: Admin + Owner only
- **Actions**:
  - **Admin/Owner**: 
    - Create new user accounts
    - Set user roles
    - Set authorization status
    - Configure user details

#### EditUserPage - User Edit
- **Access**: Admin + Owner only
- **Actions**:
  - **Admin/Owner**: 
    - Edit user information
    - Change user roles
    - Update authorization status
    - Manage user settings
    - Transfer user data
    - Mark users for deletion

---

## Backend API Access Control

### Entry Management
- **Create/Edit/Delete entries**: Authors (own entries), Editors (journal entries), Admin/Owner (all)
- **View entries**: Authors, Referees (assigned), Editors (journal entries), Admin/Owner (all), Public (published)
- **Manage author/referee assignments**: Editors, Admin/Owner

### User Management  
- **View all users**: Admin/Owner only
- **Edit user roles**: Admin/Owner only
- **Delete users**: Admin/Owner only
- **View user profiles**: Public (basic info), User (own full profile), Admin/Owner (any profile)

### Journal Management
- **Create/Edit journals**: Admin/Owner only
- **Publish journals**: Admin/Owner only
- **Assign editors**: Admin/Owner only
- **View published journals**: Public access
- **View draft journals**: Editor (assigned), Admin/Owner

### Update System
- **Author updates**: Entry authors, Admin/Owner
- **Referee updates**: Assigned referees, Admin/Owner
- **View updates**: Authors, Referees (assigned), Editors, Admin/Owner

## Email Notifications System
The system automatically sends emails for:
- **Registration confirmation**: All new users
- **Password reset**: All users requesting reset
- **Auto-login links**: Admin-generated for users
- **Assignment notifications**: When referees are assigned
- **Update notifications**: When authors/referees submit updates
- **Status change notifications**: When entry status changes

This role-based access control ensures proper separation of concerns and maintains security while allowing appropriate collaboration between authors, referees, editors, and administrators.