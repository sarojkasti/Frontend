/**
 * Authentication utilities for managing auth token and session state
 */

/**
 * Extracts the auth token from cookies and stores it in localStorage
 * 
 * This function checks for the auth token in cookies and if found,
 * stores it in localStorage for easier access
 */
export const extractAndStoreAuthToken = (): string | null => {
  // Try to find token in cookies
  const cookieString = document.cookie;
  const tokenMatch = cookieString.match(/(?:^|;\s*)AccessToken=([^;]*)/);
  if (tokenMatch && tokenMatch[1]) {
    const token = decodeURIComponent(tokenMatch[1]);
    // Store token in localStorage
    localStorage.setItem('access_token', token);
    return token;
  }
  return null;
};

/**
 * Checks if the user is currently authenticated
 * 
 * @returns boolean indicating whether the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

/**
 * Gets the current auth token from localStorage
 * 
 * @returns The auth token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Clears all auth-related data from localStorage and cookies
 */
export const clearAuth = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('userId');
  sessionStorage.removeItem('loginMessage');

  // Clear client-accessible cookies across all common domains and paths
  const cookiesToClear = ['ExpiresIn', 'AccessToken', 'Authentication', 'Refresh'];
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const domains = ['', host, `.${host}`, 'localhost', '.sarojkasti.com.np', 'backend.sarojkasti.com.np'];
  const paths = ['/', ''];

  cookiesToClear.forEach((cookieName) => {
    domains.forEach((domain) => {
      paths.forEach((path) => {
        const domainPart = domain ? `; domain=${domain}` : '';
        const pathPart = path ? `; path=${path}` : '; path=/';
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pathPart}${domainPart}`;
      });
    });
  });
};