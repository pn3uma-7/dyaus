'use client';

import { useActionState, useState, useEffect } from 'react';
import { createKeyAction, revokeKeyAction } from '../actions';

type Key = {
  id: string;
  key_prefix: string;
  label: string | null;
  rate_limit_rpm: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
};

export function KeysSection({ keys }: { keys: Key[] }) {
  const [createState, createAction, creating] = useActionState(createKeyAction, null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (createState?.rawKey) {
      setCopied(false);
      setDismissed(false);
    }
  }, [createState?.rawKey]);

  function handleCopy() {
    if (!createState?.rawKey) return;
    navigator.clipboard.writeText(createState.rawKey);
    setCopied(true);
    setTimeout(() => setDismissed(true), 2000);
  }

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
      <h2 className="font-semibold text-white">API Keys</h2>

      {/* New key display */}
      {createState?.rawKey && !dismissed && (
        <div className="rounded-md border border-green-700 bg-green-950 p-4 space-y-2">
          <p className="text-sm font-medium text-green-300">Key created — copy it now, it won&apos;t be shown again.</p>
          <code className="block break-all text-sm text-green-200 font-mono">{createState.rawKey}</code>
          <button
            onClick={handleCopy}
            className="text-xs text-green-400 hover:text-green-300 underline"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      )}

      {createState?.error && (
        <p className="text-sm text-red-400">{createState.error}</p>
      )}

      {/* Key list */}
      <div className="space-y-2">
        {keys.length === 0 && (
          <p className="text-sm text-gray-500">No keys yet.</p>
        )}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-md bg-gray-800 px-4 py-3">
            <div>
              <span className="font-mono text-sm text-white">{k.key_prefix}…</span>
              {k.label && <span className="ml-2 text-xs text-gray-400">{k.label}</span>}
              <div className="text-xs text-gray-500 mt-0.5">
                {k.rate_limit_rpm} rpm ·{' '}
                {k.is_active ? <span className="text-green-400">active</span> : <span className="text-gray-500">revoked</span>}
                {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
              </div>
            </div>
            {k.is_active && (
              <form action={() => revokeKeyAction(k.id)}>
                <button
                  type="submit"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={(e) => {
                    if (!confirm('Revoke this key?')) e.preventDefault();
                  }}
                >
                  Revoke
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Create key form */}
      <form action={createAction} className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
        <input
          name="label"
          placeholder="Label (optional)"
          className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <input
          name="rate_limit_rpm"
          type="number"
          defaultValue={10}
          min={1}
          max={60}
          className="w-24 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'New key'}
        </button>
      </form>
    </section>
  );
}
