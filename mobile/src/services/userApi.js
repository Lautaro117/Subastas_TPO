import { buildApiUrl } from '../config/api';

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function parseErrorBody(rawBody) {
  if (!rawBody) return '';
  try {
    const parsed = JSON.parse(rawBody);
    return parsed?.message || parsed?.error || parsed?.detail || rawBody;
  } catch {
    return rawBody;
  }
}

export async function getMyProfile(token) {
  const response = await fetch(buildApiUrl('/api/users/me'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeader(token),
    },
  });

  const rawBody = await response.text();

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada');
    throw new Error('No se pudo cargar el perfil');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export async function updateMyProfile(data, token) {
  const response = await fetch(buildApiUrl('/api/users/me'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(data),
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada');
    if (response.status === 400) throw new Error(backendMessage || 'Datos inválidos');
    throw new Error(backendMessage || 'No se pudo actualizar el perfil');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
