/* ============================================================
   Supabase Edge Function - DeepSeek proxy for BIT
   Keeps the API key server-side, out of the public repo.

   Deploy from repo root:
     supabase functions deploy chat --no-verify-jwt
     supabase secrets set DEEPSEEK_KEY=sk-...

   The client sends { messages: [...] } and the server builds the
   full request. Model, token caps, and thinking mode are pinned
   here so a public endpoint cannot be abused for arbitrary usage.
   ============================================================ */

const PRODUCTION_ORIGIN = 'https://galabavamsi.github.io';

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const isProduction = origin === PRODUCTION_ORIGIN;
  const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  const allowedOrigin = isProduction || isLocalDev ? origin : PRODUCTION_ORIGIN;

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

Deno.serve(async (req) => {
  const CORS = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405, headers: CORS });
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return new Response('bad json', { status: 400, headers: CORS });
  }

  const roles = new Set(['system', 'user', 'assistant']);
  const messages = (body.messages ?? [])
    .slice(-13)
    .filter((m) => roles.has(m.role))
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

  if (!messages.length) {
    return new Response('no messages', { status: 400, headers: CORS });
  }

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('DEEPSEEK_KEY')}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages,
      stream: true,
      max_tokens: 500,
      temperature: 0.5,
      thinking: { type: 'disabled' },
    }),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...CORS,
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream',
    },
  });
});
