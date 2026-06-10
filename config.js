/* ============================================================
   DEPLOYMENT CONFIG — fill these in after setting up Supabase
   (see README.md → DEPLOY)

   SAFE to commit: SUPABASE_URL and SUPABASE_ANON_KEY are public
   by design — the database is protected by Row Level Security.

   NEVER commit: a real DeepSeek key in DEV_DEEPSEEK_KEY. That
   field is for local testing only. In production the key lives
   as a secret inside the Supabase Edge Function.
   ============================================================ */
window.GV_CONFIG = {
  /* Supabase project (Settings → API) */
  SUPABASE_URL: 'https://grszzwsmlxbjlghskbcc.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc3p6d3NtbHhiamxnaHNrYmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjU5NzUsImV4cCI6MjA5NjcwMTk3NX0.t-7H1-Oz2qSF119QUG8skFIWr-ha7sDg4T3JtJUVSxs',

  /* Chat proxy — the deployed edge function URL */
  CHAT_ENDPOINT: 'https://grszzwsmlxbjlghskbcc.supabase.co/functions/v1/chat',

  /* LOCAL TESTING ONLY. Leave '' when committing/deploying. */
  DEV_DEEPSEEK_KEY: '',
};
