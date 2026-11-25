/**
 * Lightweight fetch wrapper that attaches the stored JWT token
 * and normalizes JSON error handling.
 *
 * Base URL strategy:
 *  - Local dev:  Vite proxies /api → http://localhost:5001 (no prefix needed)
 *  - Production: VITE_API_URL env var points to the backend Vercel URL
 *                e.g. https://jobapply-flax.vercel.app
 *                (same domain → still just /api/... works fine)
 */
const TOKEN_KEY = 'jobpilot_token';

// In production, VITE_API_URL is the Vercel deployment URL.
// In dev it is empty, so relative /api/... goes through the Vite proxy.
const BASE_URL = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}
