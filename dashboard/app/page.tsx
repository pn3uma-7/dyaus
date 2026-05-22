'use client';

import { useActionState } from 'react';
import { requestMagicLinkAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestMagicLinkAction, null);

  if (state?.sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-sm space-y-4 px-6 text-center">
          <div className="text-4xl">📬</div>
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="text-sm text-gray-400">
            We sent a sign-in link. It expires in 15 minutes.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-500 hover:text-gray-300 underline"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dyaus</h1>
          <p className="mt-1 text-sm text-gray-400">Enter your email to sign in</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Sending…' : 'Send sign-in link'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center">
          Admin?{' '}
          <a href="/admin" className="text-gray-400 hover:text-white underline">
            Admin panel
          </a>
        </p>
      </div>
    </div>
  );
}
