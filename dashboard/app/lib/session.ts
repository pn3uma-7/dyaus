import { cookies } from 'next/headers';

const SESSION_COOKIE = 'dyaus-session';
const ADMIN_COOKIE = 'dyaus-admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: MAX_AGE,
  path: '/',
};

export async function getSessionJwt() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function setSessionJwt(jwt: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, jwt, cookieOpts);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getAdminSecret() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value;
}

export async function setAdminSecret(secret: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, secret, cookieOpts);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
