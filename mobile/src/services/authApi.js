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
