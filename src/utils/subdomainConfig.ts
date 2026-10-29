/**
 * Subdomain configuration for client portal
 * 
 * Production Setup:
 * - Staff portal: task.artha.com.np
 * - Client portal: client.artha.com.np
 * 
 * Development:
 * - Uses path-based routing on localhost
 * 
 * Set VITE_CLIENT_SUBDOMAIN env variable to configure the client subdomain prefix
 */

const CLIENT_SUBDOMAIN_PREFIX = import.meta.env.VITE_CLIENT_SUBDOMAIN || 'client';

/**
 * Check if the current hostname indicates we're on the client portal subdomain
 * Returns true for: client.artha.com.np, client.example.com, etc.
 */
export const isClientPortalDomain = (): boolean => {
  const hostname = window.location.hostname;
  
  // Check for subdomain pattern: client.artha.com.np or client.example.com
  const parts = hostname.split('.');
  
  // Check if first part matches client subdomain prefix
  // Works for: client.artha.com.np, client.localhost, client.example.com
  if (parts.length >= 2 && parts[0] === CLIENT_SUBDOMAIN_PREFIX) {
    return true;
  }
  
  // For development on localhost: also check path-based routes
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const path = window.location.pathname;
    if (path.startsWith('/client-portal') || 
        path.startsWith('/client-login') || 
        path.startsWith('/client-forgot-password') ||
        path.startsWith('/client/reset-password')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if we should redirect staff users away from client portal
 */
export const isClientOnlyRoute = (pathname: string): boolean => {
  return pathname.startsWith('/client-portal') || 
         pathname.startsWith('/client-login') ||
         pathname.startsWith('/client-forgot-password') ||
         pathname.startsWith('/client/reset-password');
};

/**
 * Check if we should redirect client users away from staff portal
 */
export const isStaffOnlyRoute = (pathname: string): boolean => {
  const clientRoutes = [
    '/client-portal',
    '/client-login', 
    '/client-forgot-password',
    '/client/reset-password'
  ];
  
  // Public routes accessible by both
  const publicRoutes = ['/login', '/signup', '/register', '/forgot-password', '/reset', '/verify', '/activate-account'];
  
  // If it's a client route, it's not staff-only
  if (clientRoutes.some(route => pathname.startsWith(route))) {
    return false;
  }
  
  // If it's a public route, it's not staff-only
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return false;
  }
  
  // Everything else is staff-only
  return true;
};

/**
 * Get the base URL for the client portal
 */
export const getClientPortalUrl = (): string => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  // If already on client subdomain, return current origin
  if (isClientPortalDomain()) {
    return `${protocol}//${host}`;
  }
  
  // For production: construct client subdomain URL
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // For localhost development, use path-based routing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${host}/client-login`;
  }
  
  // For production with domain: prepend client subdomain
  const parts = hostname.split('.');
  if (parts[0] === 'app' || parts[0] === 'www') {
    parts[0] = CLIENT_SUBDOMAIN_PREFIX;
  } else {
    parts.unshift(CLIENT_SUBDOMAIN_PREFIX);
  }
  
  const clientHost = parts.join('.') + (port ? `:${port}` : '');
  return `${protocol}//${clientHost}`;
};

/**
 * Get the base URL for the staff portal
 */
export const getStaffPortalUrl = (): string => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  // If not on client subdomain, return current origin
  if (!isClientPortalDomain()) {
    return `${protocol}//${host}`;
  }
  
  // For production: construct staff subdomain URL
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // For localhost development, use path-based routing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${host}/login`;
  }
  
  // For production with client subdomain: remove it
  const parts = hostname.split('.');
  if (parts[0] === CLIENT_SUBDOMAIN_PREFIX) {
    parts.shift();
    // Add 'app' prefix if needed
    if (!parts[0].startsWith('app')) {
      parts.unshift('app');
    }
  }
  
  const staffHost = parts.join('.') + (port ? `:${port}` : '');
  return `${protocol}//${staffHost}`;
};
