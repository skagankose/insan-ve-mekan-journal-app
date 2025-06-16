export type Language = 'en' | 'tr';

/**
 * Format date according to the selected language
 */
export const formatDate = (
  dateString: string | undefined, 
  language: Language,
  options?: {
    includeTime?: boolean;
    format?: 'short' | 'long' | 'full';
  }
): string => {
  if (!dateString) return language === 'tr' ? 'Mevcut değil' : 'Not available';
  
  const { includeTime = false, format = 'long' } = options || {};
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return language === 'tr' ? 'Geçersiz tarih' : 'Invalid date';
  }
  
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  
  let formatOptions: Intl.DateTimeFormatOptions;
  
  if (includeTime) {
    formatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
  } else {
    switch (format) {
      case 'short':
        formatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };
        break;
      case 'full':
        formatOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };
        break;
      default: // 'long'
        formatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };
    }
  }
  
  return date.toLocaleDateString(locale, formatOptions);
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string, language: Language): string => {
  if (!dateString) return language === 'tr' ? 'Mevcut değil' : 'Not available';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return language === 'tr' ? 'Az önce' : 'Just now';
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return language === 'tr' 
      ? `${minutes} dakika önce`
      : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return language === 'tr'
      ? `${hours} saat önce`
      : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 2592000) { // 30 days
    const days = Math.floor(diffInSeconds / 86400);
    return language === 'tr'
      ? `${days} gün önce`
      : `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // For older dates, return formatted date
  return formatDate(dateString, language, { format: 'short' });
};

/**
 * Get role translation with proper casing
 */
export const getRoleTranslation = (role: string, language: Language): string => {
  const roleTranslations = {
    'author': language === 'tr' ? 'Yazar' : 'Author',
    'editor': language === 'tr' ? 'Editör' : 'Editor',
    'referee': language === 'tr' ? 'Hakem' : 'Referee',
    'admin': language === 'tr' ? 'Yönetici' : 'Admin',
    'owner': language === 'tr' ? 'Kurucu' : 'Owner'
  };
  
  return roleTranslations[role as keyof typeof roleTranslations] || role;
};

/**
 * Get role translation with uppercase for badges (Turkish specific formatting)
 */
export const getRoleTranslationForBadge = (role: string, language: Language): string => {
  const roleTranslations = {
    'author': language === 'tr' ? 'YAZAR' : 'Author',
    'editor': language === 'tr' ? 'EDİTÖR' : 'Editor',
    'referee': language === 'tr' ? 'HAKEM' : 'Referee',
    'admin': language === 'tr' ? 'YÖNETİCİ' : 'Admin',
    'owner': language === 'tr' ? 'KURUCU' : 'Owner'
  };
  
  return roleTranslations[role as keyof typeof roleTranslations] || role;
};

/**
 * Get status translation
 */
export const getStatusTranslation = (status: string, language: Language): string => {
  const statusTranslations = {
    'not_accepted': language === 'tr' ? 'Kabul Edilmedi' : 'Not Accepted',
    'waiting_for_payment': language === 'tr' ? 'Ödeme Bekleniyor' : 'Waiting for Payment',
    'waiting_for_authors': language === 'tr' ? 'Yazarlar Bekleniyor' : 'Waiting for Authors',
    'waiting_for_referees': language === 'tr' ? 'Hakemler Bekleniyor' : 'Waiting for Referees',
    'waiting_for_editors': language === 'tr' ? 'Editörler Bekleniyor' : 'Waiting for Editors',
    'rejected': language === 'tr' ? 'Reddedildi' : 'Rejected',
    'pending': language === 'tr' ? 'Beklemede' : 'Pending',
    'accepted': language === 'tr' ? 'Kabul Edildi' : 'Accepted',
    'published': language === 'tr' ? 'Yayınlandı' : 'Published',
    'draft': language === 'tr' ? 'Taslak' : 'Draft'
  };
  
  return statusTranslations[status as keyof typeof statusTranslations] || status;
}; 