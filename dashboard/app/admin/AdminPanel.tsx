'use client';

import { useActionState, useState } from 'react';
import { adjustCreditsAction, createUserAction, adminCreateKeyAction, adminLogoutAction, disableUserAction, enableUserAction, hardDeleteUserAction } from '../actions';

type Stats = {
  total_users: number;
  active_keys: number;
  total_requests: number;
  total_credits_used: number;
  requests_today: number;
};

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
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [creditState, creditAction, creditPending] = useActionState(adjustCreditsAction, null);
  const [keyState, keyAction, keyPending] = useActionState(adminCreateKeyAction, null);

  return (
    <div className="rounded-md bg-gray-800 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{user.email}</p>
            {!user.is_active && (
              <span className="text-xs bg-yellow-900 text-yellow-400 px-1.5 py-0.5 rounded">disabled</span>
            )}
          </div>
          {user.name && <p className="text-xs text-gray-400">{user.name}</p>}
          <p className="text-xs text-gray-500 mt-0.5">
            {user.active_keys} active {user.active_keys === 1 ? 'key' : 'keys'} ·
            joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{Number(user.credit_balance).toLocaleString()}</p>
          <p className="text-xs text-gray-400">credits</p>
        </div>
      </div>

      {/* Adjust credits */}
      <form action={creditAction} className="flex flex-wrap gap-2 items-center">
        <input type="hidden" name="userId" value={user.id} />
        <input
          name="amount"
          type="number"
          placeholder="±credits (e.g. 10000)"
          className="rounded border border-gray-700 bg-gray-700 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none w-44"
        />
        <button
          type="submit"
          disabled={creditPending}
          className="rounded bg-indigo-700 px-3 py-1 text-xs text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          Adjust credits
        </button>
        {creditState?.error && <span className="text-xs text-red-400">{creditState.error}</span>}
        {creditState?.ok && <span className="text-xs text-green-400">Updated</span>}
      </form>

      {/* Danger zone */}
      <div className="flex flex-wrap gap-3 pt-1">
        {user.is_active ? (
          <button
            onClick={() => {
              if (confirm(`Disable ${user.email}? All their keys will be deactivated.`))
                disableUserAction(user.id);
            }}
            className="text-xs text-yellow-500 hover:text-yellow-400 underline"
          >
            Disable user
          </button>
        ) : (
          <button
            onClick={() => enableUserAction(user.id)}
            className="text-xs text-green-500 hover:text-green-400 underline"
          >
            Re-enable user
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`Permanently delete ${user.email}? This removes all their keys and usage history and cannot be undone.`))
              hardDeleteUserAction(user.id);
          }}
          className="text-xs text-red-500 hover:text-red-400 underline"
        >
          Delete user
        </button>
      </div>

      {/* Issue key */}
      <div>
        <button
          onClick={() => setShowKeyForm((v) => !v)}
          className="text-xs text-gray-400 hover:text-white underline"
        >
          {showKeyForm ? 'Cancel' : '+ Issue API key'}
        </button>

        {showKeyForm && (
          <div className="mt-2 space-y-2">
            {keyState?.rawKey && (
              <div className="rounded bg-green-950 border border-green-800 p-3">
                <p className="text-xs text-green-300 font-medium mb-1">Copy now — won&apos;t be shown again:</p>
                <code className="text-xs text-green-200 font-mono break-all">{keyState.rawKey}</code>
              </div>
            )}
            {keyState?.error && <p className="text-xs text-red-400">{keyState.error}</p>}
            <form action={keyAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <input
                name="label"
                placeholder="Label (optional)"
                className="rounded border border-gray-700 bg-gray-700 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              <input
                name="rate_limit_rpm"
                type="number"
                defaultValue={10}
                min={1}
                placeholder="RPM"
                className="w-16 rounded border border-gray-700 bg-gray-700 px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={keyPending}
                className="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-500 disabled:opacity-50"
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

export function AdminPanel({ stats, users }: { stats: Stats; users: User[] }) {
  const [newUserState, newUserAction, creatingUser] = useActionState(createUserAction, null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">Dyaus Admin</h1>
        <form action={adminLogoutAction}>
          <button type="submit" className="text-sm text-gray-400 hover:text-white">Sign out</button>
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

        {/* Users */}
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Users ({users.length})</h2>
          </div>

          {/* Add user */}
          <form action={newUserAction} className="flex flex-wrap gap-2 pb-4 border-b border-gray-800">
            <input
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <input
              name="name"
              placeholder="Name (optional)"
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingUser}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingUser ? 'Adding…' : 'Add user'}
            </button>
            {newUserState?.error && <span className="text-sm text-red-400 self-center">{newUserState.error}</span>}
            {newUserState?.ok && <span className="text-sm text-green-400 self-center">User created</span>}
          </form>

          <div className="space-y-3">
            {users.length === 0 && <p className="text-sm text-gray-500">No users yet.</p>}
            {users.map((u) => <UserRow key={u.id} user={u} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
