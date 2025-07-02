# 📧 Email System Documentation

## Overview

The project uses **Brevo (formerly Sendinblue)** as the email service provider, with emails sent from `admin@insanvemekan.com`. All emails are now in simple plain text format with bilingual support - Turkish content always appears first, followed by English content.

## 🎯 Design Features

- **Plain text format** - Simple, clean text-only emails without HTML styling
- **Bilingual support** - All emails display content in Turkish first, then English
- **Clear structure** - Easy-to-read format with clear section dividers
- **Consistent branding** - Simple header and footer with organization name
- **No dependencies** - No external resources or complex formatting required

## 🎯 Email Types and Triggers

### 1. **Email Confirmation (User Registration)**
**File:** `backend/app/email_utils.py` (lines 50-150)
- **Trigger:** When a new user registers an account
- **Subject (EN):** "Confirm your email address | E-posta adresinizi onaylayın"
- **Subject (TR):** "E-posta Adresinizi Onaylayın"
- **Recipients:** New user
- **Content:** Bilingual welcome message with email verification link (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Link expires:** Not specified in code
- **Called from:** `backend/app/routers/auth.py` (lines 78-93) - `register` endpoint

### 2. **Password Reset**
**File:** `backend/app/email_utils.py` (lines 152-240)
- **Trigger:** When user requests password reset via "Forgot Password"
- **Subject (EN):** "Reset Your Password | Şifrenizi sıfırlayın"
- **Subject (TR):** "Şifrenizi Sıfırlayın"
- **Recipients:** User requesting reset
- **Content:** Bilingual password reset with link and security info (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Link expires:** 15 minutes
- **Called from:** `backend/app/routers/auth.py` (lines 307-321) - `forgot_password` endpoint

### 3. **Author Update Notifications**
**File:** `backend/app/email_utils.py` (lines 242-330)
- **Trigger:** When an author creates an update (with or without file) to a journal entry
- **Subject (EN):** "Author Update: {entry_title} | Yazar güncellemesi"
- **Subject (TR):** "Yazar Güncellemesi: {entry_title}"
- **Recipients:** All referees and editors associated with the journal entry
- **Content:** Bilingual notification with entry details and review link (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Called from:** 
  - `backend/app/routers/entries.py` (lines 295-301) - `create_author_update`
  - `backend/app/routers/entries.py` (lines 399-405) - `create_author_update_with_file`

### 4. **Referee Update Notifications**
**File:** `backend/app/email_utils.py` (lines 332-420)
- **Trigger:** When a referee creates an update (with or without file) to a journal entry
- **Subject (EN):** "Referee Review: {entry_title} | Hakem değerlendirmesi"
- **Subject (TR):** "Hakem Değerlendirmesi: {entry_title}"
- **Recipients:** All authors and editors associated with the journal entry
- **Content:** Bilingual notification with referee feedback details (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Called from:**
  - `backend/app/routers/entries.py` (lines 485-491) - `create_referee_update`
  - `backend/app/routers/entries.py` (lines 564-570) - `create_referee_update_with_file`

### 5. **Referee Assignment Notifications**
**File:** `backend/app/email_utils.py` (lines 422-510)
- **Trigger:** When a referee is assigned to a journal entry (by admin or editor)
- **Subject (EN):** "Referee Assigned: {entry_title} | Hakem atandı"
- **Subject (TR):** "Hakem Atandı: {entry_title}"
- **Recipients:** All authors of the journal entry
- **Content:** Bilingual notification about referee assignment with progress tracking (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
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
- **Content:** Bilingual notification with status change details (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Status types:** waiting_for_payment, waiting_for_authors, waiting_for_referees, waiting_for_editors, accepted, not_accepted, rejected, pending
- **Called from:** `backend/app/crud.py` (lines 205-264) - `update_entry` (when status changes)

### 7. **Journal Editor Assignment Notifications**
**File:** `backend/app/email_utils.py` (lines 640-730)
- **Trigger:** When an editor is assigned to a journal (by admin)
- **Subject (EN):** "Journal Editor Assignment: {journal_title} | Dergi editörlüğüne atandınız"
- **Subject (TR):** "Dergi Editörlüğüne Atandınız: {journal_title}"
- **Recipients:** The editor being assigned to the journal
- **Content:** Bilingual notification with journal details and responsibilities (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Called from:** `backend/app/routers/admin.py` (lines 495-511) - `add_journal_editor`

### 8. **Referee Assignment to Referee Notifications**
**File:** `backend/app/email_utils.py` (lines 732-830)
- **Trigger:** When a referee is assigned to a journal entry (by admin or editor)
- **Subject (EN):** "Referee Assignment: {entry_title} | Hakemlik göreviniz"
- **Subject (TR):** "Hakemlik Göreviniz: {entry_title}"
- **Recipients:** The referee being assigned to review the entry
- **Content:** Bilingual notification with entry details, author information, and review responsibilities (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
- **Called from:** 
  - `backend/app/routers/admin.py` (lines 681-716) - `add_entry_referee`
  - `backend/app/routers/editors.py` (lines 602-632) - `add_entry_referee_as_editor`

### 9. **Login Link Email (Admin Function)**
**File:** `backend/app/email_utils.py` (lines 832-920)
- **Trigger:** When an admin sends a login link to a user manually
- **Subject (EN):** "Your Login Link | Giriş bağlantınız"
- **Subject (TR):** "Giriş Bağlantınız"
- **Recipients:** Specified user (can use custom email or user's registered email)
- **Content:** Bilingual temporary access with security warnings (Turkish first, English second)
- **Languages:** Turkish first, then English in same email
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

### Referee Assignment Flow:
1. Referee assigned to entry → `add_entry_referee` or `add_entry_referee_as_editor`
2. Sends emails to: All authors (notifying them a referee was assigned) + The referee (informing them of assignment)
3. Includes: Entry details, author information, and review responsibilities

### Status Change Flow:
1. Entry status updated → `crud.update_entry`
2. Sends emails to: All authors + All referees
3. Includes: Status change details (from → to)

## ⚙️ Technical Configuration

- **Email Service:** Brevo (Sendinblue) API
- **API Key:** Environment variable `BREVO_API_KEY`
- **Sender Name:** "İnsan ve Mekan / Human and Space"
- **Sender Email:** admin@insanvemekan.com
- **Email Format:** Plain text format with simple structure
- **Language Support:**
  - Default: English (`language="en"`)
  - Turkish: `language="tr"`
  - All emails display Turkish content first, English content second
- **Frontend URLs:** 
  - Email confirmation: `http://localhost:8000`
  - Password reset: `http://localhost:5173`
  - General links: `http://localhost:5173`

## 📱 Frontend Integration

The frontend has dedicated pages for:
- `frontend/src/pages/EmailConfirmationPage.tsx` - Email confirmation handling
- `frontend/src/pages/ForgotPasswordPage.tsx` - Password reset request
- `frontend/src/pages/EditUserPage.tsx` - Admin login link sending

## 📋 Email Templates

All email templates follow this simple plain text structure:

### Base Template Structure
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

[EMAIL CONTENT]

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Email Confirmation Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

TÜRKÇE
------
Hoş geldiniz, [user_name]!

İnsan ve Mekan'a kaydolduğunuz için teşekkür ederiz! E-posta adresinizi onaylamak ve hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayın:

E-posta: [user_email]

E-posta Onaylama Bağlantısı:
[confirmation_link]

Bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.


ENGLISH
-------
Welcome, [user_name]!

Thanks for signing up for Human and Space! Please click the link below to confirm your email address and activate your account:

Email: [user_email]

Email Confirmation Link:
[confirmation_link]

If you did not create this account, you can safely ignore this email.

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Password Reset Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

TÜRKÇE
------
Şifre Sıfırlama İsteği

Merhaba [user_name],

İnsan ve Mekan hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki bağlantıya tıklayın:

Hesap: [user_email]
Geçerlilik süresi: 15 dakika

Şifre Sıfırlama Bağlantısı:
[reset_link]

Şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelin. Şifreniz değişmeden kalacaktır.


ENGLISH
-------
Password Reset Request

Hi [user_name],

We received a request to reset your password for your Human and Space account. Click the link below to create a new password:

Account: [user_email]
Valid for: 15 minutes

Password Reset Link:
[reset_link]

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Author Update Notification Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

TÜRKÇE
------
Yeni Yazar Güncellemesi

Merhaba [user_name],

[author_name] dergi makalesinde güncelleme yaptı:

Makale Başlığı: [entry_title]
Yazar: [author_name]
Makale No: #[entry_id]

Güncellemeyi görüntülemek ve değerlendirmenizi yapmak için aşağıdaki bağlantıya tıklayın:
[entry_url]


ENGLISH
-------
New Author Update

Hi [user_name],

The author [author_name] has made an update to the journal entry:

Entry Title: [entry_title]
Author: [author_name]
Entry ID: #[entry_id]

You can view the complete update and provide your review by clicking the link below:
[entry_url]

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Referee Update Notification Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformü

TÜRKÇE
------
Yeni Hakem Değerlendirmesi

Merhaba [user_name],

[referee_name] dergi makalesi için değerlendirme yaptı:

Makale Başlığı: [entry_title]
Hakem: [referee_name]
Makale No: #[entry_id]

Hakemin geri bildirimlerini ve önerilerini görüntülemek için aşağıdaki bağlantıya tıklayın:
[entry_url]


ENGLISH
-------
New Referee Review

Hi [user_name],

The referee [referee_name] has submitted a review for the journal entry:

Entry Title: [entry_title]
Referee: [referee_name]
Entry ID: #[entry_id]

You can view the referee's feedback and recommendations by clicking the link below:
[entry_url]

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Referee Assignment Notification Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

TÜRKÇE
------
Makalenize Hakem Atandı

Merhaba [user_name],

Dergi başvurunuzu değerlendirmek üzere bir hakem atandı:

Makaleniz: [entry_title]
Atanan Hakem: [referee_name]
Makale No: #[entry_id]

İnceleme süreci başladı. Hakem, başvurunuzu dikkatlice değerlendirecek ve detaylı geri bildirim sağlayacaktır. Başvurunuzun ilerleyişini aşağıdaki bağlantıdan takip edebilirsiniz:
[entry_url]

Hakem değerlendirmesini tamamladığında sizi tekrar bilgilendireceğiz.


ENGLISH
-------
Referee Assigned to Your Submission

Hi [user_name],

A referee has been assigned to review your journal submission:

Your Entry: [entry_title]
Assigned Referee: [referee_name]
Entry ID: #[entry_id]

The review process has now begun. The referee will carefully evaluate your submission and provide detailed feedback. You can track the progress of your submission by clicking below:
[entry_url]

We will notify you as soon as the referee completes their review.

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Status Update Notification Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

TÜRKÇE
------
Başvuru Durumu Güncellemesi

Merhaba [user_name],

Dergi başvurunuzun durumu güncellendi:

Makale Başlığı: [entry_title]
Makale No: #[entry_id]
Durum Değişikliği: [old_status] → [new_status]

Başvurunuzun tüm detaylarını ve ek bilgileri görüntülemek için aşağıdaki bağlantıya tıklayın:
[entry_url]


ENGLISH
-------
Submission Status Update

Hi [user_name],

The status of your journal submission has been updated:

Entry Title: [entry_title]
Entry ID: #[entry_id]
Status Change: [old_status] → [new_status]

You can view the complete details of your submission and any additional information by clicking below:
[entry_url]

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

### Login Link Template
```
İNSAN ve MEKAN
Human and Space
Akademi Platformu

TÜRKÇE
------
Geçici Giriş Erişimi

Merhaba [user_name],

İnsan ve Mekan hesabınıza erişim için geçici bir giriş bağlantısı sağlandı:

Hesap: [user_email]
Geçerlilik süresi: 6 ay

Giriş Bağlantısı:
[login_link]

Bu bağlantı, şifre gerektirmeden hesabınıza doğrudan erişim sağlar. Lütfen güvenli tutun ve başkalarıyla paylaşmayın.

Bu giriş bağlantısını talep etmediyseniz, lütfen hemen yöneticiyle iletişime geçin.


ENGLISH
-------
Temporary Login Access

Hi [user_name],

You have been provided with a temporary login link to access your Human and Space account:

Account: [user_email]
Valid for: 6 months

Login Link:
[login_link]

This link provides direct access to your account without requiring a password. Please keep it secure and do not share it with others.

If you did not request this login link, please contact the administrator immediately.

---
© 2025 İnsan ve Mekan | Human and Space
Akademi Platformu
```

## 🔧 Setup Instructions

### Language Configuration
All email functions accept a `language` parameter:
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
4. **✅ Bilingual support:** All emails display Turkish content first, followed by English content
5. **✅ Plain text format:** All emails are now simple text without HTML styling
6. **✅ Consistent structure:** All emails follow the same format with header and footer
7. **No email rate limiting:** The system doesn't implement rate limiting for email sending

## 🆕 Recent Changes

- **Plain Text Format:** Completely removed HTML styling and switched to plain text
- **Turkish First:** All bilingual content now shows Turkish first, English second
- **Simplified Structure:** Clean, readable format with clear section dividers
- **No Dependencies:** Removed all external resources, logos, and complex formatting
- **Consistent Layout:** All emails follow the same simple template structure

All email functionality is fully integrated with the journal submission and review workflow, ensuring stakeholders stay informed throughout the process with clear, simple communication. 