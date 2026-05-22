import { redirect } from 'next/navigation';
import { getSessionJwt } from '../lib/session';
import { dashGet } from '../lib/api';
import { logoutAction } from '../actions';
import { KeysSection } from './KeysSection';
import { UsageSection } from './UsageSection';
import { ChatSection } from './ChatSection';
import { QuickStartSection } from './QuickStartSection';

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <header className="bg-white border-b border-sky-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/dyaus.png" alt="Dyaus" className="h-12 w-12 object-contain" />
          <h1 className="font-bold text-lg text-slate-900">Dyaus</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user.email}</span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-amber-100 bg-white shadow-sm p-6">
          <p className="text-sm text-slate-500">Credit Balance</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-slate-900">
            {Number(user.credit_balance).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            1 credit = 1 input token · 2 credits = 1 output token
          </p>
        </section>

        <KeysSection keys={keys} />
        <QuickStartSection apiUrl={process.env.API_URL ?? 'https://api.ameytambe.rocks'} />
        <ChatSection />
        <UsageSection rows={usage} />
      </main>
    </div>
  );
}
