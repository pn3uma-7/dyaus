const API_URL = process.env.API_URL ?? 'https://api.ameytambe.rocks';

async function apiFetch(path: string, init: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(text), { status: res.status });
  }
  return res.json();
}

// Dashboard routes — authenticated with JWT session
export function dashGet(path: string, jwt: string) {
  return apiFetch(path, { headers: { Authorization: `Bearer ${jwt}` } });
}

export function dashPost(path: string, jwt: string, body?: unknown) {
  return apiFetch(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function dashDelete(path: string, jwt: string) {
  return apiFetch(path, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
}

// Auth routes — no auth header needed
export function authPost(path: string, body: unknown) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Admin routes — authenticated with admin secret
export function adminGet(path: string, secret: string) {
  return apiFetch(path, { headers: { 'x-admin-secret': secret } });
}

export function adminPost(path: string, secret: string, body?: unknown) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function adminPatch(path: string, secret: string, body?: unknown) {
  return apiFetch(path, {
    method: 'PATCH',
    headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function adminDelete(path: string, secret: string) {
  return apiFetch(path, { method: 'DELETE', headers: { 'x-admin-secret': secret } });
}
