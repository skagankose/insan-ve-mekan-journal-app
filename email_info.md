# 📧 Email System Documentation

## Overview

The project uses **Brevo (formerly Sendinblue)** as the email service provider, with emails sent from `no-reply@humanand.space`. All emails now feature a modern, responsive design with bilingual support (English and Turkish) and include the application's black logo.

## 🎨 Design Features

- **Modern responsive design** with professional styling
- **Clean typography** - Uses modern font stack: system-ui, Segoe UI, Roboto, Helvetica Neue, Inter, Arial
- **Bilingual support** - All emails display content in both English and Turkish
- **Brand consistency** - Features the Human and Space black logo and color scheme
- **Mobile-friendly** - Responsive design that works on all devices
- **Gradient headers** with dark theme matching the application
- **Styled buttons** and highlight boxes for better user experience
- **Status badges** for visual status change indicators

## 🎯 Email Types and Triggers

### 1. **Email Confirmation (User Registration)**
**File:** `backend/app/email_utils.py` (lines 50-150)
- **Trigger:** When a new user registers an account
- **Subject (EN):** "Confirm your email address | E-posta adresinizi onaylayın"
- **Subject (TR):** "E-posta Adresinizi Onaylayın"
- **Recipients:** New user
- **Content:** Bilingual welcome message with styled email verification button
- **Languages:** Both English and Turkish in same email
- **Link expires:** Not specified in code
- **Called from:** `backend/app/routers/auth.py` (lines 78-93) - `register` endpoint

### 2. **Password Reset**
**File:** `backend/app/email_utils.py` (lines 152-240)
- **Trigger:** When user requests password reset via "Forgot Password"
- **Subject (EN):** "Reset Your Password | Şifrenizi sıfırlayın"
- **Subject (TR):** "Şifrenizi Sıfırlayın"
- **Recipients:** User requesting reset
- **Content:** Bilingual password reset with styled button and security info
- **Languages:** Both English and Turkish in same email
- **Link expires:** 15 minutes
- **Called from:** `backend/app/routers/auth.py` (lines 307-321) - `forgot_password` endpoint

### 3. **Author Update Notifications**
**File:** `backend/app/email_utils.py` (lines 242-330)
- **Trigger:** When an author creates an update (with or without file) to a journal entry
- **Subject (EN):** "Author Update: {entry_title} | Yazar güncellemesi"
- **Subject (TR):** "Yazar Güncellemesi: {entry_title}"
- **Recipients:** All referees and editors associated with the journal entry
- **Content:** 📝 Bilingual notification with entry details and review button
- **Languages:** Both English and Turkish in same email
- **Called from:** 
  - `backend/app/routers/entries.py` (lines 295-301) - `create_author_update`
  - `backend/app/routers/entries.py` (lines 399-405) - `create_author_update_with_file`

### 4. **Referee Update Notifications**
**File:** `backend/app/email_utils.py` (lines 332-420)
- **Trigger:** When a referee creates an update (with or without file) to a journal entry
- **Subject (EN):** "Referee Review: {entry_title} | Hakem değerlendirmesi"
- **Subject (TR):** "Hakem Değerlendirmesi: {entry_title}"
- **Recipients:** All authors and editors associated with the journal entry
- **Content:** ⚖️ Bilingual notification with referee feedback details
- **Languages:** Both English and Turkish in same email
- **Called from:**
  - `backend/app/routers/entries.py` (lines 485-491) - `create_referee_update`
  - `backend/app/routers/entries.py` (lines 564-570) - `create_referee_update_with_file`

### 5. **Referee Assignment Notifications**
**File:** `backend/app/email_utils.py` (lines 422-510)
- **Trigger:** When a referee is assigned to a journal entry (by admin or editor)
- **Subject (EN):** "Referee Assigned: {entry_title} | Hakem atandı"
- **Subject (TR):** "Hakem Atandı: {entry_title}"
- **Recipients:** All authors of the journal entry
- **Content:** 👨‍🎓 Bilingual notification about referee assignment with progress tracking
- **Languages:** Both English and Turkish in same email
- **Called from:**
  - `backend/app/routers/admin.py` (lines 681-716) - `add_entry_referee`
  - `backend/app/routers/editors.py` (lines 602-632) - `add_entry_referee`
  - `backend/app/crud.py` (lines 165-203) - `update_entry` (when new referees added)

### 6. **Status Update Notifications**
**File:** `backend/app/email_utils.py` (lines 512-620)
- **Trigger:** When a journal entry status changes (e.g., from "pending" to "accepted")
- **Subject (EN):** "Status Update: {entry_title} | Durum güncellemesi"
- **Subject (TR):** "Durum Güncellemesi: {entry_title}"
- **Recipients:** All authors and referees associated with the entry
- **Content:** 📊 Bilingual notification with visual status change badges
- **Languages:** Both English and Turkish in same email
- **Status types:** waiting_for_payment, waiting_for_authors, waiting_for_referees, waiting_for_editors, accepted, not_accepted, rejected, pending
- **Visual badges:** Color-coded status indicators (red → green)
- **Called from:** `backend/app/crud.py` (lines 205-264) - `update_entry` (when status changes)

### 7. **Login Link Email (Admin Function)**
**File:** `backend/app/email_utils.py` (lines 622-710)
- **Trigger:** When an admin sends a login link to a user manually
- **Subject (EN):** "Your Login Link | Giriş bağlantınız"
- **Subject (TR):** "Giriş Bağlantınız"
- **Recipients:** Specified user (can use custom email or user's registered email)
- **Content:** 🔑 Bilingual temporary access with security warnings
- **Languages:** Both English and Turkish in same email
- **Link expires:** 6 months
- **Called from:** Frontend admin interface `frontend/src/pages/EditUserPage.tsx` (lines 562-578)

## 🔄 Email Notification Flow

### Author Update Flow:
1. Author creates update → `notification_utils.notify_on_author_update`
2. Sends emails to: All referees + Editor-in-chief + All journal editors
3. Excludes: The author who made the update

### Referee Update Flow:
1. Referee creates update → `notification_utils.notify_on_referee_update`
2. Sends emails to: All authors + Editor-in-chief + All journal editors  
3. Excludes: The referee who made the update

### Status Change Flow:
1. Entry status updated → `crud.update_entry`
2. Sends emails to: All authors + All referees
3. Includes: Status change details (from → to)

## ⚙️ Technical Configuration

- **Email Service:** Brevo (Sendinblue) API
- **API Key:** Environment variable `BREVO_API_KEY`
- **Sender Name:** "İnsan ve Mekan / Human and Space"
- **Sender Email:** no-reply@humanand.space
- **Logo Setup:** 
  - Logo file: `frontend/public/logo_black.png`
  - **IMPORTANT:** Update `LOGO_URL` in `email_utils.py` to your hosted logo URL
  - Current placeholder: `https://your-domain.com/logo_black.png`
- **Language Support:**
  - Default: English (`language="en"`)
  - Turkish: `language="tr"`
  - All emails display both languages by default
- **Frontend URLs:** 
  - Email confirmation: `http://localhost:8000`
  - Password reset: `http://localhost:5173`
  - General links: `http://localhost:5173`
- **Error Handling:** Email failures don't break main operations, just logged
- **Email Format:** Responsive HTML emails with CSS styling and modern design
- **Typography:** Modern font stack for clean readability: `system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Inter', 'Arial', sans-serif`
- **Template System:** Centralized template function `get_email_template()` for consistency

## 📱 Frontend Integration

The frontend has dedicated pages for:
- `frontend/src/pages/EmailConfirmationPage.tsx` - Email confirmation handling
- `frontend/src/pages/ForgotPasswordPage.tsx` - Password reset request
- `frontend/src/pages/EditUserPage.tsx` - Admin login link sending

## 📋 Email Templates

### Email Confirmation Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>Thanks for signing up! Please click the link below to confirm your email address:</p>
        <p><a href="{confirmation_link}">Confirm Email</a></p>
        <p>If you did not sign up for this account, you can ignore this email.</p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

### Password Reset Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link is valid for 15 minutes.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

### Author Update Notification Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>The author <strong>{author_name}</strong> has made an update to the journal entry:</p>
        <p><strong>{entry_title}</strong></p>
        <p>You can view the update by clicking the link below:</p>
        <p><a href="{entry_url}">View Update</a></p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

### Referee Update Notification Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>The referee <strong>{referee_name}</strong> has made an update to the journal entry:</p>
        <p><strong>{entry_title}</strong></p>
        <p>You can view the update by clicking the link below:</p>
        <p><a href="{entry_url}">View Update</a></p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

### Referee Assignment Notification Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>A referee has been assigned to your journal entry:</p>
        <p><strong>{entry_title}</strong></p>
        <p>The assigned referee is: <strong>{referee_name}</strong></p>
        <p>You can view your entry by clicking the link below:</p>
        <p><a href="{entry_url}">View Entry</a></p>
        <p>The referee will now review your submission and provide feedback.</p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

### Status Update Notification Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>The status of your journal entry has been updated:</p>
        <p><strong>{entry_title}</strong></p>
        <p>Status changed from: <strong>{old_status_display}</strong> to: <strong>{new_status_display}</strong></p>
        <p>You can view your entry by clicking the link below:</p>
        <p><a href="{entry_url}">View Entry</a></p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

### Login Link Template
```html
<html>
    <body>
        <h1>Hi {user_name},</h1>
        <p>You have been provided with a temporary login link:</p>
        <p><a href="{login_link}">Click here to login</a></p>
        <p>This link will expire in 6 months.</p>
        <p>If you did not request this link, please contact the administrator.</p>
        <p>Thanks,</p>
        <p>The Human and Space Team</p>
    </body>
</html>
```

## 🔧 Setup Instructions

### Logo Configuration
1. **Host your logo:** Upload `frontend/public/logo_black.png` to a publicly accessible URL
2. **Update the logo URL:** In `backend/app/email_utils.py`, change:
   ```python
   LOGO_URL = "https://your-domain.com/logo_black.png"  # Replace with actual hosted logo URL
   ```
3. **Alternative:** Use base64 encoding for the logo if you prefer embedding it directly

### Language Configuration
All email functions now accept a `language` parameter:
```python
send_confirmation_email(
    api_key=api_key,
    user_email=user_email,
    user_name=user_name,
    confirmation_token=token,
    language="tr"  # "en" for English, "tr" for Turkish
)
```

## 🚨 Important Notes

1. **Email failures are non-blocking:** If email sending fails, the main operation (registration, update creation, etc.) still succeeds
2. **Error logging:** All email failures are logged for debugging
3. **Environment dependency:** Email functionality requires `BREVO_API_KEY` environment variable
4. **✅ NEW: Full bilingual support:** All emails display content in both English and Turkish
5. **✅ NEW: Responsive design:** Emails work perfectly on mobile devices
6. **✅ NEW: Brand consistency:** All emails use the application's logo and color scheme
7. **No email rate limiting:** The system doesn't implement rate limiting for email sending
8. **Logo dependency:** Emails require a hosted logo URL to display properly

## 🆕 Recent Improvements

- **Modern Design:** Complete visual overhaul with professional styling
- **Clean Typography:** Upgraded to modern font stack with system fonts and clean fallbacks
- **Bilingual Content:** Every email shows both English and Turkish text
- **Brand Integration:** Consistent use of logo and color scheme
- **Enhanced UX:** Better buttons, highlights, and visual elements
- **Status Indicators:** Color-coded badges for status changes
- **Mobile Optimization:** Responsive design for all screen sizes
- **Accessibility:** Better contrast and readable fonts

All email functionality is fully integrated with the journal submission and review workflow, ensuring stakeholders stay informed throughout the process with a professional, branded experience. 