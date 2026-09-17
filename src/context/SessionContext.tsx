import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { useProfile } from "@/hooks/user/useProfile";
import { clearAuth, extractAndStoreAuthToken, isAuthenticated as checkIsAuthenticated } from "@/utils/auth";
import { PermissionChecker, PermissionObject } from "@/lib/permissions";

type Profile = {
  id?: string;
  role?: {
    id?: string;
    name?: string;
    displayName?: string;
    permission: PermissionObject[];
  };
  status?: string;
  email?: string;
  avatar?: string | null;
  name?: string;
};

type SessionContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  profile?: Profile;
  isProfilePending?: boolean;
  permissions?: PermissionObject[];
  permissionChecker: PermissionChecker;
  refreshAuth?: () => void;
  logoutSession?: () => void;
};

const defaultChecker = new PermissionChecker([], '');

const SessionContext = createContext<SessionContextType>({
  isAuthenticated: false,
  loading: true,
  profile: undefined,
  isProfilePending: false,
  permissions: [],
  permissionChecker: defaultChecker,
  refreshAuth: () => {},
  logoutSession: () => {},
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cookies] = useCookies(["ExpiresIn"]);
  const [loading, setLoading] = useState(true);
  const { data: profile, isPending: isProfilePending, error } =
    useProfile(isAuthenticated);

  // On initial load, extract token from cookies and store in localStorage
  useEffect(() => {
    
    extractAndStoreAuthToken();
    
    // Check both cookies and localStorage for authentication
    const currentDateTime = new Date().getTime();
    const expiresInDateTime = cookies?.ExpiresIn && !isNaN(new Date(cookies.ExpiresIn).getTime())
      ? new Date(cookies.ExpiresIn).getTime()
      : 0;
    
    const isAuthByExpiry = expiresInDateTime >= currentDateTime;
    const isAuthByToken = checkIsAuthenticated();
    
    // If either method confirms authentication, consider the user authenticated
    const newAuthState = isAuthByExpiry || isAuthByToken;
    
    // Only update if state actually changed to prevent unnecessary re-renders
    setIsAuthenticated(prevAuth => {
      if (prevAuth !== newAuthState) {
        
      }
      return newAuthState;
    });
    setLoading(false);
  }, [cookies]);

  useEffect(() => {
    if (error) {
      
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [error]);

  // Check user status and automatically log out blocked/suspended/inactive users
  useEffect(() => {
    if (profile && profile.status && ['suspended', 'inactive', 'blocked'].includes(profile.status)) {
      
      setIsAuthenticated(false);
      setLoading(false);
      
      // Clear authentication data
      localStorage.removeItem('access_token');
      localStorage.removeItem('userId');
      
      // Redirect to login with a message
      if (typeof window !== 'undefined') {
        const statusMessages = {
          'inactive': 'Your account is inactive. Please contact the administrator.',
          'blocked': 'Your account has been blocked. Please contact the administrator.',
          'suspended': 'Your account has been suspended. Please contact the administrator.',
        };
        
        const message = statusMessages[profile.status as keyof typeof statusMessages] || 'Account access restricted.';
        
        // Store message in sessionStorage to display on login page
        sessionStorage.setItem('loginMessage', message);
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
  }, [profile]);

  useEffect(() => {
    if (profile && profile.id) {
      localStorage.setItem('userId', profile.id);
      
    }
  }, [profile]);

  // Function to manually refresh authentication state
  const refreshAuth = () => {
    
    const isAuthByToken = checkIsAuthenticated();
    const currentDateTime = new Date().getTime();
    const expiresInDateTime = cookies?.ExpiresIn && !isNaN(new Date(cookies.ExpiresIn).getTime())
      ? new Date(cookies.ExpiresIn).getTime()
      : 0;
    const isAuthByExpiry = expiresInDateTime >= currentDateTime;
    
    setIsAuthenticated(isAuthByExpiry || isAuthByToken);
    setLoading(false);
  };

  // Function to immediately terminate session state
  const logoutSession = () => {
    clearAuth();
    setIsAuthenticated(false);
    setLoading(false);
  };

  // Memoize permission checker for high performance access control across the entire frontend
  const permissionChecker = useMemo(() => {
    const perms = profile?.role?.permission || [];
    const roleName = profile?.role?.name || '';
    return new PermissionChecker(perms, roleName);
  }, [profile]);

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        loading,
        profile,
        isProfilePending,
        permissions: profile?.role?.permission || [],
        permissionChecker,
        refreshAuth,
        logoutSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
