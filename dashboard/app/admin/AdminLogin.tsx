'use client';

import { useActionState } from 'react';
import { adminLoginAction } from '../actions';

export function AdminLogin({ error }: { error?: string }) {
  const [state, action, pending] = useActionState(adminLoginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dyaus Admin</h1>
          <p className="mt-1 text-sm text-gray-400">Admin access only</p>
        </div>

        {error && <p className="text-sm text-yellow-400">{error}</p>}

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Secret</label>
            <input
              name="secret"
              type="password"
              required
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center">
          <a href="/" className="text-gray-400 hover:text-white underline">Back to user login</a>
        </p>
      </div>
    </div>
  );
}
