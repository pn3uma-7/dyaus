import { getSessionJwt } from '../../lib/session';

const API_URL = process.env.API_URL ?? 'https://api.ameytambe.rocks';

export async function POST(request: Request) {
  const jwt = await getSessionJwt();
  if (!jwt) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();

  const upstream = await fetch(`${API_URL}/dashboard/test-chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    return new Response('Inference unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
