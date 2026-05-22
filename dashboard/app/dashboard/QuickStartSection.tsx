'use client';

import { useState } from 'react';

type Tab = 'curl' | 'python' | 'node';

function CopyButton({ text, inline }: { text: string; inline?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (inline) {
    return (
      <button
        onClick={handleCopy}
        className="ml-2 text-xs text-sky-600 hover:text-sky-500 font-medium shrink-0"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-500 font-medium px-2 py-1 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 transition-colors"
    >
      {copied ? (
        '✓ Copied'
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export function QuickStartSection({ apiUrl }: { apiUrl: string }) {
  const [tab, setTab] = useState<Tab>('curl');
  const model = 'qwen3-30b';
  const baseUrl = `${apiUrl}/v1`;

  const curlExample = `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'`;

  const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`;

  const nodeExample = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${baseUrl}",
  apiKey: "YOUR_API_KEY",
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`;

  const snippets: Record<Tab, string> = { curl: curlExample, python: pythonExample, node: nodeExample };

  return (
    <section className="rounded-2xl border border-sky-100 bg-white shadow-sm p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Quick Start</h2>
        <p className="text-xs text-slate-400 mt-0.5">Everything you need to connect your app in minutes</p>
      </div>

      {/* Endpoint + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Base URL</p>
          <div className="flex items-center justify-between">
            <code className="text-sm text-slate-800 font-mono break-all">{baseUrl}</code>
            <CopyButton text={baseUrl} inline />
          </div>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Model</p>
          <div className="flex items-center justify-between">
            <code className="text-sm text-slate-800 font-mono">{model}</code>
            <CopyButton text={model} inline />
          </div>
        </div>
      </div>

      {/* Jan.ai / compatible app hint */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">Jan.ai / LM Studio / OpenAI-compatible apps</p>
        <p>Set <span className="font-mono bg-amber-100 px-1 rounded">API URL</span> → <span className="font-mono">{baseUrl}</span> &nbsp;·&nbsp; <span className="font-mono bg-amber-100 px-1 rounded">Model</span> → <span className="font-mono">{model}</span> &nbsp;·&nbsp; paste your API key and you&apos;re live.</p>
      </div>

      {/* Code examples */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            {(['curl', 'python', 'node'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  tab === t
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-500 hover:text-slate-800 border border-sky-100 bg-sky-50'
                }`}
              >
                {t === 'curl' ? 'cURL' : t === 'python' ? 'Python' : 'Node.js'}
              </button>
            ))}
          </div>
          <CopyButton text={snippets[tab]} />
        </div>

        <pre className="rounded-xl bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre">
          {snippets[tab]}
        </pre>
      </div>
    </section>
  );
}
