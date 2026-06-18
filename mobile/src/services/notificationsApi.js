import { buildApiUrl } from '../config/api';

function authHeaders(token) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** GET /api/notifications — lista todas las notificaciones del usuario */
export async function getNotifications(token) {
  const res = await fetch(buildApiUrl('/api/notifications'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Error al obtener notificaciones: ${res.status}`);
  return res.json();
}

/** GET /api/notifications/unread-count — { count: N } */
export async function getUnreadCount(token) {
  const res = await fetch(buildApiUrl('/api/notifications/unread-count'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Error al obtener conteo: ${res.status}`);
  return res.json(); // { count: N }
}

/** POST /api/notifications — crea una notificación para el propio usuario */
export async function createNotification(token, tipo, mensaje) {
  const res = await fetch(buildApiUrl('/api/notifications'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ tipo, mensaje }),
  });
  if (!res.ok) throw new Error(`Error al crear notificación: ${res.status}`);
  return res.json();
}

/** POST /api/notifications/read-all — marca todas como leídas */
export async function markAllNotificationsRead(token) {
  const res = await fetch(buildApiUrl('/api/notifications/read-all'), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Error al marcar leídas: ${res.status}`);
  return res.json(); // número de notificaciones marcadas
}

/** PATCH /api/notifications/:id/read — marca una como leída */
export async function markNotificationRead(token, id) {
  const res = await fetch(buildApiUrl(`/api/notifications/${id}/read`), {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Error al marcar leída: ${res.status}`);
  return res.json();
}
