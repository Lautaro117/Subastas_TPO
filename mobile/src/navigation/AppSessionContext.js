import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getRegisterStatus } from '../services/authApi';

const AppSessionContext = createContext(undefined);

// Key used to persist the solicitudId across app restarts so polling can resume.
const ASYNC_KEY = '@subastas:pending_solicitud_id';

export function AppSessionProvider({ children }) {
  // isLoading: true while AsyncStorage is being read on mount.
  // NavigationContainer must not render until this is false, otherwise initialRouteName
  // is computed before the restored state is available (race condition).
  const [isLoading, setIsLoading] = useState(true);

  const [session, setSession] = useState({
    isAuthenticated: false,
    // entryMode: 'auth' | 'guest' | 'pending-register' | 'finalizing' | null
    entryMode: null,
    token: null,
  });

  const [pendingRegistration, setPendingRegistration] = useState({
    solicitudId: null,
    registroToken: null,
  });

  const [localNotifications, setLocalNotifications] = useState([]);
  const [pollingError, setPollingError] = useState(null);

  const unreadNotificationsCount = useMemo(
    () => localNotifications.filter((n) => !n.leida).length,
    [localNotifications]
  );

  // On mount: restore pending-register state from AsyncStorage.
  // Sets isLoading=false when done (success or failure) so NavigationContainer can mount
  // with the correct initial route already in place.
  useEffect(() => {
    AsyncStorage.getItem(ASYNC_KEY)
      .then((stored) => {
        if (stored) {
          setPendingRegistration({ solicitudId: stored, registroToken: null });
          // isAuthenticated: false → AuthStack renders → initialRoute = 'RegisterVerification'
          setSession({ isAuthenticated: false, entryMode: 'pending-register', token: null });
        }
      })
      .catch(() => {
        // Read failed — start fresh, no restore.
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Declarative polling: runs automatically whenever the user is authenticated as
  // a pending-register guest inside MainTabs. React manages the lifecycle — no manual
  // start/stop calls needed. Survives Fast Refresh because the effect re-runs on remount.
  useEffect(() => {
    const sid = pendingRegistration.solicitudId;

    // Only poll when the user is inside MainTabs as a pending-register guest.
    if (!session.isAuthenticated || session.entryMode !== 'pending-register' || !sid) return;

    // Stop polling once the approval notification already exists.
    if (localNotifications.some((n) => n.tipo === 'registro_aprobado')) return;

    let isActive = true;

    const checkStatus = async () => {
      if (!isActive) return;
      try {
        const response = await getRegisterStatus(sid);
        if (!isActive) return;

        if (response?.admitido === 'si') {
          setPollingError(null);
          if (response.tokenRegistro) {
            setPendingRegistration((prev) => ({ ...prev, registroToken: response.tokenRegistro }));
          }
          setLocalNotifications((prev) => {
            if (prev.some((n) => n.tipo === 'registro_aprobado')) return prev;
            return [
              ...prev,
              {
                id: `approval-${Date.now()}`,
                tipo: 'registro_aprobado',
                mensaje: 'Tu cuenta fue aprobada. Ingresá para finalizar con el registro.',
                leida: false,
                createdAt: new Date().toISOString(),
              },
            ];
          });
        } else {
          setPollingError(null);
        }
      } catch {
        setPollingError('No se pudo verificar el estado. Reintentando...');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [
    session.isAuthenticated,
    session.entryMode,
    pendingRegistration.solicitudId,
    localNotifications,
  ]);

  const enterApp = (entryMode, token) => {
    setSession((prev) => ({
      isAuthenticated: true,
      entryMode,
      token: token ?? prev.token,
    }));
  };

  const enterAppAsPendingGuest = (sid) => {
    setPendingRegistration({ solicitudId: sid, registroToken: null });
    setSession({ isAuthenticated: true, entryMode: 'pending-register', token: null });
    AsyncStorage.setItem(ASYNC_KEY, String(sid)).catch(() => {});
    // No manual polling call needed — the declarative useEffect above starts automatically.
  };

  // Transitions to AuthStack with RegisterFinalizePassword as the entry route.
  const initiateRegistrationCompletion = () => {
    setSession((prev) => ({ ...prev, isAuthenticated: false, entryMode: 'finalizing' }));
  };

  // Called after the user successfully sets their password from the finalizing flow.
  const completeRegistrationFromGuest = (token) => {
    setPendingRegistration({ solicitudId: null, registroToken: null });
    setLocalNotifications([]);
    setPollingError(null);
    AsyncStorage.removeItem(ASYNC_KEY).catch(() => {});
    setSession({ isAuthenticated: true, entryMode: 'auth', token });
  };

  const setAuthToken = (token) => {
    setSession((prev) => ({ ...prev, token }));
  };

  const exitApp = () => {
    setPendingRegistration({ solicitudId: null, registroToken: null });
    setLocalNotifications([]);
    setPollingError(null);
    AsyncStorage.removeItem(ASYNC_KEY).catch(() => {});
    setSession({ isAuthenticated: false, entryMode: null, token: null });
  };

  const markLocalNotificationRead = (id) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const value = useMemo(
    () => ({
      isLoading,
      session,
      pendingRegistration,
      localNotifications,
      unreadNotificationsCount,
      pollingError,
      enterApp,
      enterAppAsPendingGuest,
      initiateRegistrationCompletion,
      completeRegistrationFromGuest,
      setAuthToken,
      exitApp,
      markLocalNotificationRead,
    }),
    [isLoading, session, pendingRegistration, localNotifications, unreadNotificationsCount, pollingError]
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