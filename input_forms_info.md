# 📝 User Input Forms Documentation

Based on comprehensive analysis of the codebase, here are all the forms that users can input data into:

## 🔐 **Authentication & User Management Forms**

### 1. **Registration Form** (`RegisterPage.tsx`)
- **Fields**: Email*, Name*, Title, Biography, Phone (Country Code + Number), Science Branch, Country, Location, YÖKSİS ID, ORCID ID, Password*, Confirm Password*, reCAPTCHA*
- **Purpose**: New user account creation
- **Validation**: Email format, password strength, phone number format, ID validations

### 2. **Login Form** (`LoginPage.tsx`)
- **Fields**: Email*, Password*
- **Purpose**: User authentication
- **Features**: Show/hide password toggle, Google OAuth integration

### 3. **Forgot Password Form** (`ForgotPasswordPage.tsx`)
- **Fields**: Email*
- **Purpose**: Request password reset link
- **Output**: Sends reset email to user

### 4. **Reset Password Form** (`ResetPasswordPage.tsx`)
- **Fields**: New Password*, Confirm Password*
- **Purpose**: Set new password using reset token
- **Validation**: Password strength requirements

### 5. **Profile Edit Form** (`ProfileEditPage.tsx`)
- **Fields**: Name*, Email*, Title, Biography, Phone, Science Branch, Country, Location, YÖKSİS ID, ORCID ID
- **Purpose**: Update user profile information
- **Features**: Specialized input components for IDs and location

### 6. **Password Change Form** (`ProfileEditPage.tsx`)
- **Fields**: Current Password*, New Password*, Confirm New Password*
- **Purpose**: Change user password while logged in
- **Features**: Expandable section, password strength validation

## 👥 **Admin User Management Forms**

### 7. **Create User Form** (`CreateUserPage.tsx`)
- **Fields**: Email*, Name*, Title, Biography, Phone, Science Branch, Country, Location, YÖKSİS ID, ORCID ID, Role*, Password*, Confirm Password*, Auth Status
- **Purpose**: Admin creation of new user accounts
- **Access**: Admin/Owner only

### 8. **Edit User Form** (`EditUserPage.tsx`)
- **Fields**: Same as Create User but without password fields
- **Purpose**: Admin editing of existing user accounts
- **Access**: Admin/Owner only

## 📚 **Journal Management Forms**

### 9. **Journal Creation Form** (`JournalCreateFormPage.tsx`)
- **Fields**: Title (Turkish)*, Title (English), Issue*, Issue (English), Publication Status
- **Purpose**: Create new journal issues
- **Access**: Admin/Editor

### 10. **Journal Edit Form** (`JournalEditFormPage.tsx`)
- **Fields**: Title (Turkish)*, Title (English), Issue*, Issue (English), Publication Date, Publication Place, Editor Notes
- **Purpose**: Edit existing journal information
- **Access**: Admin/Editor

### 11. **Journal Details Management** (`JournalEditPage.tsx`)
- **Fields**: File uploads (Cover Photo, Meta Files, Full PDF, Index Section), Publication settings
- **Purpose**: Manage journal files and publication details
- **Features**: File upload with validation

## 📄 **Journal Entry Forms**

### 12. **Journal Entry Form** (`JournalForm.tsx` component)
- **Fields**: Title (Turkish)*, Title (English)*, Abstract (Turkish)*, Abstract (English)*, Keywords*, Keywords (English)*
- **Purpose**: Create/edit journal entries
- **Used in**: Multiple pages for entry creation and editing

### 13. **Author Update Form** (`AuthorUpdateFormPage.tsx`)
- **Fields**: Title, Abstract (English), Abstract (Turkish), Keywords, Keywords (English), Notes, File Upload
- **Purpose**: Authors submit updates/revisions to their entries
- **Features**: File upload with DOCX validation

### 14. **Referee Update Form** (`RefereeUpdateFormPage.tsx`)
- **Fields**: Review Notes*, File Upload
- **Purpose**: Referees submit reviews and feedback
- **Features**: File upload with DOCX validation, extensive text area

## 🔍 **Search & Filter Forms**

### 15. **Global Admin Search** (`AdminPage.tsx`)
- **Fields**: Search input
- **Purpose**: Search across users, journals, and entries
- **Features**: Real-time filtering, clear button

### 16. **Editor Search** (`JournalDetailsPage.tsx`)
- **Fields**: Editor name search
- **Purpose**: Search for editors when assigning to journals
- **Features**: Modal-based search with filtering

------------------------------------------------------------

### 17. **Country Selector** (`CountrySelector.tsx`)
- **Fields**: Country search/selection
- **Purpose**: Used across multiple forms for country selection
- **Features**: Searchable dropdown with flags

## 🧩 **Specialized Input Components**

### 18. **Formatted ID Inputs** (`FormattedIdInput.tsx`)
- **Types**: YÖKSİS ID, ORCID ID
- **Features**: Auto-formatting, validation, pattern enforcement
- **Used in**: All user-related forms

### 19. **Location Input** (`LocationInput.tsx`)
- **Purpose**: Geographic location entry
- **Features**: Text input with location-specific placeholder

### 20. **Phone Input Components**
- **Fields**: Country code + Phone number
- **Features**: Flag display, country code validation
- **Used in**: User registration and profile forms

## 📁 **File Upload Forms**

Multiple forms include file upload capabilities:
- **Journal cover photos** (image files: .png, .jpg, .jpeg)
- **Document uploads** (.docx files)
- **PDF uploads** (.pdf files)
- **Meta files and index sections**

## ✨ **Form Features Across the Application**

- **Validation**: Client-side and server-side validation
- **Internationalization**: Turkish/English support
- **Error Handling**: Comprehensive error messages
- **Loading States**: Disabled states during submission
- **Auto-formatting**: For IDs, phone numbers
- **File Type Validation**: Specific file type restrictions
- **Password Strength**: Requirements and visual feedback
- **reCAPTCHA**: Spam protection on registration
- **Responsive Design**: Mobile-friendly layouts

## 📊 **Form Summary**

| Category | Number of Forms | Key Features |
|----------|----------------|--------------|
| Authentication | 6 | Password validation, OAuth, reCAPTCHA |
| Admin Management | 2 | Role-based access, comprehensive user data |
| Journal Management | 3 | File uploads, publication workflow |
| Journal Entries | 3 | Multi-language support, peer review |
| Search & Filter | 3 | Real-time filtering, advanced search |
| Specialized Components | 3 | Custom validation, auto-formatting |

## 🔗 **Backend Form Schemas**

The backend uses Pydantic schemas for form validation:
- **UserCreate, UserUpdate** (`backend/app/schemas.py`)
- **JournalCreate, JournalUpdate** (`backend/app/models.py`)
- **AuthorUpdateCreate, RefereeUpdateCreate** (`backend/app/models.py`)
- **Password reset and change schemas** (`backend/app/routers/auth.py`)

All forms use consistent styling through shared CSS classes and follow the same interaction patterns for a cohesive user experience.

---

*Note: Fields marked with * are required fields. This documentation covers all interactive forms where users can input, edit, or submit data.* 