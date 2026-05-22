'use client';

import { useActionState } from 'react';
import { requestMagicLinkAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestMagicLinkAction, null);

  if (state?.sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-amber-100">
        <div className="w-full max-w-sm space-y-5 px-6 text-center">
          <div className="w-44 h-44 rounded-full bg-amber-50 border-2 border-amber-300 shadow-lg flex items-center justify-center mx-auto">
            <img src="/dyaus.png" alt="Dyaus" className="h-36 w-36 object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
            <p className="mt-1 text-sm text-slate-500">
              We sent a sign-in link. It expires in 15 minutes.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-sky-600 hover:text-sky-500 underline"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-amber-100">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-44 h-44 rounded-full bg-amber-50 border-2 border-amber-300 shadow-lg flex items-center justify-center mx-auto mb-5">
            <img src="/dyaus.png" alt="Dyaus" className="h-36 w-36 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Dyaus</h1>
          <p className="mt-1 text-sm text-slate-500">OpenAI-Compatible · Edge GPU Inference</p>
        </div>

        <div className="bg-white/85 rounded-2xl border border-sky-200 shadow-sm p-6 space-y-4 backdrop-blur-sm">
          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Admin?{' '}
          <a href="/admin" className="text-sky-600 hover:text-sky-500 underline">
            Admin panel
          </a>
        </p>
      </div>
    </div>
  );
}
