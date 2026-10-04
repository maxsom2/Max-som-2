const SUPABASE_URL = "https://diabhunpflawknocixit.supabase.co";
const SUPABASE_KEY = "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("Supabase JS não foi carregado.");
} else {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}
