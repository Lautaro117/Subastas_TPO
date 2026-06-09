import { buildApiUrl, buildAuthHeaders } from '../config/api';


 //GET /api/users/me/penalty
 //Devuelve la multa pendiente activa del usuario, o null si no tiene.
 
export async function getMultaActiva(token) {
  const response = await fetch(buildApiUrl('/api/users/me/penalty'), {
    method: 'GET',
    headers: buildAuthHeaders(token),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Error al obtener multa: ${response.status}`);
  return response.json();
}


// POST /api/users/me/penalty/pay
// Paga la multa activa.
// @param {string} token
// @param {number} multaId - ID de la multa a pagar

export async function pagarMulta(token, multaId) {
  const response = await fetch(buildApiUrl('/api/users/me/penalty/pay'), {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: JSON.stringify({ multaId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Error al pagar multa: ${response.status}`);
    error.status = response.status;
    throw error;
  }
}