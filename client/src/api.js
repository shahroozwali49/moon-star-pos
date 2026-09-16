const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export async function api(path, options = {}) {
  const response = await fetch(`${API}/api${path}`, {
    ...options, credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}
