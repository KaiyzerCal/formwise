import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { initSessionStore } from '@/components/bioneer/data/unifiedSessionStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  const [isLoadingPublicSettings]             = useState(false);
  const [authError, setAuthError]             = useState(null);
  const [appPublicSettings]                   = useState({ id: 'formwise' });

  // P1: Initialize voice coaching default for new users
  useEffect(() => {
    if (localStorage.getItem('formwise_ai_audio') === null) {
      localStorage.setItem('formwise_ai_audio', 'true');
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        try {
          const me = await base44.auth.me();
          setUser(me);
          setIsAuthenticated(true);
          setAuthError(null);
          // Initialize session store from cloud DB
          initSessionStore().catch(err => console.warn('[Auth] Session store init failed:', err.message));
        } catch (err) {
          if (err?.message?.includes('not registered')) {
            setAuthError({ type: 'user_not_registered', message: err.message });
          } else {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          }
        }
      } else {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
      setIsLoadingAuth(false);
    }).catch(() => {
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
      setIsLoadingAuth(false);
    });
  }, []);

  const logout = async (shouldRedirect = true) => {
    await base44.auth.logout(shouldRedirect ? '/' : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin();
  };

  const checkAppState = async () => {
    setIsLoadingAuth(true);
    try {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } catch {
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    }
    setIsLoadingAuth(false);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings, logout, navigateToLogin, checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};