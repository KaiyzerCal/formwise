import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  const [isLoadingPublicSettings]             = useState(false);
  const [authError, setAuthError]             = useState(null);
  const [appPublicSettings]                   = useState({ id: 'formwise' });

  useEffect(() => {
    const init = async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (authed) {
          const me = await base44.auth.me();
          setUser({
            id:    me.id,
            email: me.email,
            name:  me.full_name || me.email?.split('@')[0] || 'User',
          });
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      } catch (err) {
        if (err?.message?.includes('not registered') || err?.type === 'user_not_registered') {
          setAuthError({ type: 'user_not_registered', message: err.message });
        } else {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    init();
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
        setUser({
          id:    me.id,
          email: me.email,
          name:  me.full_name || me.email?.split('@')[0] || 'User',
        });
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } catch {
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
    }
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