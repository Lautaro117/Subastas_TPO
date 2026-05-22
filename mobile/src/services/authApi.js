import { buildApiUrl } from '../config/api';

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
    return 'Faltan campos requeridos';
  }

  if (status === 409) {
    return 'El email ya esta registrado';
  }

  if (status === 413) {
    return 'La imagen supera el tamaño maximo permitido (5MB)';
  }

  if (status === 422) {
    return 'No se pudo procesar el registro';
  }

  if (status >= 500) {
    return 'Error del servidor. Intenta de nuevo.';
  }

  return fallbackMessage || 'No se pudo completar el registro';
}

export async function loginRequest({ email, password }) {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const backendMessage = payload?.message || payload?.error;

    throw new Error(mapLoginError(response.status, backendMessage));
  }

  return payload;
}

export async function registerRequest(formData) {
  const response = await fetch(buildApiUrl('/api/auth/register'), {
    method: 'POST',
    body: formData,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const backendMessage = payload?.message || payload?.error;
    throw new Error(mapRegisterError(response.status, backendMessage));
  }

  return payload;
}

export async function getRegisterStatus(solicitudId) {
  const response = await fetch(buildApiUrl(`/api/auth/status/${solicitudId}`), {
    method: 'GET',
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const backendMessage = payload?.message || payload?.error;
    throw new Error(backendMessage || 'No se pudo consultar el estado del registro');
  }

  return payload;
}
