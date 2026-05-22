import { getSessionJwt } from '../../lib/session';

const API_URL = process.env.API_URL ?? 'https://api.ameytambe.rocks';

export async function POST(request: Request) {
  const jwt = await getSessionJwt();
  if (!jwt) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const { messages, apiKey } = body;

  if (!apiKey?.trim()) return new Response('API key required', { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, stream: true }),
    });
  } catch {
    return new Response('Inference server unreachable', { status: 502 });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => 'Request failed');
    return new Response(text, { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
