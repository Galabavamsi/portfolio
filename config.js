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
  SUPABASE_URL: 'https://exctwduhrnklcgbaphdb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Y3R3ZHVocm5rbGNnYmFwaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Nzc2NjUsImV4cCI6MjEwMTQ1MzY2NX0.vHb8nStI4UAZNtSfsxZAzudsEbHom4vGCpiKWFKtQZQ',

  CHAT_ENDPOINT: 'https://exctwduhrnklcgbaphdb.supabase.co/functions/v1/chat',

  // Lets localhost call the deployed chat proxy for realistic testing.
  USE_REMOTE_CHAT_LOCALLY: true,

  // Local direct-to-DeepSeek testing only. Keep this blank before deploy.
  DEV_DEEPSEEK_KEY: '',
};
