/* MAX SOM — contingência da página Minha Conta.
 * O objetivo é preencher os dados básicos do usuário autenticado mesmo se outro
 * carregador de página falhar. Não cria perfis nem altera dados do banco.
 */
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const isAccountPage = () => Boolean($("[data-account-page]"));

  function setStatus(message, visible = true) {
    const element = $("#accountLoadStatus");
    if (!element) return;
    element.textContent = message || "";
    element.hidden = !visible || !message;
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value == null || value === "" ? "—" : String(value);
  }

  function displayRole(value) {
    const type = String(value || "cliente").trim().toLowerCase();
    if (["admin", "dono", "administrador"].includes(type)) return "Administrador";
    if (["funcionario", "funcionário", "funcionario tecnico", "funcionário técnico"].includes(type)) return "Funcionário";
    return "Cliente";
  }

  async function hydrateAccountFallback() {
    if (!isAccountPage()) return;
    const client = window.supabaseClient;
    if (!client?.auth || typeof client.from !== "function") {
      setStatus("Não foi possível iniciar o Supabase nesta página. Confira se o SDK e js/supabase.js foram publicados e recarregue.");
      return;
    }

    try {
      // Espera a inicialização principal quando ela está disponível; se ficar presa,
      // a leitura independente abaixo ainda tenta preencher a área de perfil.
      const mainPromise = window.maxSomInitializationPromise;
      if (mainPromise && typeof mainPromise.then === "function") {
        await Promise.race([
          mainPromise.catch(() => undefined),
          new Promise((resolve) => setTimeout(resolve, 7000))
        ]);
      }

      if (document.documentElement.dataset.accountListsHydrated === "true") return;

      const { data: sessionResult, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        setStatus("Não foi possível confirmar sua sessão: " + sessionError.message);
        return;
      }
      const user = sessionResult?.session?.user;
      if (!user) {
        setStatus("Sua sessão não foi encontrada. Entre novamente para consultar sua conta.");
        return;
      }

      // Se main.js foi carregado, use seus carregadores oficiais para sincronizar
      // perfil, menu, solicitações, conversas e notificações. Isso evita que este
      // script mostre um texto genérico antes de as consultas principais terminarem.
      if (typeof window.MaxSom?.refreshAccountForUser === "function") {
        await Promise.race([
          window.MaxSom.refreshAccountForUser(user).catch((error) => {
            console.error("Max Som — recarga de contingência:", error);
          }),
          new Promise((resolve) => setTimeout(resolve, 8000))
        ]);
        if (document.documentElement.dataset.accountListsHydrated === "true") {
          setStatus("", false);
          document.documentElement.dataset.accountFallbackHydrated = "true";
          return;
        }
      }

      // Fallback visual apenas se main.js não conseguiu completar o carregamento.
      const metadata = user.user_metadata || {};
      const fallbackName = metadata.nome || user.email?.split("@")[0] || "Usuário";
      setText("#contaNomeTitulo", fallbackName);
      setText("#contaNome", fallbackName);
      setText("#contaEmail", user.email || "—");
      setText("#contaTelefone", metadata.whatsapp || metadata.telefone || "—");
      setText("#contaTipo", "Perfil não confirmado");

      const { data: profile, error: profileError } = await client
        .from("usuario")
        .select("id,nome,telefone,whatsapp,tipo_usuario")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setStatus("O login está ativo, mas não conseguimos ler seu perfil na tabela usuario. Confira a política SELECT (RLS). Detalhe: " + profileError.message);
        return;
      }
      if (!profile) {
        setStatus("Sua conta está autenticada, mas não existe um perfil correspondente na tabela usuario. Confira se usuario.id corresponde ao ID do usuário autenticado.");
        return;
      }

      const name = profile.nome || fallbackName;
      setText("#contaNomeTitulo", name);
      setText("#contaNome", name);
      setText("#contaEmail", user.email || "—");
      setText("#contaTelefone", profile.whatsapp || profile.telefone || metadata.whatsapp || metadata.telefone || "—");
      setText("#contaTipo", displayRole(profile.tipo_usuario));

      // Nunca substitui silenciosamente as listas por um texto genérico: tenta
      // primeiro os carregadores principais, que mostram o erro preciso da tabela.
      if (typeof window.MaxSom?.reloadAccountLists === "function") {
        await Promise.race([
          window.MaxSom.reloadAccountLists().catch((error) => console.error("Max Som — recarga das listas:", error)),
          new Promise((resolve) => setTimeout(resolve, 8000))
        ]);
      }
      if (document.documentElement.dataset.accountListsHydrated !== "true") {
        for (const selector of ["#accountRequests", "#accountConversations", "#notificacoesLista"]) {
          const list = $(selector);
          if (list && /carregando/i.test(list.textContent || "")) {
            const label = selector === "#accountRequests" ? "solicitações" : selector === "#accountConversations" ? "conversas" : "notificações";
            list.innerHTML = `<div class="empty" role="status">Não foi possível concluir o carregamento das ${label}. Use o botão abaixo para tentar novamente após verificar a conexão do Supabase.</div><button type="button" class="button button-secondary" data-retry-account-bootstrap>Tentar novamente</button>`;
            list.querySelector?.("[data-retry-account-bootstrap]")?.addEventListener("click", async (event) => {
              const button = event.currentTarget;
              button.disabled = true;
              button.textContent = "Carregando...";
              try { await window.MaxSom?.reloadAccountLists?.(); }
              finally { button.disabled = false; button.textContent = "Tentar novamente"; }
            });
          }
        }
      }
      setStatus("", false);
      document.documentElement.dataset.accountFallbackHydrated = "true";
    } catch (error) {
      console.error("Max Som — contingência de Minha Conta:", error);
      setStatus("A página de conta abriu, mas não conseguiu buscar os dados. Confira a conexão do Supabase e as mensagens na aba Console do navegador.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateAccountFallback, { once: true });
  } else {
    hydrateAccountFallback();
  }
})();
