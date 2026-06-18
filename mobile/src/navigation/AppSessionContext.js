import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from '../services/persistence/sessionStorage';

import { getRegisterStatus } from '../services/authApi';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
} from '../services/notificationsApi';

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
  // Notificaciones locales (solo registro_aprobado, campanita offline, etc.)
  const [localNotifications, setLocalNotifications] = useState([]);
  // Notificaciones del backend completas (se cargan solo al abrir NotificationsScreen)
  const [apiNotifications, setApiNotifications] = useState([]);
  // Conteo de no leídas del backend (se actualiza por polling liviano cada 30s)
  const [apiUnreadCount, setApiUnreadCount] = useState(0);

  const pollingRef = useRef(null);       // polling de aprobación de registro
  const notifPollingRef = useRef(null);  // polling liviano de conteo de notificaciones

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

  // ─── Polling LIVIANO de conteo de notificaciones ──────────────────────────
  // Usa el endpoint /unread-count (una sola columna) en lugar de traer la lista
  // completa. Esto evita re-renders pesados en SalaSubastaScreen durante una puja.
  useEffect(() => {
    const token = session.token;
    const canPoll = session.isAuthenticated && token &&
      session.entryMode !== 'guest-login' && session.entryMode !== 'pending-register';

    if (!canPoll) {
      if (notifPollingRef.current) {
        clearInterval(notifPollingRef.current);
        notifPollingRef.current = null;
      }
      setApiNotifications([]);
      setApiUnreadCount(0);
      return;
    }

    let isActive = true;

    async function pollUnreadCount() {
      try {
        const result = await getUnreadCount(token);
        if (isActive && result?.count != null) {
          setApiUnreadCount(result.count);
        }
      } catch {
        // silent — reintenta en el próximo ciclo
      }
    }

    pollUnreadCount();
    notifPollingRef.current = setInterval(pollUnreadCount, 30000); // cada 30s

    return () => {
      isActive = false;
      if (notifPollingRef.current) {
        clearInterval(notifPollingRef.current);
        notifPollingRef.current = null;
      }
    };
  }, [session.token, session.isAuthenticated, session.entryMode]);

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

          setSession((prev) => ({
            ...prev,
            registroAprobado: true,
            registroToken: response.tokenRegistro,
          }));

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
        // silent
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
    if (notifPollingRef.current) {
      clearInterval(notifPollingRef.current);
      notifPollingRef.current = null;
    }
    try { await clearSessionSnapshot(); } catch {}
    setLocalNotifications([]);
    setApiNotifications([]);
    setApiUnreadCount(0);
    setSession({ ...initialSession, bootstrapped: true });
  };

  const markLocalNotificationRead = (id) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  /**
   * Crea una notificación en el backend y la agrega al estado local inmediatamente.
   * Se usa para notificaciones de campanita de ítem próximo.
   */
  const addRemoteNotification = async (tipo, mensaje) => {
    const token = session.token;
    if (!token) return;
    try {
      const created = await createNotification(token, tipo, mensaje);
      if (created) {
        setApiNotifications((prev) => {
          if (prev.some((n) => n.id === created.id)) return prev;
          return [created, ...prev];
        });
        setApiUnreadCount((prev) => prev + 1);
      }
    } catch {
      // Si falla la creación remota, igual agregar localmente
      setLocalNotifications((prev) => [
        {
          id: `local-${Date.now()}`,
          tipo,
          mensaje,
          leida: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  /**
   * Marca todas las notificaciones del backend como leídas y resetea el conteo.
   */
  const markAllApiNotificationsRead = async () => {
    const token = session.token;
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setApiNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      setApiUnreadCount(0);
    } catch {
      // silent
    }
  };

  /**
   * Refresca la lista completa de notificaciones del backend
   * (llamar al abrir NotificationsScreen, no en background).
   */
  const refreshApiNotifications = async () => {
    const token = session.token;
    if (!token) return;
    try {
      const data = await getNotifications(token);
      if (Array.isArray(data)) {
        setApiNotifications(data);
        // Sincronizar conteo con la lista real
        setApiUnreadCount(data.filter((n) => !n.leida).length);
      }
    } catch {
      // silent
    }
  };

  // Conteo total de no leídas: conteo API (liviano, polleado) + locales
  const unreadNotificationsCount =
    apiUnreadCount +
    localNotifications.filter((n) => !n.leida).length;

  const value = useMemo(
    () => ({
      session,
      localNotifications,
      apiNotifications,
      unreadNotificationsCount,
      enterApp,
      enterAsPendingGuest,
      enterAsGuestLoginWithPending,
      setAuthToken,
      initiateRegistrationCompletion,
      exitApp,
      markLocalNotificationRead,
      addRemoteNotification,
      markAllApiNotificationsRead,
      refreshApiNotifications,
    }),
    // apiNotifications solo cambia al abrir NotificationsScreen (no en background).
    // apiUnreadCount cambia cada 30s pero es un número primitivo, comparación barata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, localNotifications, apiNotifications, apiUnreadCount, unreadNotificationsCount]
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
