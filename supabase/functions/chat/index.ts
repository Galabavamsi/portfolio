/* ============================================================
   Supabase Edge Function — DeepSeek proxy for BIT.EXE
   Keeps the API key server-side, out of the public repo.

   Deploy (from repo root, with the Supabase CLI):
     supabase functions deploy chat --no-verify-jwt
     supabase secrets set DEEPSEEK_KEY=sk-...

   The client sends { messages: [...] } and the server builds the
   full request — model, token caps and thinking-mode are pinned
   here so a stolen endpoint can't be abused for arbitrary usage.
   ============================================================ */

const ALLOWED_ORIGIN = 'https://galabavamsi.github.io';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

  // clamp everything the client controls
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
      temperature: 0.8,
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
