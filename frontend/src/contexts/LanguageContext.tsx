import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the translation type
type TranslationKeys = 
  | 'home' | 'newEntry' | 'login' | 'register' | 'logout' | 'welcome' | 'myJournal' | 'navigation'
  | 'createNewEntry' | 'editEntry' | 'createAccount' | 'welcomeBack'
  | 'title' | 'content' | 'username' | 'password' | 'email' | 'fullName'
  | 'createEntry' | 'updateEntry' | 'delete' | 'edit' | 'loginButton' | 'registerButton'
  | 'noEntries' | 'createEntryPrompt' | 'entrySavedSecurely' | 'alreadyHaveAccount' | 'dontHaveAccount'
  | 'signUp' | 'loginText' | 'pleaseLogin' | 'loadingEntries'
  | 'enterTitle' | 'writeThoughts' | 'enterUsername' | 'enterPassword'
  | 'saving' | 'signingIn' | 'creatingAccount'
  | 'language' | 'turkish' | 'english'
  | 'abstract' | 'enterAbstract' | 'type' | 'submitted' | 'reviewed' | 'isAccepted'
  | 'name' | 'bio' | 'role' | 'loading' | 'adminDashboard' | 'userManagement' | 'totalUsers'
  | 'writer' | 'editor' | 'arbitrator' | 'admin' | 'owner'
  | 'publicationDate' | 'isPublished' | 'editJournal' | 'updateJournal' | 'accessDeniedAdminOnly'
  | 'theme' | 'lightMode' | 'darkMode' | 'switchToDark' | 'switchToLight'
  | 'previousIssues' | 'publishedJournals' | 'acceptedEntries'
  | 'createUser' | 'userCreatedSuccessfully' | 'cancel' | 'editUser' | 'userUpdatedSuccessfully'
  | 'directLogin' | 'directLoginDescription' | 'generateLoginLink' | 'copyLink' | 'linkCopied' | 'generating' | 'saveChanges'
  | 'invalidLoginLink' | 'loginFailed' | 'autoLoginFailed' | 'autoLoginProcessing' | 'loginError' | 'goToLogin' | 'loginSuccessful' | 'redirecting'
  | 'loginSuccessButUserInfoFailed'
  | 'profile' | 'userProfile' | 'myJournalEntries' | 'noEntriesFound' | 'loadingUserData' | 'failedToLoadUserEntries'
  | 'biography' | 'scienceBranch' | 'location' | 'telephone' | 'yoksisId' | 'orcidId' | 'journalId' | 'date'
  | 'myRefereeEntries' | 'noRefereeEntriesFound' | 'myEditedJournals' | 'noEditedJournalsFound' | 'issue'
  | 'passwordRequirements' | 'passwordMinLength' | 'passwordCase' | 'passwordNumber' | 'passwordMatch' | 'confirmPassword'
  | 'changePassword' | 'currentPassword' | 'newPassword' | 'passwordUpdated' | 'changingPassword'
  | 'statusWaitingForPayment' | 'statusWaitingForAuthors' | 'statusWaitingForReferees' | 'statusWaitingForEditors' | 'statusAccepted' | 'statusNotAccepted'
  | 'published' | 'or' | 'locale' | 'googleSignIn' | 'googleSignInFailed'
  | 'pageNotFoundTitle' | 'pageNotFoundDescription' | 'exploreJournalsText' | 'searchContentText'
  | 'forgotPassword' | 'forgotPasswordInstructions' | 'passwordResetLinkSent' | 'backToLogin' | 'enterEmail' | 'sendResetLink' | 'rememberPassword'
  | 'resetPassword' | 'passwordResetSuccess' | 'redirectingToLogin' | 'enterNewPassword' | 'confirmNewPassword' | 'resetting'
  | 'createAccountHere'
  | 'country' | 'selectCountry' | 'searchCountries' | 'noCountriesFound' | 'enterLocation'
  | 'pleaseVerifyCaptcha' | 'captchaExpired'
  | 'editorJournals' | 'submitPaper' | 'publishedIssues' | 'searchPlaceholder';

type TranslationDictionary = Record<TranslationKeys, string>;

// English and Turkish translations
const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Navigation
    'home': 'Home',
    'newEntry': 'New Entry',
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'welcome': 'Welcome',
    'myJournal': 'My Journal',
    'navigation': 'Navigation',
    'previousIssues': 'Previous Issues',
    'editorJournals': 'Editor Journals',
    'submitPaper': 'Submit Paper',
    'publishedIssues': 'Published Issues',
    
    // Page titles
    'createNewEntry': 'Create New Journal Entry',
    'editEntry': 'Edit Journal Entry',
    'createAccount': 'Create an Account',
    'welcomeBack': 'Welcome Back',
    'publishedJournals': 'Published Journals',
    
    // Form labels
    'title': 'Title',
    'content': 'Content',
    'username': 'Username',
    'password': 'Password',
    'email': 'Email Address',
    'fullName': 'Full Name (Optional)',
    'abstract': 'Abstract',
    'type': 'Type',
    'submitted': 'Submitted',
    'reviewed': 'Reviewed',
    'isAccepted': 'Is Accepted',
    'name': 'Name',
    'bio': 'Bio',
    'role': 'Role',
    
    // Buttons
    'createEntry': 'Create Entry',
    'updateEntry': 'Update Entry',
    'delete': 'Delete',
    'edit': 'Edit',
    'loginButton': 'Log In',
    'registerButton': 'Register',
    
    // Messages
    'noEntries': 'No Journal Entries Yet',
    'createEntryPrompt': 'Click the "Create New Entry" button to start journaling!',
    'entrySavedSecurely': 'Your entry will be saved securely and can be edited later.',
    'alreadyHaveAccount': 'Already have an account?',
    'dontHaveAccount': 'Don\'t have an account?',
    'signUp': 'Sign up',
    'loginText': 'Log in',
    'pleaseLogin': 'Please log in to view your journal entries.',
    'loadingEntries': 'Loading your journal entries...',
    'acceptedEntries': 'Accepted Entries',
    
    // Status labels
    'statusWaitingForPayment': 'Waiting for Payment',
    'statusWaitingForAuthors': 'Waiting for Authors',
    'statusWaitingForReferees': 'Waiting for Referees',
    'statusWaitingForEditors': 'Waiting for Editors',
    'statusAccepted': 'Accepted',
    'statusNotAccepted': 'Not Accepted',
    
    // Placeholders
    'enterTitle': 'Enter a title for your journal entry',
    'writeThoughts': 'Write your thoughts here...',
    'enterUsername': 'Enter your username',
    'enterPassword': 'Enter your password',
    'enterAbstract': 'Enter a brief summary...',
    
    // Status messages
    'saving': 'Saving...',
    'signingIn': 'Signing In...',
    'creatingAccount': 'Creating Account...',
    'loading': 'Loading...',

    // Admin page
    'adminDashboard': 'Admin Dashboard',
    'userManagement': 'Users',
    'totalUsers': 'Total users',

    // Language
    'language': 'Language',
    'turkish': 'Turkish',
    'english': 'English',

    // Roles
    'writer': 'Writer',
    'editor': 'Editor',
    'arbitrator': 'Arbitrator',
    'admin': 'Admin',
    'owner': 'Owner',

    // New translations
    'publicationDate': 'Publication Date',
    'isPublished': 'Publish Journal',
    'editJournal': 'Edit Journal',
    'updateJournal': 'Update Journal',
    'accessDeniedAdminOnly': 'Access Denied: Only administrators can perform this action.',

    // Theme
    'theme': 'Theme',
    'lightMode': 'Light Mode',
    'darkMode': 'Dark Mode',
    'switchToDark': 'Switch to dark mode',
    'switchToLight': 'Switch to light mode',

    // Admin actions
    'createUser': 'Create User',
    'userCreatedSuccessfully': 'User created successfully!',
    'editUser': 'Edit User',
    'userUpdatedSuccessfully': 'User updated successfully!',
    'cancel': 'Cancel',

    // Login link feature
    'directLogin': 'Direct Login Link',
    'directLoginDescription': 'Generate a temporary link that will automatically log in this user without requiring a password.',
    'generateLoginLink': 'Generate Login Link',
    'copyLink': 'Copy Link',
    'linkCopied': 'Link copied!',
    'generating': 'Generating...',
    'saveChanges': 'Save Changes',

    // Auto-login page
    'invalidLoginLink': 'Invalid login link. The link may have expired or been used already.',
    'loginFailed': 'Login failed. Please try again or contact support.',
    'autoLoginFailed': 'Automatic login failed. Please try logging in manually.',
    'autoLoginProcessing': 'Processing login...',
    'loginError': 'Login Error',
    'goToLogin': 'Go to Login Page',
    'loginSuccessful': 'Login Successful',
    'redirecting': 'You are being redirected to the homepage...',
    'loginSuccessButUserInfoFailed': 'Login successful but failed to retrieve user information. Please refresh the page.',
    
    // User Profile Page
    'profile': 'Profile',
    'userProfile': 'User Profile',
    'myJournalEntries': 'My Journal Entries',
    'noEntriesFound': 'No entries found.',
    'loadingUserData': 'Loading user data...',
    'failedToLoadUserEntries': 'Failed to load user entries.',
    'biography': 'Biography',
    'scienceBranch': 'Science Branch',
    'location': 'Location',
    'telephone': 'Telephone',
    'yoksisId': 'YÖKSİS ID',
    'orcidId': 'ORCID ID',
    'journalId': 'Journal ID',
    'date': 'Date',
    'myRefereeEntries': 'Entries I Referee',
    'noRefereeEntriesFound': 'No referee entries found.',
    'myEditedJournals': 'Journals I Edit',
    'noEditedJournalsFound': 'No journals found.',
    'issue': 'Issue',
    'published': 'Published',

    // Password requirements
    'passwordRequirements': 'Password must meet the following requirements:',
    'passwordMinLength': 'Must be at least 8 characters long',
    'passwordCase': 'Must contain both uppercase and lowercase letters',
    'passwordNumber': 'Must contain at least one number',
    'passwordMatch': 'Passwords must match',
    'confirmPassword': 'Confirm Password',

    // Password change
    'changePassword': 'Change Password',
    'currentPassword': 'Current Password',
    'newPassword': 'New Password',
    'passwordUpdated': 'Password updated successfully!',
    'changingPassword': 'Changing Password...',

    // New translations
    'or': 'OR',
    'locale': 'en',
    'googleSignIn': 'Sign in with Google',
    'googleSignInFailed': 'Google sign-in failed. Please try again.',
    
    // 404 Page
    'pageNotFoundTitle': 'Academic Resource Not Located',
    'pageNotFoundDescription': 'The requested academic resource could not be located within our scholarly database. This may occur when accessing outdated references, relocated content, or unpublished materials. We encourage you to explore our comprehensive archives and utilize our advanced search capabilities to discover relevant academic content.',
    'exploreJournalsText': 'Browse peer-reviewed publications',
    'searchContentText': 'Advanced academic search',
    
    // Forgot Password and Reset Password
    'forgotPassword': 'Forgot Password',
    'forgotPasswordInstructions': 'Enter your email address and we\'ll send you a link to reset your password.',
    'passwordResetLinkSent': 'Password reset link has been sent to your email address.',
    'backToLogin': 'Back to Login',
    'enterEmail': 'Enter your email address',
    'sendResetLink': 'Send Reset Link',
    'rememberPassword': 'Remember your password?',
    'resetPassword': 'Reset Password',
    'passwordResetSuccess': 'Your password has been reset successfully!',
    'redirectingToLogin': 'You will be redirected to the login page.',
    'enterNewPassword': 'Enter your new password',
    'confirmNewPassword': 'Confirm your new password',
    'resetting': 'Resetting...',
    'createAccountHere': 'Create Account Here',

    // Country and Location
    'country': 'Country',
    'selectCountry': 'Select country',
    'searchCountries': 'Search countries...',
    'noCountriesFound': 'No countries found',
    'enterLocation': 'Enter your location (e.g., Istanbul, Ankara, London)',

    // CAPTCHA
    'pleaseVerifyCaptcha': 'Please verify that you are human',
    'captchaExpired': 'CAPTCHA verification expired. Please verify again.',
    'searchPlaceholder': 'Search...',
  },
  tr: {
    // Navigation
    'home': 'Ana Sayfa',
    'newEntry': 'Yeni Kayıt',
    'login': 'Giriş Yap',
    'register': 'Kaydol',
    'logout': 'Çıkış Yap',
    'welcome': 'Hoş Geldiniz',
    'myJournal': 'Günlüğüm',
    'navigation': 'Navigasyon',
    'previousIssues': 'Önceki Sayılar',
    'editorJournals': 'Editör Dergileri',
    'submitPaper': 'Makale Gönder',
    'publishedIssues': 'Yayınlanlar',
    
    // Page titles
    'createNewEntry': 'Yeni Günlük Kaydı Oluştur',
    'editEntry': 'Günlük Kaydını Düzenle',
    'createAccount': 'Hesap Oluştur',
    'welcomeBack': 'Tekrar Hoş Geldiniz',
    'publishedJournals': 'Yayınlanmış Dergiler',
    
    // Form labels
    'title': 'Ünvan',
    'content': 'İçerik',
    'username': 'Kullanıcı Adı',
    'password': 'Şifre',
    'email': 'E-posta Adresi',
    'fullName': 'Tam İsim (İsteğe Bağlı)',
    'abstract': 'Özet',
    'type': 'Tür',
    'submitted': 'Gönderildi',
    'reviewed': 'İncelendi',
    'isAccepted': 'Kabul Edildi',
    'name': 'İsim',
    'bio': 'Biyografi',
    'role': 'Rol',
    
    // Buttons
    'createEntry': 'Kayıt Oluştur',
    'updateEntry': 'Kaydı Güncelle',
    'delete': 'Sil',
    'edit': 'Düzenle',
    'loginButton': 'Giriş Yap',
    'registerButton': 'Kaydol',
    
    // Messages
    'noEntries': 'Henüz Günlük Kaydı Yok',
    'createEntryPrompt': 'Günlük tutmaya başlamak için "Yeni Kayıt Oluştur" düğmesine tıklayın!',
    'entrySavedSecurely': 'Kaydınız güvenli bir şekilde saklanacak ve daha sonra düzenlenebilecektir.',
    'alreadyHaveAccount': 'Zaten hesabınız var mı?',
    'dontHaveAccount': 'Hesabınız yok mu?',
    'signUp': 'Kaydolun',
    'loginText': 'Giriş yapın',
    'pleaseLogin': 'Günlük kayıtlarınızı görmek için lütfen giriş yapın.',
    'loadingEntries': 'Günlük kayıtlarınız yükleniyor...',
    'acceptedEntries': 'Kabul Edilen Kayıtlar',
    
    // Status labels
    'statusWaitingForPayment': 'Ödeme Bekliyor',
    'statusWaitingForAuthors': 'Yazarları Bekliyor',
    'statusWaitingForReferees': 'Hakemleri Bekliyor',
    'statusWaitingForEditors': 'Editörleri Bekliyor',
    'statusAccepted': 'Kabul Edildi',
    'statusNotAccepted': 'Kabul Edilmedi',
    
    // Placeholders
    'enterTitle': 'Günlük kaydınız için bir başlık girin',
    'writeThoughts': 'Düşüncelerinizi buraya yazın...',
    'enterUsername': 'Kullanıcı adınızı girin',
    'enterPassword': 'Şifrenizi girin',
    'enterAbstract': 'Kısa bir özet girin...',
    
    // Status messages
    'saving': 'Kaydediliyor...',
    'signingIn': 'Giriş Yapılıyor...',
    'creatingAccount': 'Hesap Oluşturuluyor...',
    'loading': 'Yükleniyor...',

    // Admin page
    'adminDashboard': 'Yönetici Paneli',
    'userManagement': 'Kullanıcılar',
    'totalUsers': 'Toplam kullanıcı',

    // Language
    'language': 'Dil',
    'turkish': 'Türkçe',
    'english': 'İngilizce',

    // Roles
    'writer': 'Yazar',
    'editor': 'Editör',
    'arbitrator': 'Hakem',
    'admin': 'Yönetici',
    'owner': 'Sahip',

    // New translations
    'publicationDate': 'Yayın Tarihi',
    'isPublished': 'Dergiyi Yayınla',
    'editJournal': 'Dergiyi Düzenle',
    'updateJournal': 'Dergiyi Güncelle',
    'accessDeniedAdminOnly': 'Erişim Reddedildi: Yalnızca yöneticiler bu işlemi gerçekleştirebilir.',

    // Theme
    'theme': 'Tema',
    'lightMode': 'Açık Tema',
    'darkMode': 'Koyu Tema',
    'switchToDark': 'Koyu temaya geç',
    'switchToLight': 'Açık temaya geç',

    // Admin actions
    'createUser': 'Kullanıcı Oluştur',
    'userCreatedSuccessfully': 'Kullanıcı başarıyla oluşturuldu!',
    'editUser': 'Kullanıcıyı Düzenle',
    'userUpdatedSuccessfully': 'Kullanıcı başarıyla güncellendi!',
    'cancel': 'İptal',

    // Login link feature
    'directLogin': 'Doğrudan Giriş Bağlantısı',
    'directLoginDescription': 'Bu kullanıcının şifre gerektirmeden otomatik olarak giriş yapabileceği geçici bir bağlantı oluşturun.',
    'generateLoginLink': 'Giriş Bağlantısı Oluştur',
    'copyLink': 'Bağlantıyı Kopyala',
    'linkCopied': 'Bağlantı kopyalandı!',
    'generating': 'Oluşturuluyor...',
    'saveChanges': 'Değişiklikleri Kaydet',

    // Auto-login page
    'invalidLoginLink': 'Geçersiz giriş bağlantısı. Bağlantı süresi dolmuş veya kullanılmış olabilir.',
    'loginFailed': 'Giriş başarısız. Lütfen tekrar deneyin veya destek ile iletişime geçin.',
    'autoLoginFailed': 'Otomatik giriş başarısız. Lütfen manuel olarak giriş yapmayı deneyin.',
    'autoLoginProcessing': 'Giriş işleniyor...',
    'loginError': 'Giriş Hatası',
    'goToLogin': 'Giriş Sayfasına Git',
    'loginSuccessful': 'Giriş Başarılı',
    'redirecting': 'Ana sayfaya yönlendiriliyorsunuz...',
    'loginSuccessButUserInfoFailed': 'Giriş başarılı ancak kullanıcı bilgileri alınırken hata oluştu. Lütfen sayfayı yenileyin.',
    
    // User Profile Page
    'profile': 'Profil',
    'userProfile': 'Kullanıcı Profili',
    'myJournalEntries': 'Dergi Yazılarım',
    'noEntriesFound': 'Herhangi bir yazı bulunamadı.',
    'loadingUserData': 'Kullanıcı verileri yükleniyor...',
    'failedToLoadUserEntries': 'Kullanıcı yazıları yüklenemedi.',
    'biography': 'Biyografi',
    'scienceBranch': 'Bilim Dalı',
    'location': 'Konum',
    'telephone': 'Telefon',
    'yoksisId': 'YÖKSİS ID',
    'orcidId': 'ORCID ID',
    'journalId': 'Dergi ID',
    'date': 'Tarih',
    'myRefereeEntries': 'Hakem Olduğum Yazılar',
    'noRefereeEntriesFound': 'Hakem olduğunuz yazı bulunamadı.',
    'myEditedJournals': 'Editör Olduğum Dergiler',
    'noEditedJournalsFound': 'Editör olduğunuz dergi bulunamadı.',
    'issue': 'Sayı',
    'published': 'Yayınlandı',

    // Password requirements
    'passwordRequirements': 'Şifre aşağıdaki gereksinimleri karşılamalıdır:',
    'passwordMinLength': 'En az 8 karakter uzunluğunda olmalı',
    'passwordCase': 'Büyük ve küçük harf içermeli',
    'passwordNumber': 'En az bir rakam içermeli',
    'passwordMatch': 'Şifreler eşleşmeli',
    'confirmPassword': 'Şifreyi Onayla',

    // Password change
    'changePassword': 'Şifre Değiştir',
    'currentPassword': 'Mevcut Şifre',
    'newPassword': 'Yeni Şifre',
    'passwordUpdated': 'Şifre başarıyla güncellendi!',
    'changingPassword': 'Şifre Değiştiriliyor...',

    // New translations
    'or': 'VEYA',
    'locale': 'tr',
    'googleSignIn': 'Google ile Giriş Yap',
    'googleSignInFailed': 'Google girişi başarısız oldu. Lütfen tekrar deneyin.',
    
    // 404 Page
    'pageNotFoundTitle': 'Akademik Kaynak Bulunamadı',
    'pageNotFoundDescription': 'Talep edilen akademik kaynağa veritabanımızda ulaşılamamıştır. Bu durum, güncelliğini yitirmiş referanslara, konumu değiştirilmiş içeriklere veya henüz yayınlanmamış materyallere erişilmeye çalışılması halinde meydana gelebilir. İlgili akademik içeriği bulmak amacıyla kapsamlı arşivlerimizi incelemenizi ve gelişmiş arama olanaklarımızdan faydalanmanızı öneririz.',
    'exploreJournalsText': 'Hakemli yayınları inceleyiniz',
    'searchContentText': 'Gelişmiş arama olanaklarımızı kullanınız',
    
    // Forgot Password and Reset Password
    'forgotPassword': 'Şifremi Unuttum',
    'forgotPasswordInstructions': 'E-posta adresinizi girin ve şifrenizi sıfırlamak için bir bağlantı göndereceğiz.',
    'passwordResetLinkSent': 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
    'backToLogin': 'Giriş Sayfasına Dön',
    'enterEmail': 'E-posta adresinizi girin',
    'sendResetLink': 'Şifre Sıfırlama Bağlantısı Gönder',
    'rememberPassword': 'Şifrenizi hatırlıyor musunuz?',
    'resetPassword': 'Şifre Sıfırlama',
    'passwordResetSuccess': 'Şifreniz başarıyla sıfırlandı!',
    'redirectingToLogin': 'Giriş sayfasına yönlendiriliyorsunuz.',
    'enterNewPassword': 'Yeni şifrenizi girin',
    'confirmNewPassword': 'Yeni şifrenizi onaylayın',
    'resetting': 'Sıfırlama...',
    'createAccountHere': 'Hesap Oluştur',

    // Country and Location
    'country': 'Ülke',
    'selectCountry': 'Ülke seçin',
    'searchCountries': 'Ülke ara...',
    'noCountriesFound': 'Ülke bulunamadı',
    'enterLocation': 'Konumunuzu girin (örn: İstanbul, Ankara, Londra)',

    // CAPTCHA
    'pleaseVerifyCaptcha': 'Lütfen insan olduğunuzu doğrulayın',
    'captchaExpired': 'CAPTCHA doğrulaması süresi doldu. Lütfen tekrar doğrulayın.',
    'searchPlaceholder': 'Ara...',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('tr');

  // Translation function
  const t = (key: string): string => {
    // Type guard for the key
    if (isTranslationKey(key)) {
      return translations[language][key];
    }
    return key;
  };

  // Type guard function to check if a key exists in the translations
  function isTranslationKey(key: string): key is TranslationKeys {
    return Object.keys(translations[language]).includes(key);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 