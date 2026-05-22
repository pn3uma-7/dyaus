'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export function ChatSection() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    if (!apiKey.trim()) {
      setError('Paste your API key above before sending.');
      return;
    }

    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setError(null);
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...next, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, apiKey: apiKey.trim() }),
      });

      if (res.status === 401 || res.status === 403) {
        setError('Key is invalid or has been revoked.');
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }

      if (res.status === 402) {
        setError('Insufficient credits.');
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }

      if (res.status === 429) {
        setError('Rate limit exceeded. Try again in a moment.');
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch { /* non-JSON line */ }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Something went wrong. Is the inference server running?');
      setMessages((prev) => prev.slice(0, -1));
    }

    setStreaming(false);
  }

  return (
    <section className="rounded-2xl border border-sky-100 bg-white shadow-sm flex flex-col" style={{ height: '560px' }}>
      <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Test Chat</h2>
          <p className="text-xs text-slate-400 mt-0.5">Uses your API key · credits are charged</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setError(null); }}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* API key input */}
      <div className="px-4 py-2 border-b border-sky-100 flex gap-2 items-center bg-sky-50">
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type={showKey ? 'text' : 'password'}
          placeholder="Paste your API key (sk-dyaus-…)"
          className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none font-mono"
        />
        <button
          onClick={() => setShowKey((v) => !v)}
          className="text-xs text-slate-400 hover:text-slate-700 shrink-0"
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            Paste an API key above and send a message to test it
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-amber-500 text-white'
                  : 'bg-sky-50 border border-sky-100 text-slate-800'
              }`}
            >
              {m.content}
              {streaming && i === messages.length - 1 && m.role === 'assistant' && (
                <span className="inline-block w-1.5 h-3.5 bg-sky-400 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-sky-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          disabled={streaming}
          className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {streaming ? '…' : 'Send'}
        </button>
      </div>
    </section>
  );
}
