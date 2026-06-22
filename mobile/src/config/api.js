// Backend único compartido por todo el equipo, deployado en Render. Si alguien necesita
// apuntar a su propio backend local para debuggear algo puntual, puede pisar esto sin
// tocar código creando un archivo .env en la raíz de mobile/ con:
//   EXPO_PUBLIC_API_BASE_URL=http://TU_IP_LOCAL:8080
const defaultBaseUrl = 'https://subastas-xvpq.onrender.com';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '');

export function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}
export function buildAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}