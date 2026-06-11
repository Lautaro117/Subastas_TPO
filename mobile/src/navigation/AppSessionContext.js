import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from '../services/persistence/sessionStorage';

import { getRegisterStatus } from '../services/authApi';

const AppSessionContext = createContext(undefined);

const initialSession = {
  isAuthenticated: false,
  entryMode: null,
  token: null,
  bootstrapped: false,
  solicitudId: null,
  registroAprobado: false,
  registroToken: null,
};

export function AppSessionProvider({ children }) {
  const [session, setSession] = useState(initialSession);
  const [localNotifications, setLocalNotifications] = useState([]);
  const pollingRef = useRef(null);

  // ─── Hidratación inicial ───────────────────────────────────────────────────
  useEffect(() => {
    let isActive = true;

    async function hydrateSession() {
      try {
        const snapshot = await loadSessionSnapshot();
        if (!isActive) return;
        if (snapshot) {
          if (snapshot.entryMode === 'guest-login' || snapshot.entryMode === 'pending-register') {
            await clearSessionSnapshot();
          } else {
            setSession({ ...initialSession, ...snapshot, bootstrapped: true });
            return;
          }
        }
        setSession((prev) => ({ ...prev, bootstrapped: true }));
      } catch {
        if (isActive) setSession((prev) => ({ ...prev, bootstrapped: true }));
      }
    }

    hydrateSession();
    return () => { isActive = false; };
  }, []);

  // ─── Polling de aprobación ─────────────────────────────────────────────────
  useEffect(() => {
    const sid = session.solicitudId;
    const isPending =
      session.isAuthenticated &&
      (session.entryMode === 'pending-register' || session.entryMode === 'guest-login') &&
      sid;

    if (!isPending || session.registroAprobado) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Si ya existe la notificación de aprobación no seguir poliando
    if (localNotifications.some((n) => n.tipo === 'registro_aprobado')) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    let isActive = true;

    async function checkStatus() {
      try {
        const response = await getRegisterStatus(sid);
        if (!isActive) return;

        if (response?.admitido === 'si' && response?.tokenRegistro) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;

          // Guardar el token de registro en el contexto
          setSession((prev) => ({
            ...prev,
            registroAprobado: true,
            registroToken: response.tokenRegistro,
          }));

          // Agregar notificación local
          setLocalNotifications((prev) => {
            if (prev.some((n) => n.tipo === 'registro_aprobado')) return prev;
            return [
              ...prev,
              {
                id: `approval-${Date.now()}`,
                tipo: 'registro_aprobado',
                mensaje: 'Tu cuenta fue aprobada. Tocá "Finalizar registro" para continuar.',
                leida: false,
                createdAt: new Date().toISOString(),
              },
            ];
          });
        }
      } catch {
        // silent — reintenta en el próximo ciclo
      }
    }

    checkStatus();
    pollingRef.current = setInterval(checkStatus, 30000);

    return () => {
      isActive = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [session.solicitudId, session.entryMode, session.registroAprobado, localNotifications]);

  // ─── Acciones ──────────────────────────────────────────────────────────────
  const enterApp = async (entryMode, token) => {
    // Siempre limpia cualquier estado de registro pendiente al transicionar
    // a un modo autenticado, para evitar que solicitudId residual active el polling.
    const next = {
      ...session,
      isAuthenticated: true,
      entryMode,
      token: token ?? session.token,
      solicitudId: null,
      registroAprobado: false,
      registroToken: null,
    };
    try { await saveSessionSnapshot(next); } catch {}
    setSession((prev) => ({
      ...prev,
      isAuthenticated: true,
      entryMode,
      token: token ?? prev.token,
      solicitudId: null,
      registroAprobado: false,
      registroToken: null,
    }));
  };

  // Llamar después del registro — guarda solicitudId y activa el polling
  const enterAsPendingGuest = async (solicitudId) => {
  const next = {
    ...initialSession,
    isAuthenticated: false,
    entryMode: 'pending-register',
    token: null,
    solicitudId,
    bootstrapped: true,
  };
    try { await saveSessionSnapshot(next); } catch {}
    setSession(next);
  };

  // Camino 2 del flujo de registro: el usuario presiona "Continuar como invitado"
  // desde RegisterVerificationScreen sabiendo que tiene un registro pendiente.
  // A diferencia de enterApp, esta función establece solicitudId explícitamente
  // para que el polling del contexto se active y entregue la notificación de aprobación.
  const enterAsGuestLoginWithPending = async (solicitudId) => {
    const next = {
      ...initialSession,
      isAuthenticated: true,
      entryMode: 'guest-login',
      token: null,
      solicitudId,
      bootstrapped: true,
    };
    try { await saveSessionSnapshot(next); } catch {}
    setSession(next);
  };

  const setAuthToken = async (token) => {
    if (token === session.token) return;
    const next = { ...session, token };
    if (next.isAuthenticated) {
      try { await saveSessionSnapshot(next); } catch {}
    }
    setSession((prev) => ({ ...prev, token }));
  };

  // Transiciona a AuthStack → RegisterFinalizePassword
  const initiateRegistrationCompletion = () => {
    setLocalNotifications([]);
    setSession((prev) => ({
      ...prev,
      isAuthenticated: false,
      entryMode: 'finalizing',
    }));
  };

  const exitApp = async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    try { await clearSessionSnapshot(); } catch {}
    setLocalNotifications([]);
    setSession({ ...initialSession, bootstrapped: true });
  };

  const markLocalNotificationRead = (id) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const unreadNotificationsCount = localNotifications.filter((n) => !n.leida).length;

  const value = useMemo(
    () => ({
      session,
      localNotifications,
      unreadNotificationsCount,
      enterApp,
      enterAsPendingGuest,
      enterAsGuestLoginWithPending,
      setAuthToken,
      initiateRegistrationCompletion,
      exitApp,
      markLocalNotificationRead,
    }),
    [session, localNotifications, unreadNotificationsCount]
  );

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }
  return context;
}