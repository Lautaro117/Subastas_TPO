import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

//import {
//  clearSessionSnapshot,
//  loadSessionSnapshot,
//  saveSessionSnapshot,
//} from '../services/persistence/sessionStorage';

const AppSessionContext = createContext(undefined);

const initialSession = {
  isAuthenticated: false,
  entryMode: null,
  token: null,
  bootstrapped: false,
};

export function AppSessionProvider({ children }) {
  const [session, setSession] = useState(initialSession);

  useEffect(() => {
    let isActive = true;

    async function hydrateSession() {
      try {
        const snapshot = await loadSessionSnapshot();

        if (!isActive) {
          return;
        }

        if (snapshot) {
          setSession({
            ...initialSession,
            ...snapshot,
            bootstrapped: true,
          });
          return;
        }

        setSession((prev) => ({ ...prev, bootstrapped: true }));
      } catch (_error) {
        if (isActive) {
          setSession((prev) => ({ ...prev, bootstrapped: true }));
        }
      }
    }

    hydrateSession();

    return () => {
      isActive = false;
    };
  }, []);

  const enterApp = async (entryMode, token) => {
    const next = {
      ...session,
      isAuthenticated: true,
      entryMode,
      token: token ?? session.token,
    };

    try {
      await saveSessionSnapshot(next);
    } catch (_error) {
      // If persistence fails, keep the in-memory session so the app remains usable.
    }

    setSession((prev) => ({
      ...prev,
      isAuthenticated: true,
      entryMode,
      token: token ?? prev.token,
    }));
  };

  const setAuthToken = async (token) => {
    const next = { ...session, token };

    if (next.isAuthenticated) {
      try {
        await saveSessionSnapshot(next);
      } catch (_error) {
        // Keep the token in memory even if persistence fails.
      }
    }

    setSession((prev) => ({ ...prev, token }));
  };

  const exitApp = async () => {
    try {
      await clearSessionSnapshot();
    } catch (_error) {
      // The local in-memory cleanup still guarantees logout in the current app session.
    }

    setSession({ ...initialSession, bootstrapped: true });
  };

  const value = useMemo(
    () => ({
      session,
      enterApp,
      setAuthToken,
      exitApp,
    }),
    [session]
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }

  return context;
}