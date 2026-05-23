import { redirect } from 'next/navigation';
import { getAdminSecret } from '../lib/session';
import { adminGet } from '../lib/api';
import { AdminLogin } from './AdminLogin';
import { AdminPanel } from './AdminPanel';

export default async function AdminPage() {
  const secret = await getAdminSecret();

  if (!secret) {
    return <AdminLogin />;
  }

  const [stats, users, billing, settings] = await Promise.all([
    adminGet('/admin/stats', secret).catch(() => null),
    adminGet('/admin/users', secret).catch(() => null),
    adminGet('/admin/billing', secret).catch(() => null),
    adminGet('/admin/settings', secret).catch(() => null),
  ]);

  // Secret rejected by API
  if (!stats || !users) {
    return <AdminLogin error="Session expired — please sign in again" />;
  }

  const paymentsEnabled = settings?.payments_enabled !== 'false';

  return <AdminPanel stats={stats} users={users} billing={billing} paymentsEnabled={paymentsEnabled} />;
}
