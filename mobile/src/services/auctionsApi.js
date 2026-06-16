import { buildApiUrl, buildAuthHeaders } from '../config/api';

/**
 * GET /api/auctions
 * Endpoint público — devuelve todas las subastas. Token opcional.
 */
export async function getAuctions(token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildApiUrl('/api/auctions'), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Error al obtener subastas: ${response.status}`);
  }

  return response.json();
}

/**
 * GET /api/auctions/:id
 * Detalle de una subasta.
 */
export async function getAuctionById(token, id) {
  const response = await fetch(buildApiUrl(`/api/auctions/${id}`), {
    method: 'GET',
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener subasta ${id}: ${response.status}`);
  }

  return response.json();
}

/**
 * GET /api/auctions/:id/catalog
 * Catálogo de una subasta.
 * Si el usuario está en E2, el backend oculta precio_base.
 */
export async function getAuctionCatalog(token, id) {
  const response = await fetch(buildApiUrl(`/api/auctions/${id}/catalog`), {
    method: 'GET',
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener catálogo de subasta ${id}: ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/auctions/:id/join
 * Unirse a la sala de la subasta.
 */
export async function joinAuction(token, id) {
  const response = await fetch(buildApiUrl(`/api/auctions/${id}/join`), {
    method: 'POST',
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.detail || body.message || `Error al unirse a la subasta: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * POST /api/auctions/:id/leave
 * Salir de la sala de la subasta.
 */
export async function leaveAuction(token, id) {
  const response = await fetch(buildApiUrl(`/api/auctions/${id}/leave`), {
    method: 'POST',
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Error al salir de la subasta: ${response.status}`);
  }
}

/**
 * GET /api/auctions/:id/live
 * Estado actual de la sala (fallback sin WebSocket).
 */
export async function getAuctionLive(token, id) {
  const response = await fetch(buildApiUrl(`/api/auctions/${id}/live`), {
    method: 'GET',
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener estado de sala: ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/auctions/:id/bids
 * Enviar una puja.
 * @param {string} token
 * @param {number} id - ID de la subasta
 * @param {{ item_id: number, monto: number, moneda: string, payment_method_id: number }} bid
 */
export async function sendBid(token, id, bid) {
  const response = await fetch(buildApiUrl(`/api/auctions/${id}/bids`), {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: JSON.stringify(bid),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.detail || body.message || `Error al enviar puja: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * GET /api/auctions/:id/items/:itemId/bids
 * Historial de pujas de un ítem.
 */
export async function getItemBids(token, auctionId, itemId) {
  const response = await fetch(
    buildApiUrl(`/api/auctions/${auctionId}/items/${itemId}/bids`),
    {
      method: 'GET',
      headers: buildAuthHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al obtener historial de pujas: ${response.status}`);
  }

  return response.json();
}

/**
 * GET /api/auctions/:id/items/:itemId/result
 * Resultado del ítem para el usuario autenticado.
 */
export async function getResultadoItem(token, auctionId, itemId) {
  const response = await fetch(
    buildApiUrl(`/api/auctions/${auctionId}/items/${itemId}/result`),
    { method: 'GET', headers: buildAuthHeaders(token) }
  );
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return response.json();
}

/**
 * DELETE /api/auctions/leave-all
 * Sale de todas las subastas activas (para testing).
 */
export async function leaveAllAuctions(token) {
  const response = await fetch(buildApiUrl('/api/auctions/leave-all'), {
    method: 'DELETE',
    headers: buildAuthHeaders(token),
  });
  if (!response.ok) throw new Error(`Error: ${response.status}`);
}

/**
 * GET /api/auctions/:auctionId/catalog/:itemId/product
 * Detalle completo del producto: descripción + fotos en base64.
 */
export async function getItemDetail(token, auctionId, itemId) {
  const response = await fetch(
    buildApiUrl(`/api/auctions/${auctionId}/catalog/${itemId}/product`),
    {
      method: 'GET',
      headers: buildAuthHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al obtener detalle del producto: ${response.status}`);
  }

  return response.json();
}