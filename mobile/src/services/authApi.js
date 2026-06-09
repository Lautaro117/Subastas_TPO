import { buildApiUrl, buildAuthHeaders } from '../config/api';


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
    return 'Error del servidor. Intenta de nuevo.';
  }

  return fallbackMessage || 'No se pudo completar el registro';
}

function mapStatusQueryError(status, fallbackMessage) {
  if (status === 404) {
    return 'No se encontro la solicitud de registro';
  }

  if (status >= 500) {
    return 'Error del servidor. Intenta de nuevo.';
  }

  return fallbackMessage || 'No se pudo consultar el estado del registro';
}

function mapCountriesError(status, fallbackMessage) {
  if (status >= 500) {
    return 'No se pudo cargar el catalogo de paises';
  }

  return fallbackMessage || 'No se pudo cargar el catalogo de paises';
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
    throw new Error(mapStatusQueryError(response.status, backendMessage));
  }

  return payload;
}

export async function getRegisterCountries() {
  const response = await fetch(buildApiUrl('/api/auth/countries'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const rawBody = await response.text();
  const backendMessage = parseErrorBody(rawBody);

  let payload = null;

  try {
    payload = rawBody ? JSON.parse(rawBody) : [];
  } catch (_error) {
    payload = [];
  }

  if (!response.ok) {
    throw new Error(mapCountriesError(response.status, backendMessage));
  }

  return Array.isArray(payload) ? payload : [];
}

export async function resetRequestApi({ email }) {
  const response = await fetch(buildApiUrl('/api/auth/password/reset-request'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('El email no está registrado');
    if (response.status === 400) throw new Error('El email es requerido');
    if (response.status === 422) throw new Error('Formato de email inválido');
    throw new Error('No se pudo procesar la solicitud');
  }

  return true;
}

export async function registerCompleteApi({ token, password }) {
  const response = await fetch(buildApiUrl('/api/auth/register-complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Token inválido o expirado');
    if (response.status === 422) throw new Error('La contraseña no cumple los requisitos');
    throw new Error('No se pudo completar el registro');
  }

  return true;
}

export async function resetPasswordApi({ token, password }) {
  const response = await fetch(buildApiUrl('/api/auth/password/reset'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Token inválido o expirado');
    if (response.status === 422) throw new Error('La contraseña no cumple los requisitos');
    throw new Error('No se pudo restablecer la contraseña');
  }

  return true;
}


export async function refreshToken(token) {
  const response = await fetch(buildApiUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: buildAuthHeaders(token),
  });
 
  if (!response.ok) {
    throw new Error(`Error al refrescar token: ${response.status}`);
  }
 
  return response.json(); // { token, email, estado, categoria, notificacionesPendientes }
}