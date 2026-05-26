import React, { createContext, useContext, useMemo, useState } from 'react';

const AppSessionContext = createContext(undefined);

export function AppSessionProvider({ children }) {
  const [session, setSession] = useState({
    isAuthenticated: false,
    entryMode: null,
    token: null,
  });

  const enterApp = (entryMode, token = null) => {
    setSession({
      isAuthenticated: true,
      entryMode,
      token,
    });
  };

  const exitApp = () => {
    setSession({
      isAuthenticated: false,
      entryMode: null,
      token: null,
    });
  };

  const value = useMemo(
    () => ({
      session,
      enterApp,
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