import { redirect } from 'next/navigation';
import { getSessionJwt } from '../lib/session';
import { dashGet } from '../lib/api';
import { logoutAction } from '../actions';
import { KeysSection } from './KeysSection';
import { UsageSection } from './UsageSection';
import { ChatSection } from './ChatSection';

export default async function DashboardPage() {
  const jwt = await getSessionJwt();
  if (!jwt) redirect('/');

  const [user, keys, usage] = await Promise.all([
    dashGet('/dashboard/me', jwt).catch(() => null),
    dashGet('/dashboard/me/keys', jwt).catch(() => []),
    dashGet('/dashboard/me/usage?limit=20', jwt).catch(() => []),
  ]);

  if (!user) redirect('/');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">Dyaus</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-gray-400 hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Credit Balance</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {Number(user.credit_balance).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            1 credit = 1 input token · 2 credits = 1 output token
          </p>
        </section>

        <KeysSection keys={keys} />
        <ChatSection />
        <UsageSection rows={usage} />
      </main>
    </div>
  );
}
