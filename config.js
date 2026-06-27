/* ============================================================
   DEPLOYMENT CONFIG

   Safe to commit:
   - Supabase project URL
   - Supabase anon key
   - Public chat endpoint URL

   Do not put the DeepSeek key here. The frontend talks to the
   Supabase Edge Function, and the function reads DEEPSEEK_KEY
   from Supabase secrets.
   ============================================================ */
window.GV_CONFIG = {
  SUPABASE_URL: 'https://grszzwsmlxbjlghskbcc.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc3p6d3NtbHhiamxnaHNrYmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjU5NzUsImV4cCI6MjA5NjcwMTk3NX0.t-7H1-Oz2qSF119QUG8skFIWr-ha7sDg4T3JtJUVSxs',

  CHAT_ENDPOINT: 'https://grszzwsmlxbjlghskbcc.supabase.co/functions/v1/chat',

  // Lets localhost call the deployed chat proxy for realistic testing.
  USE_REMOTE_CHAT_LOCALLY: true,

  // Local direct-to-DeepSeek testing only. Keep this blank before deploy.
  DEV_DEEPSEEK_KEY: '',
};
