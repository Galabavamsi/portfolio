// Cloudflare Worker for www.galabavamsi.com. Static files in dist/ are served
// straight from Workers static assets; only /api/* runs this code (see
// run_worker_first in wrangler.jsonc). /api/* is a same-origin proxy to Supabase.
//
// Since February 2026, Indian ISPs (Jio, Airtel, ACT) have blocked *.supabase.co,
// so a browser in India can't reach BIT's chat function or the view counter.
// Cloudflare fetches them server-side instead. vercel.json has matching rewrites
// for when the site is served from Vercel.
//
//   POST /api/chat                -> /functions/v1/chat
//   POST /api/views/track_view    -> /rest/v1/rpc/track_view
//   POST /api/views/view_count    -> /rest/v1/rpc/view_count

const SUPABASE = 'https://exctwduhrnklcgbaphdb.supabase.co';
// Public anon key (the same one config.js ships); row-level security guards the data.
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Y3R3ZHVocm5rbGNnYmFwaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzc2NjUsImV4cCI6MjEwMTQ1MzY2NX0.vHb8nStI4UAZNtSfsxZAzudsEbHom4vGCpiKWFKtQZQ';

const ROUTES = {
  chat: '/functions/v1/chat',
  'views/track_view': '/rest/v1/rpc/track_view',
  'views/view_count': '/rest/v1/rpc/view_count',
};
const MAX_BODY = 64 * 1024;

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) return proxy(request, pathname.slice('/api/'.length));
    return env.ASSETS.fetch(request);
  },
};

async function proxy(request, route) {
  const target = ROUTES[route];
  if (!target) return new Response('Not found', { status: 404 });
  if (request.method !== 'POST') {
    return new Response('POST only', { status: 405, headers: { Allow: 'POST' } });
  }

  const body = await request.text();
  if (body.length > MAX_BODY) return new Response('Too large', { status: 413 });

  const headers = new Headers({
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    Origin: request.headers.get('Origin') || new URL(request.url).origin,
  });
  // The chat function rate-limits per visitor using the first X-Forwarded-For entry.
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers.set('X-Forwarded-For', ip);
  const evalLabel = request.headers.get('x-bit-eval');
  if (evalLabel) headers.set('x-bit-eval', evalLabel);

  let upstream;
  try {
    upstream = await fetch(SUPABASE + target, { method: 'POST', headers, body });
  } catch {
    return new Response('Upstream unavailable', { status: 502 });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
