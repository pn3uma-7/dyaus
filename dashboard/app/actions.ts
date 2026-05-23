'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authPost, dashPost, dashDelete, adminGet, adminPost, adminPatch, adminDelete } from './lib/api';
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

export async function verifyTokenAction(_prev: unknown, formData: FormData) {
  const token = formData.get('token') as string;
  if (!token) return { error: 'Invalid link' };

  let jwt: string;
  try {
    const result = await authPost('/auth/verify', { token });
    jwt = result.jwt;
  } catch {
    return { error: 'This link has expired or already been used. Request a new one.' };
  }

  await setSessionJwt(jwt);
  redirect('/dashboard');
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

// ── Payments ──────────────────────────────────────────────────────────────────

export async function createPaymentOrderAction(packId: string) {
  const jwt = await getSessionJwt();
  if (!jwt) redirect('/');
  const result = await dashPost('/dashboard/payments/create-order', jwt, { packId });
  return result as { orderId: string; amount: number; currency: string };
}

export async function verifyPaymentAction(data: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) {
  const jwt = await getSessionJwt();
  if (!jwt) redirect('/');
  const result = await dashPost('/dashboard/payments/verify', jwt, data);
  revalidatePath('/dashboard');
  return result as { ok: boolean; creditsAdded: number; packName: string };
}

export async function revokeKeyAction(keyId: string) {
  const jwt = await getSessionJwt();
  if (!jwt) redirect('/');
  await dashDelete(`/dashboard/me/keys/${keyId}`, jwt).catch(() => {});
  revalidatePath('/dashboard');
}

// ── Admin settings ────────────────────────────────────────────────────────────

export async function setSettingAction(key: string, value: string) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');
  await adminPatch(`/admin/settings/${key}`, secret, { value });
  revalidatePath('/admin');
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

export async function disableUserAction(userId: string) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');
  await adminPatch(`/admin/users/${userId}/disable`, secret);
  revalidatePath('/admin');
}

export async function enableUserAction(userId: string) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');
  await adminPatch(`/admin/users/${userId}/enable`, secret);
  revalidatePath('/admin');
}

export async function hardDeleteUserAction(userId: string) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');
  await adminDelete(`/admin/users/${userId}`, secret);
  revalidatePath('/admin');
}

export async function adminCreateKeyAction(_prev: unknown, formData: FormData) {
  const secret = await getAdminSecret();
  if (!secret) redirect('/admin');

  const userId = formData.get('userId') as string;
  const label = (formData.get('label') as string)?.trim() || undefined;
  const rpm = parseInt(formData.get('rate_limit_rpm') as string) || 10;
  const webSearch = formData.get('web_search') === 'true';

  try {
    const result = await adminPost(`/admin/users/${userId}/keys`, secret, { label, rate_limit_rpm: rpm, web_search: webSearch });
    return { rawKey: result.raw_key as string };
  } catch {
    return { error: 'Failed to create key' };
  }
}
