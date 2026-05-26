import { buildApiUrl } from '../config/api';

function parseErrorBody(rawBody) {
  if (!rawBody) return '';
  try {
    const parsed = JSON.parse(rawBody);
    return parsed?.message || parsed?.error || rawBody;
  } catch {
    return rawBody;
  }
}

async function authedRequest(path, token, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  if (!response.ok) {
    throw new Error(backendMessage || 'Error en la solicitud');
  }

  try {
    return rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return null;
  }
}

export async function getMisProductos(token) {
  return authedRequest('/api/my-items', token);
}

export async function agregarProducto(token, datos) {
  return authedRequest('/api/my-items', token, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function aceptarPropuesta(token, productoId) {
  return authedRequest(`/api/my-items/${productoId}/accept`, token, {
    method: 'POST',
  });
}

export async function rechazarPropuesta(token, productoId) {
  return authedRequest(`/api/my-items/${productoId}/reject`, token, {
    method: 'POST',
  });
}