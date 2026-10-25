/* MAX SOM — recuperação de inicialização do painel administrativo.
   Este arquivo não concede permissões nem mostra dados privados por conta própria.
   Apenas aciona o carregador principal e evita uma tela de carregamento infinita. */
(() => {
  "use strict";

  if ((window.location.pathname.split("/").pop() || "").toLowerCase() !== "admin.html") return;

  let finished = false;
  let watchdogId = 0;
  let mainScriptError = "";

  window.addEventListener("error", (event) => {
    const source = String(event.filename || "");
    if (source.includes("/js/main.js")) {
      mainScriptError = event.message || "Erro ao executar js/main.js.";
    }
  });

  const stopWatchdog = () => {
    finished = true;
    if (watchdogId) window.clearTimeout(watchdogId);
  };

  document.addEventListener("maxsom:admin-ready", stopWatchdog);
  document.addEventListener("maxsom:admin-access-denied", stopWatchdog);

  function isStillLoading() {
    const loading = document.getElementById("adminLoadingState");
    const dashboard = document.getElementById("adminDashboardContent");
    return Boolean(loading && !loading.hidden && dashboard?.hidden);
  }

  function showInitializationError(message) {
    const loading = document.getElementById("adminLoadingState");
    const dashboard = document.getElementById("adminDashboardContent");
    if (!loading || !dashboard || !isStillLoading()) return;

    loading.classList.add("admin-loading-error");
    loading.setAttribute("role", "alert");
    loading.innerHTML = `
      <div class="admin-loading-icon" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <span class="admin-kicker">VERIFICAÇÃO INTERROMPIDA</span>
      <h1>Não foi possível concluir a abertura do painel</h1>
      <p>${message}</p>
      <p>Seu acesso administrativo não foi alterado. Tente recarregar a página; se continuar, o site precisa conferir a sessão e a leitura do perfil no Supabase.</p>
      <div class="admin-access-actions">
        <button type="button" class="admin-button-primary" id="adminBootstrapRetry">Tentar novamente</button>
        <a class="admin-button-secondary" href="conta.html">Minha conta</a>
      </div>`;
    document.getElementById("adminBootstrapRetry")?.addEventListener("click", () => window.location.reload());
  }

  async function startWatchdog() {
    // Se o carregador principal existir, tenta iniciá-lo uma única vez como contingência.
    if (window.MaxSom && typeof window.MaxSom.loadAdminArea === "function") {
      try {
        await Promise.race([
          window.MaxSom.loadAdminArea(),
          new Promise((resolve) => window.setTimeout(resolve, 4500))
        ]);
      } catch (error) {
        console.error("Recuperação do painel administrativo falhou:", error);
      }
    }

    if (finished || !isStillLoading()) return;

    if (!window.MaxSom) {
      showInitializationError(mainScriptError
        ? `O arquivo js/main.js foi encontrado, mas apresentou um erro: ${mainScriptError}`
        : "O JavaScript principal (js/main.js) não chegou a inicializar. Isso normalmente indica arquivo não atualizado, erro de carregamento ou conflito de nomes globais. A correção mais recente isola o código principal e atualiza os caminhos dos scripts.");
      return;
    }

    showInitializationError("A confirmação da sessão ou a leitura do perfil demorou mais que o esperado. O menu reconheceu sua sessão, mas o conteúdo ainda não recebeu a confirmação necessária para abrir.");
  }

  function schedule() {
    watchdogId = window.setTimeout(startWatchdog, 14000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
})();
