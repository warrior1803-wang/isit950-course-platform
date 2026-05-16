const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim();

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function ensureApiBaseUrl(value) {
  const baseUrl = trimTrailingSlash(value || '/api');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

function normalizeApiPath(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath === '/api' || normalizedPath.startsWith('/api/')
    ? normalizedPath.slice(4) || '/'
    : normalizedPath;
}

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(url);
}

export const API_BASE_URL = ensureApiBaseUrl(rawApiBaseUrl);
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export function buildApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (isAbsoluteUrl(path)) return path;
  return `${API_BASE_URL}${normalizeApiPath(path)}`;
}

export function buildBackendUrl(path) {
  if (!path) return BACKEND_BASE_URL;
  if (isAbsoluteUrl(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
}
