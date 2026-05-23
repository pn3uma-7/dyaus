'use client';

import { useActionState, useState, useEffect } from 'react';
import { createKeyAction, revokeKeyAction } from '../actions';

type Key = {
  id: string;
  key_prefix: string;
  label: string | null;
  rate_limit_rpm: number;
  web_search: boolean;
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
    <section className="rounded-2xl border border-sky-200 bg-white/85 backdrop-blur-sm shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-slate-900">API Keys</h2>

      {createState?.rawKey && !dismissed && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">Key created — copy it now, it won&apos;t be shown again.</p>
          <code className="block break-all text-sm text-green-700 font-mono">{createState.rawKey}</code>
          <button
            onClick={handleCopy}
            className="text-xs text-green-700 hover:text-green-600 underline font-medium"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      )}

      {createState?.error && (
        <p className="text-sm text-red-500">{createState.error}</p>
      )}

      <div className="space-y-2">
        {keys.length === 0 && (
          <p className="text-sm text-slate-400">No keys yet.</p>
        )}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-xl bg-sky-100/60 border border-sky-200 px-4 py-3">
            <div>
              <span className="font-mono text-sm text-slate-800">{k.key_prefix}…</span>
              {k.label && <span className="ml-2 text-xs text-slate-500">{k.label}</span>}
              <div className="text-xs text-slate-400 mt-0.5">
                {k.rate_limit_rpm} rpm ·{' '}
                {k.is_active
                  ? <span className="text-green-600 font-medium">active</span>
                  : <span className="text-slate-400">revoked</span>}
                {k.web_search && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 bg-sky-100 text-sky-700 text-xs px-1.5 py-0.5 rounded font-medium">
                    🌐 web
                  </span>
                )}
                {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
              </div>
            </div>
            {k.is_active && (
              <form action={() => revokeKeyAction(k.id)}>
                <button
                  type="submit"
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
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

      <form action={createAction} className="flex flex-wrap gap-2 pt-2 border-t border-sky-200">
        <input
          name="label"
          placeholder="Label (optional)"
          className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
        />
        <input
          name="rate_limit_rpm"
          type="number"
          defaultValue={10}
          min={1}
          max={60}
          className="w-24 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-amber-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {creating ? 'Creating…' : 'New key'}
        </button>
      </form>
    </section>
  );
}
