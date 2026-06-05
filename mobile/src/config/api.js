const defaultBaseUrl = 'http://172.20.10.2:8080';

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