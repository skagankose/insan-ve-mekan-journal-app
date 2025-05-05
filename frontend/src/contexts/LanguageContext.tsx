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
  | 'name' | 'bio' | 'role' | 'loading' | 'adminDashboard' | 'manageUsersAndSettings' | 'userManagement' | 'totalUsers'
  | 'writer' | 'editor' | 'arbitrator' | 'admin';

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
    
    // Page titles
    'createNewEntry': 'Create New Journal Entry',
    'editEntry': 'Edit Journal Entry',
    'createAccount': 'Create an Account',
    'welcomeBack': 'Welcome Back',
    
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
    'manageUsersAndSettings': 'Manage users and system settings',
    'userManagement': 'User Management',
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
    
    // Page titles
    'createNewEntry': 'Yeni Günlük Kaydı Oluştur',
    'editEntry': 'Günlük Kaydını Düzenle',
    'createAccount': 'Hesap Oluştur',
    'welcomeBack': 'Tekrar Hoş Geldiniz',
    
    // Form labels
    'title': 'Başlık',
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
    'signUp': 'Kaydol',
    'loginText': 'Giriş yap',
    'pleaseLogin': 'Günlük kayıtlarınızı görmek için lütfen giriş yapın.',
    'loadingEntries': 'Günlük kayıtlarınız yükleniyor...',
    
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
    'manageUsersAndSettings': 'Kullanıcıları ve sistem ayarlarını yönetin',
    'userManagement': 'Kullanıcı Yönetimi',
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
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

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