const defaultBaseUrl = 'http://localhost:8080';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '');

export function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}
