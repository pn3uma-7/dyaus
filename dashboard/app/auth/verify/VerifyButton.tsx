'use client';

import { useActionState } from 'react';
import { verifyTokenAction } from '../../actions';

export function VerifyButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyTokenAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Signing in…' : 'Sign in to Dyaus'}
      </button>
      {state?.error && (
        <div className="space-y-3">
          <p className="text-sm text-red-400">{state.error}</p>
          <a href="/" className="inline-block text-sm text-indigo-400 hover:text-indigo-300 underline">
            Request a new link
          </a>
        </div>
      )}
    </form>
  );
}
