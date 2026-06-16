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

export async function agregarProducto(token, descripcionCatalogo, descripcionCompleta, fotos) {
  const formData = new FormData();
  formData.append('descripcionCatalogo', descripcionCatalogo);
  formData.append('descripcionCompleta', descripcionCompleta);

  for (const foto of fotos) {
    formData.append('fotos', {
      uri: foto.uri,
      name: foto.fileName || 'foto.jpg',
      type: foto.mimeType || 'image/jpeg',
    });
  }

  const response = await fetch(buildApiUrl('/api/my-items'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  if (!response.ok) {
    throw new Error(backendMessage || 'No se pudo agregar el producto');
  }

  try {
    return rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return null;
  }
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

export async function marcarEnviado(token, productoId) {
  return authedRequest(`/api/my-items/${productoId}/shipped`, token, { method: 'POST' });
}

export async function getCustodia(token, productoId) {
  return authedRequest(`/api/my-items/${productoId}/custody`, token);
}

export async function getMisCompras(token) {
  return authedRequest('/api/my-purchases', token);
}