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
  | 'home' | 'newEntry' | 'login' | 'register' | 'logout' | 'welcome' | 'myJournal' | 'myJournals' | 'navigation'
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
  | 'roleAuthor' | 'roleAdmin' | 'roleOwner' | 'roleEditor' | 'roleReferee'
  | 'isAuth' | 'isAuthDescription'
  | 'publicationDate' | 'isPublished' | 'editJournal' | 'updateJournal' | 'accessDeniedAdminOnly'
  | 'theme' | 'lightMode' | 'darkMode' | 'switchToDark' | 'switchToLight'
  | 'previousIssues' | 'publishedJournals' | 'acceptedEntries'
  | 'createUser' | 'userCreatedSuccessfully' | 'cancel' | 'editUser' | 'userUpdatedSuccessfully' | 'createJournal'
  | 'createNewJournal' | 'enterJournalTitle' | 'enterIssueNumber' | 'journalCreatedSuccessfully' | 'errorCreatingJournal' | 'journalTitle'
  | 'directLogin' | 'directLoginDescription' | 'generateLoginLink' | 'copyLink' | 'linkCopied' | 'generating' | 'saveChanges'
  | 'invalidLoginLink' | 'loginFailed' | 'autoLoginFailed' | 'autoLoginProcessing' | 'loginError' | 'goToLogin' | 'loginSuccessful' | 'redirecting'
  | 'loginSuccessButUserInfoFailed'
  | 'profile' | 'userProfile' | 'myJournalEntries' | 'noEntriesFound' | 'loadingUserData' | 'failedToLoadUserEntries'
  | 'biography' | 'scienceBranch' | 'location' | 'telephone' | 'profileInformation' | 'yoksisId' | 'orcidId' | 'journalId' | 'date'
  | 'myRefereeEntries' | 'noRefereeEntriesFound' | 'myEditedJournals' | 'noEditedJournalsFound' | 'issue'
  | 'entriesInJournal'
  | 'passwordRequirements' | 'passwordMinLength' | 'passwordCase' | 'passwordNumber' | 'passwordMatch' | 'confirmPassword'
  | 'changePassword' | 'currentPassword' | 'newPassword' | 'passwordUpdated' | 'changingPassword'
  | 'statusWaitingForPayment' | 'statusWaitingForAuthors' | 'statusWaitingForReferees' | 'statusWaitingForEditors' | 'statusAccepted' | 'statusNotAccepted'
  | 'notAccepted' | 'waitingForPayment' | 'waitingForAuthors' | 'waitingForReferees' | 'waitingForEditors' | 'rejected' | 'pending' | 'accepted'
  | 'published' | 'inProgress' | 'or' | 'locale' | 'googleSignIn' | 'googleSignInFailed'
  | 'pageNotFoundTitle' | 'pageNotFoundDescription' | 'exploreJournalsText' | 'searchContentText'
  | 'forgotPassword' | 'forgotPasswordInstructions' | 'passwordResetLinkSent' | 'backToLogin' | 'enterEmail' | 'sendResetLink' | 'rememberPassword'
  | 'resetPassword' | 'passwordResetSuccess' | 'redirectingToLogin' | 'enterNewPassword' | 'confirmNewPassword' | 'resetting'
  | 'createAccountHere'
  | 'country' | 'selectCountry' | 'searchCountries' | 'noCountriesFound' | 'enterLocation'
  | 'pleaseVerifyCaptcha' | 'captchaExpired' | 'captchaVerificationFailed'
  | 'editorJournals' | 'submitPaper' | 'publishedIssues' | 'searchPlaceholder' | 'viewJournal' | 'readMore'
  | 'about' | 'generalInformation'
  | 'footer.contact' | 'footer.quickLinks' | 'footer.aboutUs' | 'footer.generalInformation' | 'footer.archive' | 'footer.connectWithUs'
  | 'footer.facebookAria' | 'footer.twitterAria' | 'footer.instagramAria' | 'footer.linkedinAria' | 'footer.allRightsReserved'
  | 'validation.required' | 'validation.email' | 'validation.minLength' | 'validation.maxLength' | 'validation.tooShort' | 'validation.tooLong'
  | 'admin.welcomeTitle' | 'admin.welcomeDescription' | 'admin.searchTipsTitle' | 'admin.searchTip1' | 'admin.searchTip2' | 'admin.searchTip3'
  | 'searchResults' | 'users' | 'journals' | 'papers' | 'entries' | 'globalSearchPlaceholder'
  | 'setAsActive' | 'mergeAndCreateToc'
  | 'backToJournals' | 'backToArchive' | 'failedToLoadJournalData' | 'loadingJournalData' | 'journalNotFound'
  | 'createdDate' | 'publicationStatus' | 'notPublished' | 'publicationPlace' | 'editorInChief' | 'none' | 'editors'
  | 'change' | 'manage' | 'journalFiles' | 'viewCoverPhoto' | 'viewMetaFiles' | 'viewEditorNotes' | 'viewFullPdf'
  | 'viewIndexSection' | 'viewMergedFile' | 'downloadJournal' | 'downloadFullPdf' | 'downloadJournalDescription'
  | 'noEntriesInJournal' | 'failedToMergeFiles' | 'mergingFiles' | 'selectEditorInChief' | 'noAdminUsers'
  | 'manageEditors' | 'noEditorUsers' | 'save'
  | 'publicationDetails' | 'publicationFiles' | 'coverPhoto' | 'metaFiles' | 'editorNotes' | 'fullPdf' | 'indexSection' | 'mergedFile'
  | 'paymentRequired' | 'bankTransferInformation' | 'exampleBank' | 'insanMekanJournal' | 'ibanNumber' | 'importantPaymentInstructions'
  | 'includeYourUniqueToken' | 'youMustIncludeYourUniqueToken' | 'yourToken' | 'paymentVerification' | 'withoutTheCorrectToken'
  | 'paymentVerificationTypically' | 'paymentInfoMessage'
  | 'downloadPdf' | 'viewUpdates' | 'authors' | 'publishedIn' | 'entryDetails' | 'pageNumber' | 'articleType' | 'status' | 'downloads' | 'reads'
  | 'bankName' | 'accountHolder' | 'processingTime' | 'keywords' | 'keywordsEn' | 'keywordsSeparatedByCommasEn' | 'updatedKeywordsEn' | 'referees' | 'files' | 'viewFile'
  | 'referenceToken' | 'manageAuthors' | 'changeJournal' | 'manageReferees' | 'noPublishedEntries'
  | 'loadingPublishedJournals' | 'failedToLoadPublishedJournals' | 'noPublishedJournals' | 'checkBackLaterForPublications'
  | 'reviewFile' | 'updatedTitle' | 'updatedAbstract' | 'updatedAbstractEn' | 'updatedKeywords' | 'updatedFile'
  | 'updateCopied' | 'privateNotes'
  | 'unmarkForDeletion' | 'unmarkForDeletionWarning' | 'markForDeletion' | 'markForDeletionWarning'
  | 'editProfile' | 'academicTitle'
  | 'incorrectCurrentPassword' | 'passwordUpdateFailed'
  | 'yoksisValidationError' | 'orcidValidationError' | 'phoneValidationError'
  | 'profileUpdated' | 'accountMarkedForDeletion' | 'accountUnmarkedForDeletion'
  | 'entryNotFoundTitle' | 'entryNotFoundExplanation' | 'userNotFoundTitle' | 'userNotFoundExplanation'
  | 'errorLoadingEntryTitle' | 'errorLoadingEntryExplanation'   | 'errorLoadingUserTitle' | 'errorLoadingUserExplanation'
  | 'paperNotFoundTitle' | 'paperNotFoundExplanation' | 'paperNotFoundUpdateExplanation'
  | 'tryAgain' | 'addAuthorUpdate' | 'addRefereeUpdate' | 'participants' | 'noParticipants'
  | 'pleaseConfirmEmail' | 'incorrectCredentials'
  | 'registrationSuccessful' | 'registrationFailed' | 'emailAlreadyRegistered' | 'accountCreated' | 'registrationToastMessage'
  | 'copyFailed' | 'copyManually' | 'copyManuallyInstructions' | 'copyManuallyToast' | 'close' | 'copyUpdate'
  | 'deleteUpdate' | 'confirmDeleteUpdateMessage' | 'authorUpdate' | 'refereeUpdate' | 'thisActionCannotBeUndone' | 'updateDeleted' | 'deleteUpdateError'
  | 'user' | 'journal' | 'paper' | 'draft' | 'founder' | 'author'
  | 'noUpdates' | 'startConversation'
  // Journal Entry Form specific translations
  | 'createNewJournalEntry' | 'entryTitle' | 'enterEntryTitle' | 'entryTitleEn' | 'enterEntryTitleEn' | 'abstractTurkish' | 'abstractEnglish'
  | 'enterAbstractTurkish' | 'enterAbstractEnglish' | 'enterKeywordsComma' | 'entryLanguage'
  | 'submitEntry' | 'mustBeLoggedIn' | 'failedToCreateEntry' | 'noActiveJournalSelected'
  | 'noActiveJournalMessage' | 'selectAJournal' | 'toAssociateWithEntry' | 'entrySavedSecurelyMessage'
  | 'selectArticleType' | 'articleTypeTheory' | 'articleTypeResearch' | 'selectLanguage'
  | 'entryCreatedSuccessfully' | 'entryUpdatedSuccessfully' | 'entryDeletedSuccessfully' | 'authorRemovedSuccessfully' | 'failedToRemoveAuthor'
  | 'citeArticle' | 'citeThisArticle' | 'copy' | 'noResultsFound';

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
    'myJournals': 'My Journals',
    'navigation': 'Navigation',
    'previousIssues': 'Previous Issues',
    'editorJournals': 'Active Journals',
    'submitPaper': 'Submit Paper',
    'publishedIssues': 'Archives',
    
    // Page titles
    'createNewEntry': 'Create New Journal Entry',
    'editEntry': 'Edit Journal Entry',
    'createAccount': 'Create an Account',
    'welcomeBack': 'Welcome Back',
    'publishedJournals': 'Published Journals',
    'viewJournal': 'View Journal',
    
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
    'acceptedEntries': 'Published Papers',
    
    // Status labels
    'statusWaitingForPayment': 'Waiting for Payment',
    'statusWaitingForAuthors': 'Waiting for Authors',
    'statusWaitingForReferees': 'Waiting for Referees',
    'statusWaitingForEditors': 'Waiting for Editors',
    'statusAccepted': 'Accepted',
    'statusNotAccepted': 'Not Accepted',
    
    // Entry status translations
    'notAccepted': 'Not Accepted',
    'waitingForPayment': 'Waiting for Payment',
    'waitingForAuthors': 'Waiting for Authors',
    'waitingForReferees': 'Waiting for Referees',
    'waitingForEditors': 'Waiting for Editors',
    'rejected': 'Rejected',
    'pending': 'Pending',
    'accepted': 'Accepted',
    'inProgress': 'In Progress',
    
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
    'roleAuthor': 'Author',
    'roleAdmin': 'Admin',
    'roleOwner': 'Owner',
    'roleEditor': 'Editor',
    'roleReferee': 'Referee',
    'isAuth': 'Authorize',
    'isAuthDescription': 'When enabled, this user will have authorized access to the system with their assigned role.',

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
    'createJournal': 'Create Journal',

    // Journal creation
    'createNewJournal': 'Create New Journal',
    'journalTitle': 'Journal Title',
    'enterJournalTitle': 'Enter journal title',
    'enterIssueNumber': 'Enter issue number',
    'journalCreatedSuccessfully': 'Journal created successfully',
    'errorCreatingJournal': 'Error creating journal',

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
    'profileInformation': 'Profile Information',
    'yoksisId': 'YÖKSİS ID',
    'orcidId': 'ORCID ID',
    'journalId': 'Journal ID',
    'date': 'Date',
    'myRefereeEntries': 'Entries I Referee',
    'noRefereeEntriesFound': 'No referee entries found.',
    'myEditedJournals': 'Editor Journals',
    'noEditedJournalsFound': 'No journals found.',
    'issue': 'Issue',
    'published': 'Published',
    'entriesInJournal': 'Entries in this Journal',

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
    'captchaVerificationFailed': 'reCAPTCHA verification failed. Please try again.',
    'searchPlaceholder': 'Search...',
    'readMore': 'Read More',
    
    // New pages
    'about': 'About',
    'generalInformation': 'General Information',

    // Footer translations
    'footer.contact': 'Contact',
    'footer.quickLinks': 'Quick Links',
    'footer.aboutUs': 'About Us',
    'footer.generalInformation': 'General Information',
    'footer.archive': 'Archive',
    'footer.connectWithUs': 'Connect With Us',
    'footer.facebookAria': 'Follow us on Facebook',
    'footer.twitterAria': 'Follow us on Twitter',
    'footer.instagramAria': 'Follow us on Instagram',
    'footer.linkedinAria': 'Connect with us on LinkedIn',
    'footer.allRightsReserved': 'All rights reserved.',

    // Form validation
    'validation.required': 'Please fill out this field.',
    'validation.email': 'Please enter a valid email address.',
    'validation.minLength': 'Please lengthen this text to {min} characters or more.',
    'validation.maxLength': 'Please shorten this text to {max} characters or less.',
    'validation.tooShort': 'Please use at least {min} characters.',
    'validation.tooLong': 'Please use no more than {max} characters.',

    // Admin Dashboard Welcome Text
    'admin.welcomeTitle': 'Welcome to Admin Dashboard',
    'admin.welcomeDescription': 'Use the search box above to find users, journals, or journal entries.',
    'admin.searchTipsTitle': 'Search Tips:',
    'admin.searchTip1': 'Search by user names, emails, titles, or roles',
    'admin.searchTip2': 'Find journals by title (Turkish or English) or publication details',
    'admin.searchTip3': 'Look for journal entries by title, abstracts, keywords, or authors',
    
    // Search Results
    'searchResults': 'Search Results',
    'users': 'users',
    'journals': 'journals',
    'papers': 'papers',
    'entries': 'entries',
    'globalSearchPlaceholder': 'Search users, journals, journal entries...',
    
    // Journal actions
    'setAsActive': 'Set as Active',
    'mergeAndCreateToc': 'Merge Journal Files',
    
    // Journal Details Page
    'backToJournals': 'Back to Journals',
    'backToArchive': 'Back to Archive',
    'failedToLoadJournalData': 'Failed to load journal data from the server. This could be due to a temporary network issue, server maintenance, or the journal may have been moved or deleted. Please check your internet connection and try refreshing the page. If the problem persists, please contact our technical support team.',
    'loadingJournalData': 'Loading journal data...',
    'journalNotFound': 'Journal not found',
    'createdDate': 'Created Date',
    'publicationStatus': 'Publication Status',
    'notPublished': 'Not Published',
    'publicationPlace': 'Publication Place',
    'editorInChief': 'Editor-in-Chief',
    'none': 'None',
    'editors': 'Editors',
    'change': 'Change',
    'manage': 'Manage',
    'journalFiles': 'Journal Files',
    'viewCoverPhoto': 'Cover Photo',
    'viewMetaFiles': 'Meta Files',
    'viewEditorNotes': 'Editor Notes',
    'viewFullPdf': 'PDF File',
    'viewIndexSection': 'Index Section',
    'viewMergedFile': 'Merged DOCX File',
    'downloadJournal': 'Download Journal',
    'downloadFullPdf': 'Download Full PDF',
    'downloadJournalDescription': 'Download the complete journal in PDF format',
    'noEntriesInJournal': 'No papers found in this journal',
    'failedToMergeFiles': 'Failed to merge journal files',
    'mergingFiles': 'Merging Files...',
    'selectEditorInChief': 'Select Editor-in-Chief',
    'noAdminUsers': 'No admin users found',
    'manageEditors': 'Manage Editors',
    'noEditorUsers': 'No editor users found',
    'save': 'Save',
    'publicationDetails': 'Publication Details',
    'publicationFiles': 'Files',
    'coverPhoto': 'Cover Photo',
    'metaFiles': 'Meta Files',
    'editorNotes': 'Editor Notes',
    'fullPdf': 'PDF File',
    'indexSection': 'Index Section',
    'mergedFile': 'Merged DOCX File',
    
    // Payment Information
    'paymentRequired': 'Processing Fee Required',
    'bankTransferInformation': 'Bank Transfer Information',
    'exampleBank': 'Example Bank',
    'insanMekanJournal': 'İnsan Mekan Journal',
    'ibanNumber': 'IBAN Number',
    'importantPaymentInstructions': 'Important Payment Instructions',
    'includeYourUniqueToken': 'Include Your Unique Token:',
    'youMustIncludeYourUniqueToken': 'You must include your unique submission token in the payment description/reference field.',
    'yourToken': 'Your Token:',
    'paymentVerification': 'Payment Verification:',
    'withoutTheCorrectToken': 'Without the correct token, we cannot link your payment to your submission.',
    'paymentVerificationTypically': 'Payment verification typically takes 1-2 business days.',
    'paymentInfoMessage': 'To proceed with the publication process, please complete the payment using the following bank information',
    
    // Journal Entry Details Page translations
    'downloadPdf': 'Download PDF',
    'viewUpdates': 'View Updates',
    'authors': 'Authors',
    'publishedIn': 'Published In Journal',
    'entryDetails': 'Entry Details',
    'pageNumber': 'Page Number',
    'articleType': 'Article Type',
    'status': 'Status',
    'downloads': 'Downloads',
    'reads': 'Reads',
    'bankName': 'Bank Name',
    'accountHolder': 'Account Holder',
    'processingTime': 'Processing Time',
    'keywords': 'Keywords',
    'keywordsEn': 'Keywords (English)',
    'keywordsSeparatedByCommasEn': 'Separate English keywords with commas',
    'updatedKeywordsEn': 'Updated Keywords (English)',
    'referees': 'Referees',
    'files': 'Files',
    'viewFile': 'DOCX File',
    'referenceToken': 'Reference Token',
    'manageAuthors': 'Manage Authors',
    'changeJournal': 'Change Journal',
    'manageReferees': 'Manage Referees',
    'noPublishedEntries': 'No published papers found in this journal',
    'loadingPublishedJournals': 'Loading published journals...',
    'failedToLoadPublishedJournals': 'Failed to load published journals.',
    'noPublishedJournals': 'No published journals found.',
    'checkBackLaterForPublications': 'Check back later for new publications',
    'reviewFile': 'Review File',
    'updatedTitle': 'Updated Title',
    'updatedAbstract': 'Updated Abstract',
    'updatedAbstractEn': 'Updated Abstract (English)',
    'updatedKeywords': 'Updated Keywords',
    'updatedFile': 'Updated File',
    'updateCopied': 'Update content copied to clipboard!',
    'privateNotes': 'Private Referee Notes (Visible Only to the Referee Who Created Them and Authors)',
    
    // Deletion
    'markForDeletion': 'Mark Account for Deletion',
    'unmarkForDeletion': 'Unmark Account for Deletion',
    'markForDeletionWarning': 'Warning: This action will mark your account for deletion. This is the first step in the account deletion process. An administrator will review and process your request.',
    'unmarkForDeletionWarning': 'Your account is currently marked for deletion. Click the button below to cancel the deletion request.',
    'editProfile': 'Edit Profile',
    'academicTitle': 'Academic Title',
    'incorrectCurrentPassword': 'The current password you entered is incorrect. Please try again.',
    'passwordUpdateFailed': 'Failed to update password. Please check your details and try again.',
    'yoksisValidationError': 'YÖKSİS ID must be 5-8 digits',
    'orcidValidationError': 'ORCID must be in 0000-0000-0000-0000 format',
    'phoneValidationError': 'Phone number must be in valid international format (country code + 7-15 digits)',
    'profileUpdated': 'Profile updated successfully!',
    'accountMarkedForDeletion': 'Account marked for deletion successfully!',
    'accountUnmarkedForDeletion': 'Account unmarked for deletion successfully!',
    
    // Not Found Messages
    'entryNotFoundTitle': 'Journal Entry Not Found',
    'entryNotFoundExplanation': "The journal entry you're looking for doesn't exist or may have been removed.",
    'userNotFoundTitle': 'User Not Found',
    'userNotFoundExplanation': "The user profile you're looking for doesn't exist or may have been removed.",
    
    // Error Loading Messages
    'errorLoadingEntryTitle': 'Error Loading Entry',
    'errorLoadingEntryExplanation': 'Unable to load the journal entry. Please check your connection and try again.',
    'errorLoadingUserTitle': 'Error Loading User',
    'errorLoadingUserExplanation': 'Unable to load the user profile. Please check your connection and try again.',
    'paperNotFoundTitle': 'Journal Paper Not Found',
    'paperNotFoundExplanation': 'We encountered an issue while loading this journal entry.',
    'paperNotFoundUpdateExplanation': 'We encountered an issue while loading this journal entry\'s updates.',
    'tryAgain': 'Try Again',
    'addAuthorUpdate': 'Add Author Update',
    'addRefereeUpdate': 'Add Referee Update',
    'participants': 'Participants',
    'noParticipants': 'No participants Found',
    'pleaseConfirmEmail': 'Please confirm your email address to login.',
    'incorrectCredentials': 'Incorrect email or password. Please check your credentials.',
    
    // Registration messages
    'registrationSuccessful': 'Registration successful! Redirecting to login...',
    'registrationFailed': 'Registration failed. Please try again.',
    'emailAlreadyRegistered': 'Email already registered. Please use a different email or login.',
    'accountCreated': 'Account created successfully!',
    'registrationToastMessage': 'Account created successfully! Please check your email and confirm your address to complete registration.',
    
    // Copy functionality
    'copyFailed': 'Failed to copy to clipboard',
    'copyManually': 'Copy Text Manually',
    'copyManuallyInstructions': 'Please select and copy the text below:',
    'copyManuallyToast': 'Please copy the text manually from the popup',
    'close': 'Close',
    'copyUpdate': 'Copy Update',
    
    // Delete functionality
    'deleteUpdate': 'Delete Update',
    'confirmDeleteUpdateMessage': 'Are you sure you want to delete this',
    'authorUpdate': 'author update',
    'refereeUpdate': 'referee update',
    'thisActionCannotBeUndone': 'This action cannot be undone.',
    'updateDeleted': 'Update deleted successfully!',
    'deleteUpdateError': 'Failed to delete the update',
    
    // Badge labels for AdminPage
    'user': 'User',
    'journal': 'Journal', 
    'paper': 'Paper',
    'draft': 'Draft',
    'founder': 'Founder',
    'author': 'Author',
    
    // Journal Entry Form specific translations
    'createNewJournalEntry': 'Create New Journal Entry',
    'entryTitle': 'Title',
    'enterEntryTitle': 'Enter title',
    'entryTitleEn': 'Title (English)',
    'enterEntryTitleEn': 'Enter title in English',
    'abstractTurkish': 'Abstract (Turkish)',
    'abstractEnglish': 'Abstract (English)',
    'enterAbstractTurkish': 'Enter a brief summary in Turkish...',
    'enterAbstractEnglish': 'Enter a brief summary in English...',
    'enterKeywordsComma': 'Enter keywords, separated by commas...',
    'entryLanguage': 'Language',
    'submitEntry': 'Submit Entry',
    'mustBeLoggedIn': 'You must be logged in to create an entry.',
    'failedToCreateEntry': 'Failed to create entry.',
    'noActiveJournalSelected': 'No Active Journal Selected',
    'noActiveJournalMessage': 'No active journal selected.',
    'selectAJournal': 'Select a journal',
    'toAssociateWithEntry': 'to associate with this entry.',
    'entrySavedSecurelyMessage': 'Your entry will be saved securely and reviewed by our editorial team',
    'selectArticleType': '-- Select Article Type --',
    'articleTypeTheory': 'Theory',
    'articleTypeResearch': 'Research',
    'selectLanguage': '-- Select Language --',
    'entryCreatedSuccessfully': 'Entry created successfully!',
    'entryUpdatedSuccessfully': 'Entry updated successfully!',
    'entryDeletedSuccessfully': 'Entry deleted successfully!',
    'noResultsFound': 'No results found',
    'authorRemovedSuccessfully': 'Author removed successfully',
    'failedToRemoveAuthor': 'Failed to remove author',

    // Citation translations
    'citeArticle': 'Cite Article',
    'citeThisArticle': 'Cite This Article',
    'copy': 'Copy',
    
    // Update conversation translations
    'noUpdates': 'No updates yet',
    'startConversation': 'Start the conversation by adding an update',
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
    'myJournals': 'Dergilerim',
    'navigation': 'Navigasyon',
    'previousIssues': 'Önceki Sayılar',
    'editorJournals': 'Aktif Dergiler',
    'submitPaper': 'Makale Gönder',
    'publishedIssues': 'Arşivler',
    
    // Page titles
    'createNewEntry': 'Yeni Makale Oluştur',
    'editEntry': 'Düzenle',
    'createAccount': 'Hesap Oluştur',
    'welcomeBack': 'Tekrar Hoş Geldiniz',
    'publishedJournals': 'Yayınlanmış Dergiler',
    'viewJournal': 'Dergiyi Görüntüle',
     
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
    'createEntry': 'Makale Oluştur',
    'updateEntry': 'Kaydı Güncelle',
    'delete': 'Sil',
    'edit': 'Düzenle',
    'loginButton': 'Giriş Yap',
    'registerButton': 'Kaydol',
    
    // Messages
    'noEntries': 'Henüz Makaleler Mevcut Değil',
    'createEntryPrompt': 'Makale eklemek için "Yeni Kayıt Oluştur" düğmesine tıklayın!',
    'entrySavedSecurely': 'Kaydınız güvenli bir şekilde saklanacak ve daha sonra düzenlenebilecektir.',
    'alreadyHaveAccount': 'Zaten hesabınız var mı?',
    'dontHaveAccount': 'Hesabınız yok mu?',
    'signUp': 'Kaydolun',
    'loginText': 'Giriş yapın',
    'pleaseLogin': 'Makalelerinizi görmek için lütfen giriş yapın.',
    'loadingEntries': 'Makaleler yükleniyor...',
    'acceptedEntries': 'Yayınlanan Makaleler',
    
    // Status labels
    'statusWaitingForPayment': 'Ödeme Bekleniyor',
    'statusWaitingForAuthors': 'Yazarlar Bekleniyor',
    'statusWaitingForReferees': 'Hakemler Bekleniyor',
    'statusWaitingForEditors': 'Editörler Bekleniyor',
    'statusAccepted': 'Kabul Edildi',
    'statusNotAccepted': 'Kabul Edilmedi',
    
    // Entry status translations
    'notAccepted': 'Kabul Edilmedi',
    'waitingForPayment': 'Ödeme Bekleniyor',
    'waitingForAuthors': 'Yazarlar Bekleniyor',
    'waitingForReferees': 'Hakemler Bekleniyor',
    'waitingForEditors': 'Editörler Bekleniyor',
    'rejected': 'Kabul Edilmedi',
    'pending': 'Beklemede',
    'accepted': 'Kabul Edildi',
    'inProgress': 'Devam Ediyor',
    
    // Placeholders
    'enterTitle': 'Makalenız için bir başlık girin',
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
    'language': 'DİL',
    'turkish': 'Türkçe',
    'english': 'İngilizce',

    // Roles
    'writer': 'Yazar',
    'editor': 'EDİTÖR',
    'arbitrator': 'HAKEM',
    'admin': 'YÖNETİCİ',
    'owner': 'Kurucu',
    'roleAuthor': 'Yazar',
    'roleAdmin': 'Site Yöneticisi',
    'roleOwner': 'Site Sahibi',
    'roleEditor': 'Editör',
    'roleReferee': 'HAKEM',
    'isAuth': 'Yetkilendir',
    'isAuthDescription': 'Etkinleştirildiğinde, bu kullanıcı atanan rolü için sisteme erişime sahip olacaktır.',

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
    'createJournal': 'Dergi Oluştur',

    // Journal creation
    'createNewJournal': 'Yeni Dergi Oluştur',
    'journalTitle': 'Dergi İsmi',
    'enterJournalTitle': 'Dergi başlığını giriniz',
    'enterIssueNumber': 'Sayıyu giriniz',
    'journalCreatedSuccessfully': 'Dergi başarıyla oluşturuldu',
    'errorCreatingJournal': 'Dergi oluşturulurken hata oluştu',

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
    'profileInformation': 'Profil Bilgileri',
    'yoksisId': 'YÖKSİS ID',
    'orcidId': 'ORCID ID',
    'journalId': 'Dergi ID',
    'date': 'TARİH',
    'myRefereeEntries': 'Hakem Olduğum Yazılar',
    'noRefereeEntriesFound': 'Hakem olduğunuz yazı bulunamadı.',
    'myEditedJournals': 'Editör Olduğum Dergiler',
    'noEditedJournalsFound': 'Editör olduğunuz dergi bulunamadı.',
    'issue': 'Sayı',
    'published': 'Yayınlandı',
    'entriesInJournal': 'Dergi Yazıları',

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
    'captchaVerificationFailed': 'reCAPTCHA doğrulaması başarısız. Lütfen tekrar deneyin.',
    'searchPlaceholder': 'Ara...',
    'readMore': 'Devamını Oku',
    
    // New pages
    'about': 'Hakkımızda',
    'generalInformation': 'Genel Bilgiler',

    // Footer translations
    'footer.contact': 'İletişim',
    'footer.quickLinks': 'Hızlı Bağlantılar',
    'footer.aboutUs': 'Hakkımızda',
    'footer.generalInformation': 'Genel Bilgiler',
    'footer.archive': 'Arşiv',
    'footer.connectWithUs': 'Bizi Takip Edin',
    'footer.facebookAria': 'Facebook\'ta bizi takip edin',
    'footer.twitterAria': 'Twitter\'da bizi takip edin',
    'footer.instagramAria': 'Instagram\'da bizi takip edin',
    'footer.linkedinAria': 'LinkedIn\'de bağlantı kurun',
    'footer.allRightsReserved': 'Tüm hakları saklıdır.',

    // Form validation
    'validation.required': 'Lütfen bu alanı doldurun.',
    'validation.email': 'Lütfen geçerli bir e-posta adresi girin.',
    'validation.minLength': 'Lütfen bu metni {min} karakter veya daha fazla olacak şekilde uzatın.',
    'validation.maxLength': 'Lütfen bu metni {max} karakter veya daha az olacak şekilde kısaltın.',
    'validation.tooShort': 'Lütfen en az {min} karakter kullanın.',
    'validation.tooLong': 'Lütfen en fazla {max} karakter kullanın.',

    // Admin Dashboard Welcome Text
    'admin.welcomeTitle': 'Yönetici Paneline Hoş Geldiniz',
    'admin.welcomeDescription': 'Kullanıcıları, dergileri veya dergi yazılarını bulmak için yukarıdaki arama kutusunu kullanın.',
    'admin.searchTipsTitle': 'Arama İpuçları:',
    'admin.searchTip1': 'Kullanıcı isimleri, e-postalar, başlıklar veya rollere göre arama yapın',
    'admin.searchTip2': 'Dergileri başlığa (Türkçe veya İngilizce) veya yayın detaylarına göre bulun',
    'admin.searchTip3': 'Dergi yazılarını başlık, özet, anahtar kelimeler veya yazarlara göre arayın',
    
    // Search Results
    'searchResults': 'Arama Sonuçları',
    'users': 'Kullanıcılar',
    'journals': 'Dergiler',
    'papers': 'Makaleler',
    'entries': 'makale',
    'globalSearchPlaceholder': 'Kullanıcı, dergi, dergi yazısı ara...',
    
    // Journal actions
    'setAsActive': 'Seçili Olarak Ayarla',
    'mergeAndCreateToc': 'Dergi Dosyalarını Birleştir',
    
    // Journal Details Page
    'backToJournals': 'Dergilere Dön',
    'backToArchive': 'Yayınlanan Dergilere Dön',
    'failedToLoadJournalData': 'Dergi verileri sunucudan yüklenemedi. Bu durum geçici bir ağ sorunu, sunucu bakımı veya derginin taşınmış ya da silinmiş olması nedeniyle ortaya çıkabilir. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenilemeyi deneyin. Sorun devam ederse, teknik destek ekibimizle iletişime geçin.',
    'loadingJournalData': 'Dergi verileri yükleniyor...',
    'journalNotFound': 'Dergi bulunamadı',
    'createdDate': 'Oluşturulma Tarihi',
    'publicationStatus': 'Yayın Durumu',
    'notPublished': 'Yayınlanmadı',
    'publicationPlace': 'Yayın Yeri',
    'editorInChief': 'BAŞ EDİTÖR',
    'none': 'YOK',
    'editors': 'EDİTÖRLER',
    'change': 'Değiştir',
    'manage': 'Yönet',
    'journalFiles': 'Dergi Dosyaları',
    'viewCoverPhoto': 'Kapak Fotoğrafı',
    'viewMetaFiles': 'Meta Dosyalar',
    'viewEditorNotes': 'Editör Notları',
    'viewFullPdf': 'PDF Dosyası',
    'viewIndexSection': 'İndeks Bölümü',
    'viewMergedFile': 'Birleştirilmiş Dosyas',
    'downloadJournal': 'Dergiyi İndir',
    'downloadFullPdf': 'PDF İndir',
    'downloadJournalDescription': 'Dergiyi PDF formatında tamamen indirin',
    'noEntriesInJournal': 'Bu Dergide Makale Bulunmamaktadır',
    'failedToMergeFiles': 'Dergi dosyaları birleştirilemedi',
    'mergingFiles': 'Dosyalar Birleştiriliyor...',
    'selectEditorInChief': 'Baş Editörü Seç',
    'noAdminUsers': 'Yönetici kullanıcı bulunamadı',
    'manageEditors': 'Editörleri Yönet',
    'noEditorUsers': 'Editör kullanıcı bulunamadı',
    'save': 'Kaydet',
    'publicationDetails': 'Yayın Detayları',
    'publicationFiles': 'Dosyalar',
    'coverPhoto': 'Kapak Fotoğrafı',
    'metaFiles': 'Meta Dosyalar',
    'editorNotes': 'Editör Notları',
    'fullPdf': 'PDF Dosyası',
    'indexSection': 'İndeks Bölümü',
    'mergedFile': 'Birleştirilmiş Dosya',
    
    // Payment Information
    'paymentRequired': 'İşleme Ücreti Gerekli',
    'bankTransferInformation': 'Banka Havale Bilgileri',
    'exampleBank': 'Örnek Banka',
    'insanMekanJournal': 'İnsan Mekan Dergisi',
    'ibanNumber': 'IBAN Numarası',
    'importantPaymentInstructions': 'Önemli Ödeme Talimatları',
    'includeYourUniqueToken': 'Makalenize Özel Token\'ınızı Dahil Edin:',
    'youMustIncludeYourUniqueToken': 'Ödeme yaparken açıklama alanında makalenize özel token bilgisini yazmalısınız.',
    'yourToken': 'Token\'ınız:',
    'paymentVerification': 'Ödeme Doğrulaması:',
    'withoutTheCorrectToken': 'Doğru token belirtilmeden ödemenizi gönderiminizle eşleştiremeyiz.',
    'paymentVerificationTypically': 'Ödemenin doğrulanması genellikle 1-2 iş günü sürer.',
    'paymentInfoMessage': 'Yayım sürecine devam edebilmek için lütfen aşağıdaki banka bilgilerini kullanarak ödemeyi tamamlayınız',
    
    // Journal Entry Details Page translations
    'downloadPdf': 'PDF İndir',
    'viewUpdates': 'Yayın Sürecini Görüntüle',
    'authors': 'Yazarlar',
    'publishedIn': 'Yayınlandığı Dergi',
    'entryDetails': 'Makale Detayları',
    'pageNumber': 'Sayfa Numarası',
    'articleType': 'Makale Türü',
    'status': 'Durum',
    'downloads': 'İNDİRMELER',
    'reads': 'Okunmalar',
    'bankName': 'Banka Adı',
    'accountHolder': 'Hesap Sahibi',
    'processingTime': 'İşlem Süresi',
    'keywords': 'Anahtar Kelimeler (Türkçe)',
    'keywordsEn': 'Anahtar Kelimeler (İngilizce)',
    'keywordsSeparatedByCommasEn': 'İngilizce anahtar kelimeleri virgül ile ayırarak giriniz',
    'updatedKeywordsEn': 'Güncellenmiş Anahtar Kelimeler (İngilizce)',
    'referees': 'Hakemler',
    'files': 'Dosyalar',
    'viewFile': 'DOCX Dosyası',
    'referenceToken': 'Referans Token',
    'manageAuthors': 'Yazarları Yönet',
    'changeJournal': 'Dergiyi Değiştir',
    'manageReferees': 'Hakemleri Yönet',
    'noPublishedEntries': 'Bu dergide yayınlanan makale bulunmamaktadır',
    'loadingPublishedJournals': 'Yayınlanmış dergiler yükleniyor',
    'failedToLoadPublishedJournals': 'Yayınlanmış dergiler yüklenemedi.',
    'noPublishedJournals': 'Yayınlanan Dergiler Bulunamadı',
    'checkBackLaterForPublications': 'Yayınlanan dergiler kısa bir zaman içinde burada görüntülenecektir. Bizi takipte kalmanızı tavsiye ederiz.',
    'reviewFile': 'Değerlendirme Dosyası',
    'updatedTitle': 'Güncellenmiş Başlık',
    'updatedAbstract': 'Güncellenmiş Özet',
    'updatedAbstractEn': 'Güncellenmiş Genişletilmiş Özet (İngilizce)',
    'updatedKeywords': 'Güncellenmiş Anahtar Kelimeler',
    'updatedFile': 'Güncellenmiş Dosya',
    'updateCopied': 'Güncelleme içeriği panoya kopyalandı!',
    'privateNotes': 'Özel Notlar (Oluşturan Hakem ve Yazarlar Tarafından Görünütlenebilir)',
    
    // Deletion
    'markForDeletion': 'Hesabı Sil',
    'unmarkForDeletion': 'Hesap Silme İşlemini Durdur',
    'markForDeletionWarning': 'Bu işlem, hesabınızı silinmek üzere işaretleyecektir. İnsan ve Mekan platformu yöneticileri talebinizi inceleyip işleme alacaktır.',
    'unmarkForDeletionWarning': 'Hesabınız şu anda silinmek üzere işaretlenmiştir. Silme talebini iptal etmek için aşağıdaki düğmeye tıklayın.',
    'editProfile': 'Profili Düzenle',
    'academicTitle': 'Akademik Ünvan',
    'incorrectCurrentPassword': 'Girilen mevcut şifre yanlış',
    'passwordUpdateFailed': 'Girilen mevcut şifre yanlış',
    'yoksisValidationError': 'YÖKSİS ID 5-8 haneli olmalıdır',
    'orcidValidationError': 'ORCID 0000-0000-0000-0000 formatında olmalıdır',
    'phoneValidationError': 'Telefon numarası 555 55 55 formatta olmalıdır',
    'profileUpdated': 'Profil başarıyla güncellendi!',
    'accountMarkedForDeletion': 'Hesap silme için işaretlendi!',
    'accountUnmarkedForDeletion': 'Hesap silme işlemi iptal edildi!',
    
    // Not Found Messages
    'entryNotFoundTitle': 'Journal Entry Bulunamadı',
    'entryNotFoundExplanation': 'Aradığınız makale mevcut değil veya kaldırılmış olabilir.',
    'userNotFoundTitle': 'Kullanıcı Bulunamadı!',
    'userNotFoundExplanation': 'Kullanıcı verileri sunucudan yüklenemedi. Bu durum geçici bir ağ sorunu, sunucu bakımı veya derginin taşınmış ya da silinmiş olması nedeniyle ortaya çıkabilir. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenilemeyi deneyin. Sorun devam ederse, teknik destek ekibimizle iletişime geçin.',
    
    // Error Loading Messages
    'errorLoadingEntryTitle': 'Makale Yüklenirken Hata',
    'errorLoadingEntryExplanation': 'Makale yüklenemedi. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
    'errorLoadingUserTitle': 'Kullanıcı Yüklenirken Hata',
    'errorLoadingUserExplanation': 'Kullanıcı profili yüklenemedi. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
    'paperNotFoundTitle': 'Makale Bulunamadı!',
    'paperNotFoundExplanation': 'Makale verileri sunucudan yüklenemedi. Bu durum geçici bir ağ sorunu, sunucu bakımı veya derginin taşınmış ya da silinmiş olması nedeniyle ortaya çıkabilir. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenilemeyi deneyin. Sorun devam ederse, teknik destek ekibimizle iletişime geçin.',
    'paperNotFoundUpdateExplanation': 'Bu makalenin güncellemelerini yüklerken bir sorunla karşılaştık.',
          'tryAgain': 'Tekrar Dene',
      'addAuthorUpdate': 'Yazar Güncellemesi',
      'addRefereeUpdate': 'Hakem Değerlendirmesi',
      'participants': 'Katılımcı',
      'noParticipants': 'Katılımcı Bulunamadı',
          'pleaseConfirmEmail': 'Giriş yapmak için lütfen e-posta adresinizi onaylayın.',
    'incorrectCredentials': 'Hatalı e-posta veya şifre. Lütfen bilgilerinizi kontrol edin.',
    
    // Registration messages
    'registrationSuccessful': 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...',
    'registrationFailed': 'Kayıt başarısız. Lütfen tekrar deneyin.',
    'emailAlreadyRegistered': 'E-posta adresi zaten kayıtlı. Farklı bir e-posta kullanın veya giriş yapın.',
    'accountCreated': 'Hesap başarıyla oluşturuldu!',
    'registrationToastMessage': 'Hesap başarıyla oluşturuldu! Aktivasyon için e-postanızı onaylayınız.',
    
    // Copy functionality
    'copyFailed': 'Panoya kopyalama başarısız',
    'copyManually': 'Metni Manuel Olarak Kopyala',
    'copyManuallyInstructions': 'Lütfen aşağıdaki metni seçin ve kopyalayın:',
    'copyManuallyToast': 'Lütfen açılan pencereden metni manuel olarak kopyalayın',
    'close': 'Kapat',
    'copyUpdate': 'Güncellemeyi Kopyala',
    
    // Delete functionality
    'deleteUpdate': 'Girdiyi Sil',
    'confirmDeleteUpdateMessage': 'Bu',
    'authorUpdate': 'Yazar güncellemesini silmek istediğinize emin misiniz',
    'refereeUpdate': 'Hakem değerlendirmesini silmek istediğinize emin misiniz',
    'thisActionCannotBeUndone': 'Bu işlem geri alınamaz.',
    'updateDeleted': 'Güncelleme başarıyla silindi!',
    'deleteUpdateError': 'Güncelleme silinirken hata oluştu',
    
    // Badge labels for AdminPage
    'user': 'Kullanıcı',
    'journal': 'DERGİ',
    'paper': 'Makale', 
    'draft': 'Taslak',
    'founder': 'Kurucu',
    'author': 'Yazar',
    
    // Journal Entry Form specific translations
    'createNewJournalEntry': 'Yeni Makale Oluştur',
    'entryTitle': 'Başlık',
    'enterEntryTitle': 'Başlık giriniz',
    'entryTitleEn': 'Başlık (İngilizce)',
    'enterEntryTitleEn': 'İngilizce başlık giriniz',
    'abstractTurkish': 'Özet (Türkçe)',
    'abstractEnglish': 'Genişletilmiş Özet (İngilizce)',
    'enterAbstractTurkish': 'Türkçe özeti giriniz',
    'enterAbstractEnglish': 'Enter a brief summary in English...',
    'enterKeywordsComma': 'Anahtar kelimeleri virgül ile ayırarak giriniz',
    'entryLanguage': 'Dil',
    'submitEntry': 'Makale Gönder',
    'mustBeLoggedIn': 'Makale oluşturmak için giriş yapmalısınız.',
    'failedToCreateEntry': 'Makale oluşturulamadı.',
    'noActiveJournalSelected': 'Aktif Dergi Seçilmedi',
    'noActiveJournalMessage': 'Aktif dergi seçilmedi.',
    'selectAJournal': 'Bir dergi seçin',
    'toAssociateWithEntry': 'bu makale ile ilişkilendirmek için.',
    'entrySavedSecurelyMessage': 'İşlem ücreti ödemenizin ardından, makalenizin tamamını yükleyerek yayın sürecini başlatabilirsiniz.',
    'selectArticleType': '-- Makale Türü Seçin --',
    'articleTypeTheory': 'Teorik',
    'articleTypeResearch': 'Araştırma',
    'selectLanguage': '-- Dil Seçin --',
    'entryCreatedSuccessfully': 'Makale başarıyla oluşturuldu!',
    'entryUpdatedSuccessfully': 'Makale başarıyla güncellendi!',
    'entryDeletedSuccessfully': 'Makale başarıyla silindi!',
    'noResultsFound': 'Sonuç bulunamadı',
    'authorRemovedSuccessfully': 'Yazar başarıyla kaldırıldı',
    'failedToRemoveAuthor': 'Yazar kaldırma işlemi başarısız',

    // Citation translations
    'citeArticle': 'Alıntıla',
    'citeThisArticle': 'Bu Makaleyi Alıntıla',
    'copy': 'Kopyala',
    
    // Update conversation translations
    'noUpdates': 'Henüz Süreç Başlatılmadı',
    'startConversation': 'Makalenizin güncel bilgilerini girerek süreci başlatın',
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