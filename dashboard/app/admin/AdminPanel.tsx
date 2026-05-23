'use client';

import { useActionState, useState, useTransition } from 'react';
import { adjustCreditsAction, createUserAction, adminCreateKeyAction, adminLogoutAction, disableUserAction, enableUserAction, hardDeleteUserAction, setSettingAction } from '../actions';

type Stats = {
  total_users: number;
  active_keys: number;
  total_requests: number;
  total_credits_used: number;
  requests_today: number;
};

type BillingDay = {
  date: string;
  orders: number;
  revenue_paise: number;
  credits: number;
};

type Billing = {
  total_orders: number;
  total_revenue_paise: number;
  total_credits_sold: number;
  daily: BillingDay[];
} | null;

type User = {
  id: string;
  email: string;
  name: string | null;
  credit_balance: number;
  is_active: boolean;
  active_keys: number;
  created_at: string;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-sky-200 bg-white/85 backdrop-blur-sm shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function WebSearchToggle() {
  const [enabled, setEnabled] = useState(false);
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input type="hidden" name="web_search" value={enabled ? 'true' : 'false'} />
      <div
        onClick={() => setEnabled((v) => !v)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          enabled ? 'bg-amber-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-xs text-slate-500">Web search</span>
    </label>
  );
}

function UserRow({ user }: { user: User }) {
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [creditState, creditAction, creditPending] = useActionState(adjustCreditsAction, null);
  const [keyState, keyAction, keyPending] = useActionState(adminCreateKeyAction, null);

  return (
    <div className="rounded-xl border border-sky-200 bg-white/85 backdrop-blur-sm p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-slate-900">{user.email}</p>
            {!user.is_active && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">disabled</span>
            )}
          </div>
          {user.name && <p className="text-xs text-slate-500">{user.name}</p>}
          <p className="text-xs text-slate-400 mt-0.5">
            {user.active_keys} active {user.active_keys === 1 ? 'key' : 'keys'} ·
            joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{Number(user.credit_balance).toLocaleString()}</p>
          <p className="text-xs text-slate-400">credits</p>
        </div>
      </div>

      {/* Adjust credits */}
      <form action={creditAction} className="flex flex-wrap gap-2 items-center">
        <input type="hidden" name="userId" value={user.id} />
        <input
          name="amount"
          type="number"
          placeholder="±credits (e.g. 10000)"
          className="rounded-lg border border-sky-300 bg-white px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 w-44"
        />
        <button
          type="submit"
          disabled={creditPending}
          className="rounded-lg bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          Adjust credits
        </button>
        {creditState?.error && <span className="text-xs text-red-500">{creditState.error}</span>}
        {creditState?.ok && <span className="text-xs text-green-600 font-medium">Updated</span>}
      </form>

      {/* Danger zone */}
      <div className="flex flex-wrap gap-3 pt-1">
        {user.is_active ? (
          <button
            onClick={() => {
              if (confirm(`Disable ${user.email}? All their keys will be deactivated.`))
                disableUserAction(user.id);
            }}
            className="text-xs text-amber-600 hover:text-amber-700 underline"
          >
            Disable user
          </button>
        ) : (
          <button
            onClick={() => enableUserAction(user.id)}
            className="text-xs text-green-600 hover:text-green-700 underline"
          >
            Re-enable user
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`Permanently delete ${user.email}? This removes all their keys and usage history and cannot be undone.`))
              hardDeleteUserAction(user.id);
          }}
          className="text-xs text-red-500 hover:text-red-600 underline"
        >
          Delete user
        </button>
      </div>

      {/* Issue key */}
      <div>
        <button
          onClick={() => setShowKeyForm((v) => !v)}
          className="text-xs text-sky-600 hover:text-sky-500 underline"
        >
          {showKeyForm ? 'Cancel' : '+ Issue API key'}
        </button>

        {showKeyForm && (
          <div className="mt-2 space-y-2">
            {keyState?.rawKey && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-xs text-green-800 font-medium mb-1">Copy now — won&apos;t be shown again:</p>
                <code className="text-xs text-green-700 font-mono break-all">{keyState.rawKey}</code>
              </div>
            )}
            {keyState?.error && <p className="text-xs text-red-500">{keyState.error}</p>}
            <form action={keyAction} className="flex flex-wrap gap-2 items-center">
              <input type="hidden" name="userId" value={user.id} />
              <input
                name="label"
                placeholder="Label (optional)"
                className="rounded-lg border border-sky-300 bg-white px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
              <input
                name="rate_limit_rpm"
                type="number"
                defaultValue={10}
                min={1}
                placeholder="RPM"
                className="w-16 rounded-lg border border-sky-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-amber-400"
              />
              <WebSearchToggle />
              <button
                type="submit"
                disabled={keyPending}
                className="rounded-lg bg-slate-600 px-3 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {keyPending ? 'Creating…' : 'Create key'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        enabled ? 'bg-amber-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function BillingSection({ billing, paymentsEnabled }: { billing: Billing; paymentsEnabled: boolean }) {
  const [enabled, setEnabled] = useState(paymentsEnabled);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(() => setSettingAction('payments_enabled', String(next)));
  }

  const revenueINR = billing ? (billing.total_revenue_paise / 100).toFixed(2) : '0.00';

  return (
    <section className="rounded-2xl border border-amber-200 bg-white/85 backdrop-blur-sm p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Revenue</h2>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500">{enabled ? 'Payments on' : 'Payments off'}</span>
          <ToggleSwitch enabled={enabled} onToggle={handleToggle} disabled={pending} />
        </div>
      </div>

      {billing && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">₹{revenueINR}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
              <p className="text-xs text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{billing.total_orders.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
              <p className="text-xs text-slate-500">Credits Sold</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{Number(billing.total_credits_sold).toLocaleString()}</p>
            </div>
          </div>

          {billing.daily.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-sky-200">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Orders</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                    <th className="pb-2 font-medium text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {billing.daily.map((row) => (
                    <tr key={row.date} className="text-slate-700">
                      <td className="py-2 text-xs text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="py-2 text-right tabular-nums">{row.orders}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-amber-600">
                        ₹{(row.revenue_paise / 100).toFixed(2)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{Number(row.credits).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No payments yet.</p>
          )}
        </>
      )}
    </section>
  );
}

export function AdminPanel({ stats, users, billing, paymentsEnabled }: { stats: Stats; users: User[]; billing: Billing; paymentsEnabled: boolean }) {
  const [newUserState, newUserAction, creatingUser] = useActionState(createUserAction, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-50 to-amber-100">
      <header className="bg-white/85 backdrop-blur-sm border-b border-sky-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/dyaus.png" alt="Dyaus" className="h-14 w-14 object-contain drop-shadow-sm" />
          <h1 className="font-bold text-lg text-slate-900">Dyaus Admin</h1>
        </div>
        <form action={adminLogoutAction}>
          <button type="submit" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Sign out</button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Users" value={stats.total_users} />
          <StatCard label="Active Keys" value={stats.active_keys} />
          <StatCard label="Total Requests" value={stats.total_requests} />
          <StatCard label="Credits Used" value={stats.total_credits_used} />
          <StatCard label="Requests Today" value={stats.requests_today} />
        </div>

        <BillingSection billing={billing} paymentsEnabled={paymentsEnabled} />

        {/* Users */}
        <section className="rounded-2xl border border-sky-200 bg-sky-100/60 backdrop-blur-sm p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Users ({users.length})</h2>

          {/* Add user */}
          <form action={newUserAction} className="flex flex-wrap gap-2 pb-4 border-b border-sky-200">
            <input
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
            />
            <input
              name="name"
              placeholder="Name (optional)"
              className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingUser}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {creatingUser ? 'Adding…' : 'Add user'}
            </button>
            {newUserState?.error && <span className="text-sm text-red-500 self-center">{newUserState.error}</span>}
            {newUserState?.ok && <span className="text-sm text-green-600 font-medium self-center">User created</span>}
          </form>

          <div className="space-y-3">
            {users.length === 0 && <p className="text-sm text-slate-400">No users yet.</p>}
            {users.map((u) => <UserRow key={u.id} user={u} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
