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

  const [stats, users] = await Promise.all([
    adminGet('/admin/stats', secret).catch(() => null),
    adminGet('/admin/users', secret).catch(() => null),
  ]);

  // Secret rejected by API
  if (!stats || !users) {
    return <AdminLogin error="Session expired — please sign in again" />;
  }

  return <AdminPanel stats={stats} users={users} />;
}
