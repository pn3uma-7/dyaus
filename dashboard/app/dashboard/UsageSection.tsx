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
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
      <h2 className="font-semibold text-white">Recent Usage</h2>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Model</th>
                <th className="pb-2 font-medium text-right">In</th>
                <th className="pb-2 font-medium text-right">Out</th>
                <th className="pb-2 font-medium text-right">Credits</th>
                <th className="pb-2 font-medium text-right">ms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((r, i) => (
                <tr key={i} className="text-gray-300">
                  <td className="py-2 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2">{r.model}</td>
                  <td className="py-2 text-right tabular-nums">{r.input_tokens}</td>
                  <td className="py-2 text-right tabular-nums">{r.output_tokens}</td>
                  <td className="py-2 text-right tabular-nums font-medium text-white">{r.credits_deducted}</td>
                  <td className="py-2 text-right tabular-nums text-gray-500">{r.duration_ms ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
