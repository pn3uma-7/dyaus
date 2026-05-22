type UsageRow = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  credits_deducted: number;
  duration_ms: number | null;
  created_at: string;
  key_prefix: string;
};

export function UsageSection({ rows }: { rows: UsageRow[] }) {
  return (
    <section className="rounded-2xl border border-sky-200 bg-white/85 backdrop-blur-sm shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-slate-900">Recent Usage</h2>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-sky-200">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Key</th>
                <th className="pb-2 font-medium">Model</th>
                <th className="pb-2 font-medium text-right">In</th>
                <th className="pb-2 font-medium text-right">Out</th>
                <th className="pb-2 font-medium text-right">Credits</th>
                <th className="pb-2 font-medium text-right">ms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {rows.map((r, i) => (
                <tr key={i} className="text-slate-700">
                  <td className="py-2 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 font-mono text-xs text-slate-500">{r.key_prefix}…</td>
                  <td className="py-2 text-xs">{r.model}</td>
                  <td className="py-2 text-right tabular-nums">{r.input_tokens}</td>
                  <td className="py-2 text-right tabular-nums">{r.output_tokens}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-amber-600">{r.credits_deducted}</td>
                  <td className="py-2 text-right tabular-nums text-slate-400">{r.duration_ms ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
