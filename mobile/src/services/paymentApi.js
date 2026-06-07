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

export async function getPaymentMethods(token) {
  const response = await fetch(buildApiUrl('/api/payment-methods'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeader(token),
    },
  });

  const rawBody = await response.text();

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    throw new Error('No se pudieron cargar los medios de pago');
  }

  try {
    return JSON.parse(rawBody) ?? [];
  } catch {
    return [];
  }
}

export async function addBankAccount(data, token) {
  const response = await fetch(buildApiUrl('/api/payment-methods/bank-account'), {
    method: 'POST',
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
    if (response.status === 401) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    if (response.status === 422) throw new Error(backendMessage || 'Datos con formato inválido');
    if (response.status === 400) throw new Error(backendMessage || 'Campos obligatorios faltantes');
    throw new Error(backendMessage || 'No se pudo registrar la cuenta bancaria');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export async function addCreditCard(data, token) {
  const response = await fetch(buildApiUrl('/api/payment-methods/credit-card'), {
    method: 'POST',
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
    if (response.status === 401) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    if (response.status === 422) throw new Error(backendMessage || 'Número de tarjeta o vencimiento inválido');
    if (response.status === 400) throw new Error(backendMessage || 'Campos obligatorios faltantes');
    throw new Error(backendMessage || 'No se pudo registrar la tarjeta');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export async function addCertifiedCheck(data, token) {
  const response = await fetch(buildApiUrl('/api/payment-methods/certified-check'), {
    method: 'POST',
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
    if (response.status === 401) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    if (response.status === 422) throw new Error(backendMessage || 'Monto inválido o fecha mal formada');
    if (response.status === 400) throw new Error(backendMessage || 'Campos obligatorios faltantes');
    throw new Error(backendMessage || 'No se pudo registrar el cheque');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export async function deletePaymentMethod(id, token) {
  const response = await fetch(buildApiUrl(`/api/payment-methods/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...authHeader(token),
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    if (response.status === 404) throw new Error('Medio de pago no encontrado');
    if (response.status === 409) throw new Error('No se puede eliminar: está asociado a una subasta activa');
    throw new Error('No se pudo eliminar el medio de pago');
  }

  return true;
}


export async function setPayoutAccount(id, token) {
  const response = await fetch(buildApiUrl(`/api/payment-methods/payout-account/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...authHeader(token),
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    if (response.status === 404) throw new Error('Medio de pago no encontrado');
    throw new Error('No se pudo establecer como cuenta de cobro');
  }

  return true;
}
