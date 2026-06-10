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
  SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',

  /* Chat proxy — the deployed edge function URL */
  CHAT_ENDPOINT: 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/chat',

  /* LOCAL TESTING ONLY. Leave '' when committing/deploying. */
  DEV_DEEPSEEK_KEY: '',
};
