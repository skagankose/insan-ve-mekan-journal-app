/**
 * Utility functions for handling file downloads and URL construction
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // In development, use the proxy path
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use the current origin with /api path
  // This ensures the request goes through the nginx proxy
  return `${window.location.origin}/api`;
};

// Construct a full file URL from a relative path
export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  return `${getApiBaseUrl()}/${cleanPath}`;
};

// Handle file download with error handling
export const downloadFile = async (filePath: string, filename?: string): Promise<void> => {
  try {
    const fileUrl = getFileUrl(filePath);
    
    // Create a temporary anchor element for download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename || '';
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};

// Handle file viewing (open in new tab)
export const viewFile = (filePath: string): void => {
  try {
    const fileUrl = getFileUrl(filePath);
    window.open(fileUrl, '_blank');
  } catch (error) {
    console.error('Error viewing file:', error);
    throw new Error('Failed to view file');
  }
};

// Check if a file URL is accessible
export const checkFileAccess = async (filePath: string): Promise<boolean> => {
  try {
    const fileUrl = getFileUrl(filePath);
    const response = await fetch(fileUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking file access:', error);
    return false;
  }
}; 