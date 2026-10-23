/* Cliente Supabase centralizado. A chave publicável é apropriada para o navegador;
   tabelas/linhas continuam protegidas pelas políticas RLS do banco. */
(() => {
  "use strict";
  const SUPABASE_URL = "https://diabhunpflawknocixit.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Max Som: SDK do Supabase não foi carregado antes de js/supabase.js.");
    window.supabaseClient = null;
    return;
  }
  if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
})();
