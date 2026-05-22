import { buildApiUrl } from '../config/api';

function parseErrorBody(rawBody) {
  if (!rawBody) {
    return '';
  }

  try {
    const parsed = JSON.parse(rawBody);
    return parsed?.message || parsed?.error || parsed?.detail || parsed?.title || rawBody;
  } catch (_error) {
    return rawBody;
  }
}

function mapLoginError(status, fallbackMessage) {
  if (status === 401) {
    return 'Credenciales incorrectas';
  }

  if (status === 403) {
    return 'Cuenta bloqueada';
  }

  if (status >= 500) {
    return 'Error del servidor. Intenta de nuevo.';
  }

  return fallbackMessage || 'No se pudo iniciar sesion';
}

function mapRegisterError(status, fallbackMessage) {
  if (status === 400) {
    return fallbackMessage || 'Faltan campos requeridos';
  }

  if (status === 409) {
    return 'El email ya esta registrado';
  }

  if (status === 413) {
    return 'La imagen supera el tamaño maximo permitido (5MB)';
  }

  if (status === 422) {
    return fallbackMessage || 'No se pudo procesar el registro';
  }

  if (status >= 500) {
    return fallbackMessage || 'Error del servidor. Intenta de nuevo.';
  }

  return fallbackMessage || 'No se pudo completar el registro';
}

export async function loginRequest({ email, password }) {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  let payload = null;

  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(mapLoginError(response.status, backendMessage));
  }

  return payload;
}

export async function registerRequest(formData) {
  const response = await fetch(buildApiUrl('/api/auth/register'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  let payload = null;

  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(mapRegisterError(response.status, backendMessage));
  }

  return payload;
}

export async function getRegisterStatus(solicitudId) {
  const response = await fetch(buildApiUrl(`/api/auth/status/${solicitudId}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  let payload = null;

  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(backendMessage || 'No se pudo consultar el estado del registro');
  }

  return payload;
}
