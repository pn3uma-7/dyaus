'use client';

import { useActionState } from 'react';
import { adminLoginAction } from '../actions';

export function AdminLogin({ error }: { error?: string }) {
  const [state, action, pending] = useActionState(adminLoginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <img src="/dyaus.png" alt="Dyaus" className="h-20 w-20 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Dyaus Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Admin access only</p>
        </div>

        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 space-y-4">
          {error && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Secret</label>
              <input
                name="secret"
                type="password"
                required
                autoFocus
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          <a href="/" className="text-sky-600 hover:text-sky-500 underline">Back to user login</a>
        </p>
      </div>
    </div>
  );
}
