'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authPost, dashPost, dashDelete, adminGet, adminPost, adminPatch } from './lib/api';
import { setSessionJwt, clearSession, setAdminSecret, clearAdminSession, getSessionJwt, getAdminSecret } from './lib/session';

// ── Magic link auth ───────────────────────────────────────────────────────────

export async function requestMagicLinkAction(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { error: 'Email required' };

  try {
    await authPost('/auth/magic-link', { email });
    return { sent: true };
  } catch {
    return { error: 'Something went wrong. Try again.' };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect('/');
}

// ── API key management ────────────────────────────────────────────────────────

export async function createKeyAction(_prev: unknown, formData: FormData) {
  const jwt = await getSessionJwt();
  if (!jwt) redirect('/');

  const label = (formData.get('label') as string)?.trim() || undefined;
  const rpm = parseInt(formData.get('rate_limit_rpm') as string) || 10;

  try {
    const result = await dashPost('/dashboard/me/keys', jwt, { label, rate_limit_rpm: rpm });
    return { rawKey: result.raw_key as string, keyPrefix: result.key_prefix as string };
  } catch {
    return { error: 'Failed to create key' };
  }
}

export async function revokeKeyAction(keyId: string) {
  const jwt = await getSessionJwt();
  if (!jwt) redirect('/');
  await dashDelete(`/dashboard/me/keys/${keyId}`, jwt).catch(() => {});
  revalidatePath('/dashboard');
}

// ── Admin auth ────────────────────────────────────────────────────────────────

export async function adminLoginAction(_prev: unknown, formData: FormData) {
  const secret = (formData.get('secret') as string)?.trim();
  if (!secret) return { error: 'Secret required' };
  try {
    await adminGet('/admin/stats', secret);
  } catch {
    return { error: 'Invalid admin secret' };
  }
  await setAdminSecret(secret);
  redirect('/admin');
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect('/admin');
}

// ── Admin operations ──────────────────────────────────────────────────────────

export async function adjustCreditsAction(_prev: unknown, formData: FormData) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');

  const userId = formData.get('userId') as string;
  const amount = parseInt(formData.get('amount') as string);
  if (!userId || isNaN(amount)) return { error: 'Invalid input' };

  try {
    await adminPatch(`/admin/users/${userId}/credits`, secret, { amount });
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { error: 'Failed to adjust credits' };
  }
}

export async function createUserAction(_prev: unknown, formData: FormData) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');

  const email = (formData.get('email') as string)?.trim();
  const name = (formData.get('name') as string)?.trim() || undefined;
  if (!email) return { error: 'Email required' };

  try {
    await adminPost('/admin/users', secret, { email, name });
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { error: 'Email already exists' };
  }
}

export async function adminCreateKeyAction(_prev: unknown, formData: FormData) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');

  const userId = formData.get('userId') as string;
  const label = (formData.get('label') as string)?.trim() || undefined;
  const rpm = parseInt(formData.get('rate_limit_rpm') as string) || 10;

  try {
    const result = await adminPost(`/admin/users/${userId}/keys`, secret, { label, rate_limit_rpm: rpm });
    return { rawKey: result.raw_key as string };
  } catch {
    return { error: 'Failed to create key' };
  }
}
