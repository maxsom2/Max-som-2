/* =========================================================
   MAX SOM
   MAIN.JS — VERSAO LIMPA E CORRIGIDA
   ========================================================= */

/* =========================================================
   1. SUPABASE
   ========================================================= */

// Cliente compartilhado criado por js/supabase.js. A configuração fica centralizada em um único arquivo.
const supabase = window.supabaseClient || null;

/* =========================================================
   2. CONFIGURACOES
   ========================================================= */

const OWNER_TYPES = ["admin", "dono", "administrador"];
const STAFF_TYPES = [...OWNER_TYPES, "funcionario", "funcionário", "funcionario tecnico", "funcionário técnico"];
const ADMIN_TYPES = STAFF_TYPES; // compatibilidade com as funções administrativas já existentes

const TABLES = {
  USUARIO: "usuario",
  PRODUTOS: "produtos",
  SERVICOS: "servicos",
  SOLICITACOES: "solicitações_servico",
  CONVERSAS: "conversas",
  MENSAGENS: "mensagem",
  NOTIFICACOES: "notificacao",
  PROJETOS: "projetos",
  PUBLICACOES: "publicacoes"
};

// Fotos próprias do projeto usadas como alternativa visual quando um registro publicado
// ainda não tem imagem_capa. Os dados (nome, categoria e descrição) continuam vindo do banco.
const LOCAL_AUDIO_PHOTOS = [
  "../assets/automotivo.jpeg",
  "../assets/barco.jpeg",
  "../assets/instalacao.jpeg",
  "../assets/projeto-extra.png",
  "../assets/projeto-extra-02.png",
  "../assets/WhatsApp Image 2026-10-12 at 12.16.39.jpeg",
  "../assets/WhatsApp Image 2026-10-12 at 12.16.40.jpeg",
  "../assets/WhatsApp Image 2026-10-12 at 12.16.41.jpeg"
];
function localAudioPhoto(index = 0) {
  return LOCAL_AUDIO_PHOTOS[Math.abs(Number(index) || 0) % LOCAL_AUDIO_PHOTOS.length];
}

let currentUser = null;
let currentProfile = null;
let authListenerBound = false;
let loadedProductsForFilters = [];
let productCategoryNames = new Map();
let productBrandNames = new Map();

/* =========================================================
   3. FUNCOES AUXILIARES
   ========================================================= */

function qs(...selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

function qsa(...selectors) {
  const found = new Set();
  selectors.filter(Boolean).forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => found.add(element));
  });
  return Array.from(found);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHref(value, fallback = "#") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("#")) return raw;
  if (raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f]/.test(raw)) return fallback;
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return fallback;
  return raw;
}

function normalizeType(type) {
  return String(type ?? "").trim().toLowerCase();
}

function isOwner(profile = currentProfile) {
  return OWNER_TYPES.includes(normalizeType(profile?.tipo_usuario));
}

function isAdmin(profile = currentProfile) {
  return STAFF_TYPES.includes(normalizeType(profile?.tipo_usuario));
}

function getPostLoginTarget(profile = currentProfile) {
  const requested = new URLSearchParams(window.location.search).get("redirect");
  // Ao entrar sem um destino explícito, direciona cada perfil para sua área inicial.
  const defaultTarget = isAdmin(profile) ? "admin.html" : "conta.html";
  if (!requested) return defaultTarget;
  // Só permite destinos locais conhecidos; não aceita URL externa no redirecionamento.
  const target = requested.trim();
  const allowedPages = new Set([
    "index.html", "produtos.html", "servicos.html", "projetos.html",
    "publicacoes.html", "atendimento.html", "conta.html", "conversas.html",
    "conversa.html", "admin.html"
  ]);
  const page = target.split("?")[0].split("#")[0];
  if (!allowedPages.has(page) || target.startsWith("//") || /^[a-z]+:/i.test(target)) return defaultTarget;
  return target;
}

function getCurrentPage() {
  const file =
    window.location.pathname.split("/").pop()?.toLowerCase();
  return file || "index.html";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showMessage(target, text, type = "info") {
  const element =
    typeof target === "string" ? qs(target) : target;

  if (!element) return;

  element.textContent = text || "";
  element.classList.remove(
    "hidden",
    "message-info",
    "message-success",
    "message-error",
    "message-warning"
  );
  element.classList.add(`message-${type}`);
}

function clearMessage(target) {
  const element =
    typeof target === "string" ? qs(target) : target;

  if (!element) return;

  element.textContent = "";
  element.classList.add("hidden");
  element.classList.remove(
    "message-info",
    "message-success",
    "message-error",
    "message-warning"
  );
}

function setButtonLoading(button, loading, normalText = "") {
  if (!button) return;

  if (loading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent.trim();
    }
    button.disabled = true;
    button.textContent = "Aguarde...";
    return;
  }

  button.disabled = false;
  button.textContent =
    normalText ||
    button.dataset.originalText ||
    button.textContent;
}

function dbError(error, fallback = "Ocorreu um erro.") {
  console.error(error);
  return (
    error?.message ||
    error?.details ||
    error?.hint ||
    fallback
  );
}

function isSupabaseReady() {
  return !!supabase;
}

/* =========================================================
   4. PERFIL / AUTENTICACAO
   ========================================================= */

async function getAuthUser() {
  if (!isSupabaseReady()) return null;

  const {
    data,
    error
  } = await supabase.auth.getUser();

  if (error || !data?.user) {
    currentUser = null;
    return null;
  }

  currentUser = data.user;
  return data.user;
}

async function loadProfile(user = null) {
  if (!isSupabaseReady()) return null;

  const authUser =
    user ||
    currentUser ||
    await getAuthUser();

  if (!authUser) {
    currentProfile = null;
    return null;
  }

  currentUser = authUser;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.USUARIO)
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar perfil:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data || null;
  return currentProfile;
}

async function ensureProfile(user = null, values = {}) {
  if (!isSupabaseReady()) return null;

  const authUser =
    user ||
    currentUser ||
    await getAuthUser();

  if (!authUser) {
    currentUser = null;
    currentProfile = null;
    return null;
  }

  currentUser = authUser;

  const existing = await loadProfile(authUser);

  if (existing) return existing;

  const profileData = {
    id: authUser.id,
    nome: String(
      values.nome ||
      authUser.user_metadata?.nome ||
      authUser.email?.split("@")[0] ||
      "Cliente"
    ).trim(),
    telefone:
      String(
        values.telefone ||
        authUser.user_metadata?.telefone ||
        ""
      ).trim() || null,
    whatsapp:
      String(
        values.whatsapp ||
        authUser.user_metadata?.whatsapp ||
        ""
      ).trim() || null,
    tipo_usuario: "cliente"
  };

  const {
    data,
    error
  } = await supabase
    .from(TABLES.USUARIO)
    .insert(profileData)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao criar perfil:", error);
    return null;
  }

  currentProfile = data;
  return data;
}

/* =========================================================
   5. NAVEGACAO
   ========================================================= */

async function updateNav() {
  const ready = isSupabaseReady();
  // A sessão deve ocultar links de visitante sem aguardar a consulta do perfil.
  // O perfil só libera links administrativos depois de ser confirmado no banco.
  const logged = ready && !!currentUser;
  const profile = currentProfile;
  const admin = isAdmin(profile);
  const owner = isOwner(profile);

  const inSidebar = (element) => Boolean(element.closest("#sidebar"));
  const setVisible = (element, visible, visibleDisplay = "") => {
    element.hidden = !visible;
    element.style.display = visible ? (inSidebar(element) ? "flex" : visibleDisplay) : "none";
    element.setAttribute("aria-hidden", String(!visible));
  };

  // Links para visitantes desaparecem assim que a sessão estiver ativa.
  qsa("[data-guest-only]").forEach((element) => setVisible(element, !logged));
  qsa("[data-logged-only]").forEach((element) => setVisible(element, logged));
  qsa("[data-conversations-link]").forEach((element) => setVisible(element, logged));
  qsa("[data-admin-only]").forEach((element) => setVisible(element, admin));
  qsa("[data-owner-only]").forEach((element) => setVisible(element, owner));

  // Algumas páginas têm um único botão "Minha conta" no topo. Ele continua visível,
  // mas o destino muda de Entrar para a conta autenticada conforme a sessão.
  qsa("[data-smart-account-link]").forEach((element) => {
    element.hidden = false;
    element.style.display = "";
    element.removeAttribute("aria-hidden");
    element.setAttribute("href", logged ? "conta.html" : "login.html");
    element.setAttribute("aria-label", logged ? "Abrir Minha conta" : "Entrar ou acessar Minha conta");
  });

  qsa("[data-logout]").forEach((button) => {
    // Não limpe o display de um botão dentro da sidebar: a folha global o oculta
    // por padrão. Defina flex explicitamente quando estiver autenticado.
    setVisible(button, logged);
    if (button.dataset.logoutBound === "true") return;
    button.dataset.logoutBound = "true";
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      await logout();
    });
  });

  // O menu lateral é injetado por menu.js. Compartilhe o estado para sincronizar
  // também os links criados dinamicamente e os botões do cabeçalho.
  document.dispatchEvent(new CustomEvent("maxsom:auth-state-updated", {
    detail: {
      authenticated: logged,
      isStaff: admin,
      isOwner: owner,
      role: normalizeType(profile?.tipo_usuario || ""),
      userId: currentUser?.id || null
    }
  }));
}

/* =========================================================
   6. LOGIN
   ========================================================= */

function setupLogin() {
  const form = qs("#loginForm", "#formLogin");
  if (!form || form.dataset.loginBound === "true") return;

  form.dataset.loginBound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email =
      qs("#loginEmail", "#email")?.value.trim().toLowerCase() || "";
    const password =
      qs("#loginPassword", "#senha")?.value || "";
    const message =
      qs("#loginError", "#mensagemLogin", "#loginMessage");
    const button =
      form.querySelector("button[type='submit']");

    clearMessage(message);

    if (!email || !password) {
      showMessage(
        message,
        "Preencha o e-mail e a senha.",
        "error"
      );
      return;
    }

    if (!isSupabaseReady()) {
      showMessage(
        message,
        "O sistema de login não foi carregado.",
        "error"
      );
      return;
    }

    setButtonLoading(button, true, "Entrar");

    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data?.user) {
        throw new Error("A sessão não foi criada.");
      }

      currentUser = data.user;
      let profile = await loadProfile(data.user);
      if (!profile) profile = await ensureProfile(data.user);
      if (!profile) {
        showMessage(message, "Seu login foi aceito, mas o perfil na tabela usuario não pôde ser carregado ou criado. É necessário conferir as permissões RLS dessa tabela no Supabase.", "error");
        return;
      }
      await updateNav();
      window.location.replace(getPostLoginTarget(profile));

    } catch (error) {
      const code = String(error?.code || "").toLowerCase();
      const detail = String(error?.message || "").toLowerCase();
      const invalidCredentials = code === "invalid_credentials" ||
        code === "invalid_grant" ||
        detail.includes("invalid login credentials") ||
        detail.includes("invalid email or password");
      showMessage(
        message,
        invalidCredentials
          ? "E-mail ou senha incorretos. Verifique os dados e tente novamente."
          : "Não foi possível concluir o login. Confira sua conexão com o Supabase e as permissões do perfil; tente novamente.",
        "error"
      );
      console.error("Erro no login:", error);
    } finally {
      setButtonLoading(button, false);
    }
  });
}

/* =========================================================
   7. CADASTRO
   ========================================================= */

function setupSignup() {
  const form = qs("#signupForm", "#formCadastro");
  if (!form || form.dataset.signupBound === "true") return;

  form.dataset.signupBound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome =
      qs("#signupNome", "#nome")?.value.trim() || "";
    const telefone =
      qs("#signupTelefone", "#telefone")?.value.trim() || "";
    const whatsapp =
      qs("#signupWhatsapp", "#whatsapp")?.value.trim() || "";
    const email =
      qs("#signupEmail", "#email")?.value.trim().toLowerCase() || "";
    const password =
      qs("#signupPassword", "#senha")?.value || "";
    const message =
      qs("#signupError", "#mensagemCadastro");
    const button =
      form.querySelector("button[type='submit']");

    clearMessage(message);

    if (!nome || !email || !password) {
      showMessage(
        message,
        "Preencha seu nome, e-mail e senha.",
        "error"
      );
      return;
    }

    if (!isSupabaseReady()) {
      showMessage(message, "O sistema de cadastro não conseguiu se conectar ao Supabase. Verifique a conexão e tente novamente.", "error");
      return;
    }

    setButtonLoading(button, true, "Criar conta");

    try {
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            telefone,
            whatsapp
          }
        }
      });

      if (error) throw error;
      if (!data?.user) {
        throw new Error("Não foi possível criar o usuário.");
      }

      if (data.session) {
        currentUser = data.user;
        const profile = await ensureProfile(data.user, { nome, telefone, whatsapp });
        if (!profile) {
          showMessage(message, "A conta foi criada, mas não foi possível gravar o perfil na tabela usuario. Confira as permissões RLS antes de entrar.", "error");
          return;
        }
        window.location.replace("conta.html");
        return;
      }

      showMessage(
        message,
        "Conta criada. Confirme seu e-mail e depois faça login.",
        "success"
      );
      form.reset();

    } catch (error) {
      console.error("Erro no cadastro Max Som:", error);
      showMessage(
        message,
        dbError(error, "Não foi possível criar a conta."),
        "error"
      );
    } finally {
      setButtonLoading(button, false);
    }
  });
}

/* =========================================================
   8. LOGOUT
   ========================================================= */

async function logout() {
  if (!isSupabaseReady()) return;

  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("Não foi possível sair da conta.");
    console.error(error);
    return;
  }

  currentUser = null;
  currentProfile = null;
  cleanupRealtimeChannels();
  window.location.replace("index.html");
}

/* =========================================================
   9. LISTENER DE AUTENTICACAO
   ========================================================= */

function setupAuthListener() {
  if (!isSupabaseReady() || authListenerBound) return;

  authListenerBound = true;

  // Não executar consultas Supabase aguardadas dentro do callback do auth:
  // o SDK mantém um lock durante o evento e isso pode bloquear chamadas seguintes.
  supabase.auth.onAuthStateChange((event, session) => {
    const eventUser = session?.user || null;
    currentUser = eventUser;
    if (!eventUser) currentProfile = null;

    Promise.resolve().then(async () => {
      // Reflete a sessão imediatamente; a área administrativa continua bloqueada
      // até que o tipo_usuario seja confirmado na tabela usuario.
      await updateNav();
      if (eventUser) await loadProfile(eventUser);
      if (currentUser?.id === eventUser?.id) await updateNav();

      if (event === "SIGNED_OUT") {
        cleanupRealtimeChannels();
        const page = getCurrentPage();
        if (["conta.html", "conversas.html", "conversa.html", "admin.html"].includes(page)) {
          window.location.replace("login.html");
        }
      }
    }).catch((error) => console.error("Erro ao atualizar a sessão da Max Som:", error));
  });
}

/* =========================================================
   10. PROTECAO DO ADMIN
   ========================================================= */

function showAdminAccessMessage(title, message, needsRole = false) {
  const main = qs("#adminMain");
  if (!main) return;
  main.hidden = false;
  main.innerHTML = `
    <section class="admin-access-denied" role="status" aria-live="polite">
      <div class="admin-access-icon" aria-hidden="true"><i class="fa-solid fa-shield-halved"></i></div>
      <span class="admin-kicker">ACESSO AO PAINEL</span>
      <h1>${esc(title)}</h1>
      <p>${esc(message)}</p>
      ${needsRole ? '<p class="admin-access-help">O dono do projeto precisa autorizar este acesso na tabela <code>public.usuario</code>, no campo <code>tipo_usuario</code>. Não é seguro permitir que uma conta de cliente eleve a própria permissão pelo site.</p>' : ''}
      <div class="admin-access-actions">
        <a class="admin-button-primary" href="conta.html">Minha conta</a>
        <a class="admin-button-secondary" href="index.html">Voltar ao site</a>
      </div>
    </section>`;
}

async function requireAdmin() {
  if (!currentUser) {
    window.location.replace("login.html?redirect=admin.html");
    return false;
  }

  const profile = currentProfile || await loadProfile(currentUser);
  if (!profile) {
    showAdminAccessMessage(
      "Não conseguimos confirmar seu perfil",
      "Sua sessão está ativa, mas o perfil da tabela usuario não pôde ser consultado. Confira se usuario.id corresponde ao ID da conta autenticada e se a política SELECT (RLS) permite ler o próprio perfil."
    );
    return false;
  }

  if (!isAdmin(profile)) {
    showAdminAccessMessage(
      "Este painel é restrito à equipe",
      `Sua conta está configurada como “${profile.tipo_usuario || "cliente"}”. O painel administrativo existe, mas só aparece para funcionários e administradores autorizados.`,
      true
    );
    return false;
  }

  return true;
}

/* =========================================================
   11. PROTECAO DAS PAGINAS DE CONTA
   ========================================================= */

async function enforcePageAccess() {
  const page = getCurrentPage();

  if ([
    "conta.html",
    "conversas.html",
    "conversa.html"
  ].includes(page)) {
    if (!currentUser) {
      window.location.replace("login.html");
      return false;
    }
  }

  if (page === "admin.html") {
    return await requireAdmin();
  }

  return true;
}

/* =========================================================
   12. LOGIN JA ATIVO
   ========================================================= */

async function redirectAuthenticatedUser() {
  // Uma sessão persistente também não deve ficar parada nas telas de entrar/cadastro.
  if (!["login.html", "cadastro.html"].includes(getCurrentPage())) return;
  if (!currentUser) return;

  window.location.replace(getPostLoginTarget());
}

/* =========================================================
   13. NAVEGACAO GERAL
   ========================================================= */

function setupGeneralNavigation() {
  qsa(
    "a[href='conta.html'], a[href='conversas.html'], a[href='conversa.html']"
  ).forEach((link) => {
    if (link.dataset.navigationBound === "true") return;

    link.dataset.navigationBound = "true";
    link.addEventListener("click", (event) => {
      if (!currentUser) {
        event.preventDefault();
        window.location.replace("login.html");
      }
    });
  });
}

/* =========================================================
   14. MINHA CONTA
   ========================================================= */

async function loadAccountPage() {
  const page = qs(
    "[data-account-page]",
    ".account-page"
  );

  if (!page) return;
  if (!currentUser) {
    window.location.replace("login.html");
    return;
  }

  const profile =
    currentProfile ||
    await loadProfile(currentUser);

  const status = qs("#accountLoadStatus");
  if (status) {
    if (profile) {
      status.hidden = true;
      status.textContent = "";
    } else {
      status.hidden = false;
      status.textContent = "Sua sessão foi reconhecida, mas o perfil salvo não foi carregado. Mostramos os dados básicos da autenticação; confira a tabela usuario e a política SELECT (RLS) se os dados completos não aparecerem.";
    }
  }

  const displayName =
    profile?.nome ||
    currentUser.user_metadata?.nome ||
    currentUser.email?.split("@")[0] ||
    "Usuário";

  const type = normalizeType(profile?.tipo_usuario || "");

  // Não classifique como cliente quando a leitura do perfil falhou; isso esconderia
  // o motivo real de o painel administrativo não aparecer.
  let typeLabel = profile ? "Cliente" : "Perfil não confirmado";
  if (["admin", "dono", "administrador"].includes(type)) {
    typeLabel = "Administrador";
  } else if (["funcionario", "funcionário", "funcionario tecnico", "funcionário técnico"].includes(type)) {
    typeLabel = "Funcionário";
  } else if (type === "solicitante_admin") {
    typeLabel = "Solicitação de administrador";
  }

  const nameTitle = qs(
    "#contaNomeTitulo",
    "[data-account-name]"
  );
  const nameField = qs(
    "#contaNome",
    "[data-account-name-full]"
  );
  const emailField = qs(
    "#contaEmail",
    "[data-account-email]"
  );
  const phoneField = qs(
    "#contaTelefone",
    "[data-account-phone]"
  );
  const typeField = qs(
    "#contaTipo",
    "[data-account-type]"
  );

  if (nameTitle) nameTitle.textContent = displayName;
  if (nameField) nameField.textContent = displayName;
  if (emailField) emailField.textContent = currentUser.email || "-";
  if (phoneField) {
    phoneField.textContent =
      profile?.whatsapp ||
      profile?.telefone ||
      currentUser.user_metadata?.whatsapp ||
      currentUser.user_metadata?.telefone ||
      "-";
  }
  if (typeField) typeField.textContent = typeLabel;

  // Os campos principais já estão preenchidos. Marque a conta como renderizada antes
  // de consultar listas, que podem falhar por RLS sem impedir a exibição do perfil.
  document.documentElement.dataset.accountHydrated = "true";
  document.documentElement.dataset.accountListsHydrated = "false";
  await Promise.allSettled([
    loadAccountRequests(),
    loadAccountConversations(),
    loadNotifications()
  ]);
  document.documentElement.dataset.accountListsHydrated = "true";
  setupAdminRequestButton();
}

async function refreshAccountForUser(user) {
  if (!user) return false;
  currentUser = user;
  currentProfile = await loadProfile(user);
  await updateNav();
  await loadAccountPage();
  await updateNav();
  return true;
}

async function reloadAccountLists() {
  if (!currentUser) await getAuthUser();
  if (!currentUser) return false;
  document.documentElement.dataset.accountListsHydrated = "false";
  await Promise.allSettled([
    loadAccountRequests(),
    loadAccountConversations(),
    loadNotifications()
  ]);
  document.documentElement.dataset.accountListsHydrated = "true";
  return true;
}

/* =========================================================
   15. SOLICITACOES DA CONTA
   ========================================================= */

function renderAccountQueryError(container, label, tableName, error, retry) {
  if (!container) return;
  const detail = error?.message || error?.details || "Erro não informado pelo Supabase.";
  container.innerHTML = `
    <div class="empty account-query-error" role="alert">
      <p>Não foi possível carregar ${esc(label)}. A leitura pode estar bloqueada pela política SELECT (RLS) ou por uma permissão da tabela <code>${esc(tableName)}</code>.</p>
      <details><summary>Detalhes do erro</summary><p>${esc(detail)}</p></details>
      <button type="button" class="button button-secondary" data-retry-account-query>Tentar novamente</button>
    </div>`;
  const button = container.querySelector("[data-retry-account-query]");
  if (!button) return;
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Carregando...";
    try { await retry(); }
    finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "Tentar novamente";
      }
    }
  });
}

async function loadAccountRequests() {
  const container = qs(
    "#accountRequests",
    "#solicitacoesConta",
    "#minhasSolicitacoes"
  );

  if (!container || !currentUser) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.SOLICITACOES)
    .select(
      "id,servico_id,status,descricao_problema,observacoes,criado_em"
    )
    .eq("cliente_id", currentUser.id)
    .order("criado_em", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erro ao carregar solicitações da conta:", error);
    renderAccountQueryError(
      container,
      "suas solicitações",
      'public."solicitações_servico"',
      error,
      loadAccountRequests
    );
    return;
  }

  if (!data?.length) {
    container.innerHTML =
      '<div class="empty">Nenhuma solicitação encontrada.</div>';
    return;
  }

  container.innerHTML = data.map((item) => {
    const status = normalizeType(item.status || "solicitado");
    const waitingClient = ["aguardando_informacoes", "aguardando_informação", "aguardando_cliente", "aguardando informações", "aguardando informação"].includes(status);
    const refused = status === "recusado";
    const statusLabels = {
      solicitado: "Em análise", pendente: "Pendente", em_analise: "Em análise",
      aceito: "Aceita", aguardando_informacoes: "Aguardando suas informações",
      aguardando_cliente: "Aguardando suas informações", recusado: "Recusada",
      em_andamento: "Em andamento", concluido: "Concluída", cancelado: "Cancelada"
    };
    return `
      <article class="account-item account-request-item">
        <strong>Solicitação #${esc(String(item.id).slice(0, 8))}</strong>
        <span>${esc(statusLabels[status] || item.status || "Em análise")} • ${esc(formatDateTime(item.criado_em))}</span>
        <p>${esc(item.descricao_problema || "")}</p>
        ${item.observacoes ? `<details><summary>Ver histórico e observações</summary><p class="request-history">${esc(item.observacoes)}</p></details>` : ""}
        ${waitingClient ? `
          <form method="post" class="request-reply-form" data-request-reply="${esc(item.id)}">
            <label for="requestReply-${esc(item.id)}">Informações solicitadas pela equipe</label>
            <textarea id="requestReply-${esc(item.id)}" rows="3" maxlength="5000" required placeholder="Digite as informações que a equipe pediu..."></textarea>
            <button type="submit" class="button button-primary">Enviar informações</button>
          </form>
        ` : ""}
        ${refused ? '<a class="account-small-link" href="atendimento.html">Criar nova solicitação →</a>' : ""}
      </article>
    `;
  }).join("");
  qsa("[data-request-reply]").forEach((form) => {
    if (form.dataset.replyBound === "true") return;
    form.dataset.replyBound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await replyToRequest(form.dataset.requestReply, form.querySelector("textarea"), form.querySelector("button[type='submit']"));
    });
  });
}

/* =========================================================
   16. CONVERSAS DA CONTA
   ========================================================= */

async function loadAccountConversations() {
  const container = qs(
    "#accountConversations",
    "#conversasConta",
    "#minhasConversas"
  );

  if (!container || !currentUser) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.CONVERSAS)
    .select(
      "id,cliente_id,funcionario_id,assunto,status,criado_em,atualizado_em"
    )
    .or(
      `cliente_id.eq.${currentUser.id},funcionario_id.eq.${currentUser.id}`
    )
    .order("atualizado_em", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erro ao carregar conversas da conta:", error);
    renderAccountQueryError(
      container,
      "suas conversas",
      "public.conversas",
      error,
      loadAccountConversations
    );
    return;
  }

  if (!data?.length) {
    container.innerHTML =
      '<div class="empty">Nenhuma conversa encontrada.</div>';
    return;
  }

  container.innerHTML = data.map((conversation) => `
    <a
      href="conversa.html?id=${encodeURIComponent(conversation.id)}"
      class="conversation-card"
    >
      <div class="conversation-card-content">
        <div>
          <h3>${esc(conversation.assunto || "Atendimento Max Som")}</h3>
          <span>${esc(conversation.status || "aberta")}</span>
        </div>
        <time>${esc(formatDateTime(conversation.atualizado_em || conversation.criado_em))}</time>
      </div>
    </a>
  `).join("");
}

/* =========================================================
   17. SOLICITACAO DE ADMINISTRADOR
   ========================================================= */

async function requestAdminAccess() {
  // A tabela usuario não é uma fila segura de solicitações administrativas.
  // O cliente não pode alterar tipo_usuario pelo navegador; o pedido é iniciado pelo WhatsApp.
  if (!currentUser) {
    window.location.replace("login.html");
    return;
  }

  const profile = currentProfile || await loadProfile(currentUser);
  if (!profile) {
    alert("Não foi possível verificar seu perfil. Entre novamente ou fale com a equipe.");
    return;
  }
  if (isAdmin(profile)) {
    alert("Sua conta já possui acesso à área da equipe.");
    return;
  }
  const name = profile.nome || currentUser.email || "Cliente";
  const message = `Olá! Gostaria de solicitar autorização para acesso de funcionário à área administrativa da Max Som. Nome: ${name}. E-mail: ${currentUser.email || "não informado"}.`;
  const url = `https://wa.me/5565996262514?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
function setupAdminRequestButton() {
  const button = qs(
    "#requestAdminButton",
    "#btnAdminRequest",
    "[data-request-admin]"
  );

  if (!button || button.dataset.adminRequestBound === "true") return;

  button.dataset.adminRequestBound = "true";
  button.addEventListener("click", requestAdminAccess);
}

/* =========================================================
   18. ATENDIMENTO
   ========================================================= */

async function loadAttendanceServices() {
  const select = qs(
    "#servico",
    "#requestServico",
    "#servicoId"
  );

  if (!select) return;
  if (!isSupabaseReady()) {
    select.innerHTML = '<option value="">Serviços indisponíveis: conexão com o sistema não carregada</option>';
    select.disabled = true;
    return;
  }
  select.disabled = false;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.SERVICOS)
    .select("id,nome,ativo")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    select.innerHTML =
      '<option value="">Não foi possível carregar os serviços</option>';
    console.error(error);
    return;
  }

  select.innerHTML =
    '<option value="">Selecione um serviço</option>';

  (data || []).forEach((service) => {
    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = service.nome;
    option.dataset.nome = service.nome;
    select.appendChild(option);
  });

  const params = new URLSearchParams(window.location.search);
  const serviceFromUrl =
    params.get("servico") ||
    params.get("service");

  if (serviceFromUrl) {
    const match = Array.from(select.options).find((option) =>
      option.value === serviceFromUrl ||
      option.textContent.trim().toLowerCase() ===
        serviceFromUrl.trim().toLowerCase()
    );

    if (match) select.value = match.value;
  }
}

async function fillAttendanceUserData() {
  if (!currentUser) return;

  const nameInput = qs(
    "#nomeContato",
    "#requestNome",
    "#nomeSolicitante"
  );
  const phoneInput = qs(
    "#telefoneContato",
    "#requestTelefone",
    "#telefone"
  );

  const profile = currentProfile || await loadProfile(currentUser);
  if (!profile) return;

  if (nameInput && !nameInput.value) {
    nameInput.value = profile.nome || "";
  }

  if (phoneInput && !phoneInput.value) {
    phoneInput.value =
      profile.whatsapp ||
      profile.telefone ||
      "";
  }
}

async function saveAttendanceRequest({
  serviceId = null,
  nome = "",
  telefone = "",
  equipamento = "",
  descricao = ""
} = {}) {
  if (!currentUser) {
    return { saved: false, error: null };
  }

  const descricaoProblema = [
    equipamento
      ? `Produto/equipamento: ${equipamento}`
      : "",
    descricao
  ].filter(Boolean).join("\n\n");

  const observacoes = [
    nome ? `Nome informado: ${nome}` : "",
    telefone ? `Telefone/WhatsApp: ${telefone}` : ""
  ].filter(Boolean).join("\n");

  const {
    error
  } = await supabase
    .from(TABLES.SOLICITACOES)
    .insert({
      cliente_id: currentUser.id,
      servico_id: serviceId || null,
      equipamento_id: null,
      descricao_problema: descricaoProblema || null,
      status: "solicitado",
      observacoes: observacoes || null
    });

  return {
    saved: !error,
    error: error || null
  };
}

function buildAttendanceWhatsAppMessage({
  nome = "",
  telefone = "",
  servico = "",
  equipamento = "",
  descricao = ""
} = {}) {
  return [
    "Olá! Quero falar com a Max Som.",
    nome ? `Nome: ${nome}` : "",
    telefone ? `Telefone/WhatsApp: ${telefone}` : "",
    servico ? `Serviço: ${servico}` : "",
    equipamento ? `Produto/equipamento: ${equipamento}` : "",
    descricao ? `Mensagem: ${descricao}` : ""
  ].filter(Boolean).join("\n");
}

function setupAttendanceForm() {
  const form = qs("#formAtendimento", "#serviceRequestForm");
  if (!form || form.dataset.attendanceBound === "true") return;

  form.dataset.attendanceBound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = qs("#nomeContato", "#requestNome");
    const phoneInput = qs("#telefoneContato", "#requestTelefone", "#telefone");
    const serviceSelect = qs("#servico", "#requestServico", "#servicoId");
    const equipmentInput = qs("#equipamento", "#requestEquipamento");
    const descriptionInput = qs("#descricao", "#requestDescricao", "#mensagem");
    const button = form.querySelector("button[type='submit']");

    if (!isSupabaseReady()) {
      showMessage("#mensagemAtendimento", "Não foi possível conectar ao sistema de atendimento. Atualize a página e tente novamente.", "error");
      return;
    }

    if (!currentUser) {
      showMessage("#mensagemAtendimento", "Entre na sua conta para registrar uma solicitação. Você será encaminhado para o login.", "warning");
      const returnTo = `atendimento.html${window.location.search || ""}`;
      window.setTimeout(() => { window.location.href = `login.html?redirect=${encodeURIComponent(returnTo)}`; }, 900);
      return;
    }

    const nome = nameInput?.value.trim() || "";
    const telefone = phoneInput?.value.trim() || "";
    const equipamento = equipmentInput?.value.trim() || "";
    const descricao = descriptionInput?.value.trim() || "";
    const serviceId = serviceSelect?.value || null;
    const serviceNome =
      serviceSelect?.selectedOptions?.[0]?.dataset?.nome ||
      serviceSelect?.selectedOptions?.[0]?.textContent?.trim() ||
      "";

    if (!nome) {
      showMessage("#mensagemAtendimento", "Digite seu nome.", "error");
      nameInput?.focus();
      return;
    }

    if (!serviceId) {
      showMessage("#mensagemAtendimento", "Selecione o serviço relacionado à sua solicitação.", "error");
      serviceSelect?.focus();
      return;
    }

    if (!descricao) {
      showMessage(
        "#mensagemAtendimento",
        "Explique o que você precisa.",
        "error"
      );
      descriptionInput?.focus();
      return;
    }

    setButtonLoading(button, true, "Enviando...");
    clearMessage("#mensagemAtendimento");

    const whatsappMessage = buildAttendanceWhatsAppMessage({
      nome,
      telefone,
      servico: serviceNome,
      equipamento,
      descricao
    });
    // Abrir a nova aba durante o evento do usuário evita o bloqueio de pop-ups
    // causado por chamar window.open somente depois de uma operação assíncrona.
    const whatsappWindow = window.open(
      `https://wa.me/5565996262514?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank",
      "noopener,noreferrer"
    );

    try {
      const result = await saveAttendanceRequest({
        serviceId,
        nome,
        telefone,
        equipamento,
        descricao
      });

      if (result.saved) {
        form.reset();
        showMessage(
          "#mensagemAtendimento",
          "Solicitação registrada. Continue o atendimento pelo WhatsApp.",
          "success"
        );
      } else {
        showMessage(
          "#mensagemAtendimento",
          "O WhatsApp foi aberto com sua mensagem. Não conseguimos confirmar o registro no sistema; envie a mensagem pelo WhatsApp e tente novamente mais tarde.",
          "warning"
        );
      }
    } catch (error) {
      console.error("Erro ao registrar solicitação de atendimento:", error);
      showMessage(
        "#mensagemAtendimento",
        "O WhatsApp foi aberto, mas o registro no sistema falhou. Envie sua mensagem pelo WhatsApp para não perder seu atendimento.",
        "warning"
      );
    } finally {
      setButtonLoading(button, false);
    }
  });
}

async function setupAttendancePage() {
  if (getCurrentPage() !== "atendimento.html") return;
  await loadAttendanceServices();
  await fillAttendanceUserData();
  setupAttendanceForm();
}

/* =========================================================
   19. PRODUTOS
   ========================================================= */

function productSearchValue(product) {
  const values = [
    product?.nome, product?.Modelo, product?.modelo,
    product?.descricao, product?.especificacoes,
    product?.marca, product?.marca_nome, product?.categoria,
    product?.categoria_nome, product?.nome_categoria,
    product?.tipo, product?.referencia, product?.codigo,
    productCategoryNames.get(String(product?.categoria_id || "")),
    productBrandNames.get(String(product?.marca_id || ""))
  ];
  return values.filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function renderProductList(container, data) {
  if (!container) return;
  container.setAttribute("aria-busy", "false");
  if (!data?.length) {
    container.innerHTML = '<div class="empty products-empty">Nenhum produto corresponde à busca no momento.</div>';
    return;
  }
  container.innerHTML = data.map((product, index) => {
    const model = product.Modelo || product.modelo || "";
    const brand = product.marca_nome || product.marca || product.brand || productBrandNames.get(String(product.marca_id || "")) || "";
    const category = product.categoria_nome || product.categoria || product.nome_categoria || product.tipo || productCategoryNames.get(String(product.categoria_id || "")) || "Equipamento";
    const savedImage = product.imagem_capa || product.image_url || product.foto_url || "";
    const image = savedImage || localAudioPhoto(index);
    const imageAlt = savedImage ? (product.nome || "Produto Max Som") : `Imagem ilustrativa de equipamento de som`;
    return `
      <article class="product-card">
        <img src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy">
        <div class="product-info">
          <span class="product-kicker">${esc(category)}</span>
          <h3>${esc(product.nome || "Produto")}</h3>
          ${brand ? `<p class="product-meta"><strong>Marca:</strong> ${esc(brand)}</p>` : ""}
          ${model ? `<p class="product-meta"><strong>Modelo:</strong> ${esc(model)}</p>` : ""}
          <p>${esc(product.descricao || "Consulte a Max Som para mais informações.")}</p>
          ${product.especificacoes
            ? `<details><summary>Ver especificações</summary><p>${esc(product.especificacoes)}</p></details>`
            : ""}
          <a class="button button-primary product-contact-link" href="atendimento.html?produto=${encodeURIComponent(product.id)}">Falar com a equipe <span aria-hidden="true">→</span></a>
        </div>
      </article>`;
  }).join("");

  // Se uma foto cadastrada no Supabase foi removida ou ficou inacessível,
  // usa uma foto local da Max Som para evitar cartões com imagem quebrada.
  container.querySelectorAll(".product-card > img").forEach((imageElement, index) => {
    imageElement.addEventListener("error", () => {
      if (imageElement.dataset.localFallbackUsed === "true") return;
      imageElement.dataset.localFallbackUsed = "true";
      imageElement.src = localAudioPhoto(index);
      imageElement.alt = "Imagem ilustrativa de equipamento de som da Max Som";
    }, { once: true });
  });
}

function applyProductFilters() {
  const search = qs("#productSearch")?.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
  const category = qs("#productCategory")?.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
  const filtered = loadedProductsForFilters.filter((product) => {
    const searchable = productSearchValue(product);
    const categoryValue = [product?.categoria_nome, product?.categoria, product?.nome_categoria, product?.tipo, product?.categoria_id]
      .filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const categoryMatches = !category || String(product?.categoria_id || "") === category || categoryValue.includes(category) || searchable.includes(category);
    return searchable.includes(search) && categoryMatches;
  });
  qsa("#productsGrid", "#produtosGrid", "#produtosLista", "#productsList", "#produtosContainer", ".products-content .products-grid", ".products-section .products-grid", ".featured-products .products-grid")
    .forEach((container) => renderProductList(container, filtered));
}

function setupProductFilters() {
  [qs("#productSearch"), qs("#productCategory")].filter(Boolean).forEach((control) => {
    if (control.dataset.productFilterBound === "true") return;
    control.dataset.productFilterBound = "true";
    control.addEventListener("input", applyProductFilters);
    control.addEventListener("change", applyProductFilters);
  });
}

async function fetchReferenceRows(tableCandidates) {
  for (const table of tableCandidates) {
    let result = await supabase.from(table).select("id,nome,ativo").order("nome", { ascending: true });
    if (result.error) result = await supabase.from(table).select("id,nome").order("nome", { ascending: true });
    if (!result.error && Array.isArray(result.data) && result.data.length) {
      return result.data.filter((row) => row.ativo !== false);
    }
  }
  return [];
}

async function loadPublicProductReferences() {
  if (!isSupabaseReady()) return;
  const [categories, brands] = await Promise.all([
    fetchReferenceRows(["categoria_produto", "categorias_produto"]),
    fetchReferenceRows(["marcas", "marca"])
  ]);
  productCategoryNames = new Map(categories.map((row) => [String(row.id), row.nome || ""]));
  productBrandNames = new Map(brands.map((row) => [String(row.id), row.nome || ""]));
  const select = qs("#productCategory");
  if (select && categories.length) {
    const selected = select.value;
    select.replaceChildren();
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "Todas as categorias";
    select.appendChild(all);
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.nome || "Categoria";
      select.appendChild(option);
    });
    if (selected && categories.some((category) => String(category.id) === selected)) select.value = selected;
  }
}

async function loadProducts() {
  const containers = qsa(
    "#productsGrid", "#produtosGrid", "#produtosLista", "#productsList",
    "#produtosContainer", ".products-content .products-grid",
    ".products-section .products-grid", ".featured-products .products-grid"
  );
  if (!containers.length) return;
  setupProductFilters();
  if (!isSupabaseReady()) {
    containers.forEach((container) => {
      container.innerHTML = '<div class="empty">O catálogo precisa da conexão com o Supabase para carregar os produtos.</div>';
    });
    return;
  }

  await loadPublicProductReferences();
  let query = supabase.from(TABLES.PRODUTOS).select("*").eq("disponivel", true);
  if (getCurrentPage() === "index.html") query = query.eq("destaque", true).limit(6);

  const { data, error } = await query.order("criado_em", { ascending: false });
  if (error) {
    containers.forEach((container) => {
      container.innerHTML = '<div class="empty">Não foi possível carregar os produtos. Verifique a conexão e as permissões do Supabase.</div>';
    });
    console.error("Erro ao carregar produtos:", error);
    return;
  }
  loadedProductsForFilters = data || [];
  if (!loadedProductsForFilters.length) {
    containers.forEach((container) => {
      container.innerHTML = '<div class="empty">Nenhum produto publicado no momento.</div>';
    });
    return;
  }
  applyProductFilters();
}

/* =========================================================
   20. SERVICOS
   ========================================================= */

async function loadServices() {
  const containers = qsa(
    "#servicesGrid",
    "#servicosGrid",
    "#servicosLista",
    "#servicesList",
    "#servicosContainer",
    ".services-content .services-grid",
    ".services-section .services-grid",
    ".featured-services .services-grid"
  );

  if (!containers.length) return;
  if (!isSupabaseReady()) {
    containers.forEach((container) => {
      const hasFallback = container.dataset.staticFallback === "true" && container.querySelector(".service-card");
      container.setAttribute("aria-busy", "false");
      if (!hasFallback) container.innerHTML = '<div class="empty">Os serviços não puderam ser carregados porque a conexão com o Supabase está indisponível.</div>';
    });
    return;
  }

  let query = supabase
    .from(TABLES.SERVICOS)
    .select("id,nome,descricao,imagem_capa,ativo,criado_em")
    .eq("ativo", true);

  if (getCurrentPage() === "index.html") {
    query = query.limit(6);
  }

  const {
    data,
    error
  } = await query.order("criado_em", { ascending: false });

  containers.forEach((container) => {
    const hasFallback = container.dataset.staticFallback === "true" && container.querySelector(".service-card");
    container.setAttribute("aria-busy", "false");
    if (error) {
      if (!hasFallback) container.innerHTML = '<div class="empty">Não foi possível carregar os serviços. Tente novamente mais tarde.</div>';
      return;
    }

    if (!data?.length) {
      if (!hasFallback) container.innerHTML = '<div class="empty">Nenhum serviço publicado no momento.</div>';
      return;
    }

    container.innerHTML = data.map((service, index) => {
      const savedImage = service.imagem_capa || "";
      const image = savedImage || localAudioPhoto(index + 1);
      const imageAlt = savedImage ? (service.nome || "Serviço Max Som") : "Imagem ilustrativa de solução de áudio";
      return `
      <article class="service-card">
        <div class="service-photo"><img src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy"></div>
        <div class="service-info">
          <h3>${esc(service.nome || "Serviço")}</h3>
          <p>${esc(service.descricao || "Consulte a Max Som para conhecer este serviço.")}</p>
          <span class="service-price">Sob orçamento</span>
          <a
            href="atendimento.html?servico=${encodeURIComponent(service.id)}"
            class="btn btn-primary"
          >Solicitar atendimento</a>
        </div>
      </article>
    `;
    }).join("");
  });
}

/* =========================================================
   21. PROJETOS
   ========================================================= */

async function loadProjects() {
  const containers = qsa(
    "#projectsGrid",
    "#projetosGrid",
    "#projetosLista",
    "#projectsList",
    ".projects-content .projects-grid",
    ".projects-section .projects-grid",
    ".featured-projects .projects-grid"
  );

  if (!containers.length) return;
  if (!isSupabaseReady()) {
    containers.forEach((container) => {
      const hasFallback = container.dataset.staticFallback === "true" && container.querySelector(".project-card");
      container.setAttribute("aria-busy", "false");
      if (!hasFallback) container.innerHTML = '<div class="empty">Os projetos não puderam ser carregados porque a conexão com o Supabase está indisponível.</div>';
    });
    return;
  }

  let query = supabase
    .from(TABLES.PROJETOS)
    .select("id,titulo,categoria,descricao,imagem_capa,publicado,criado_em")
    .eq("publicado", true);

  if (getCurrentPage() === "index.html") {
    query = query.limit(6);
  }

  const {
    data,
    error
  } = await query.order("criado_em", { ascending: false });

  containers.forEach((container) => {
    const hasFallback = container.dataset.staticFallback === "true" && container.querySelector(".project-card");
    container.setAttribute("aria-busy", "false");
    if (error) {
      if (!hasFallback) container.innerHTML = '<div class="empty">Não foi possível carregar os projetos. Tente novamente mais tarde.</div>';
      return;
    }

    if (!data?.length) {
      if (!hasFallback) container.innerHTML = '<div class="empty">Nenhum projeto publicado no momento.</div>';
      return;
    }

    container.innerHTML = data.map((project, index) => {
      const savedImage = project.imagem_capa || "";
      const image = savedImage || localAudioPhoto(index + 2);
      const imageAlt = savedImage ? (project.titulo || "Projeto Max Som") : "Imagem ilustrativa de projeto de som";
      const photoClass = ["photo-blue", "photo-dark", "photo-light", "photo-blue-dark"][index % 4];
      return `
      <article class="project-card">
        <div class="project-photo ${photoClass}"><img class="project-image" src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy"></div>
        <div class="project-info">
          ${project.categoria ? `<span>${esc(project.categoria)}</span>` : ""}
          <h3>${esc(project.titulo || "Projeto")}</h3>
          ${project.descricao ? `<p>${esc(project.descricao)}</p>` : ""}
        </div>
      </article>
    `;
    }).join("");
  });
}

/* =========================================================
   22. PUBLICACOES
   ========================================================= */

async function loadPosts() {
  const containers = qsa(
    "#postsGrid",
    "#publicacoesGrid",
    "#publicacoesLista",
    "#publicationsList",
    "#publicacoesContainer",
    ".publications-content .posts-grid",
    ".recent-posts .posts-grid"
  );

  if (!containers.length) return;
  if (!isSupabaseReady()) {
    containers.forEach((container) => {
      container.innerHTML = '<div class="empty">As publicações não puderam ser carregadas porque a conexão com o Supabase está indisponível.</div>';
    });
    return;
  }

  let query = supabase
    .from(TABLES.PUBLICACOES)
    .select(
      "id,titulo,resumo,conteudo,imagem_capa,publica,data_publicacao,criado_em"
    )
    .eq("publica", true);

  if (getCurrentPage() === "index.html") {
    query = query.limit(6);
  }

  const {
    data,
    error
  } = await query.order("data_publicacao", { ascending: false });

  containers.forEach((container) => {
    if (error) {
      container.innerHTML =
        '<div class="empty">Não foi possível carregar as publicações.</div>';
      return;
    }

    if (!data?.length) {
      container.innerHTML =
        '<div class="empty">Nenhuma publicação disponível.</div>';
      return;
    }

    container.innerHTML = data.map((publication, index) => {
      const savedImage = publication.imagem_capa || "";
      const image = savedImage || localAudioPhoto(index + 3);
      const imageAlt = savedImage ? (publication.titulo || "Publicação Max Som") : "Imagem ilustrativa sobre som e equipamentos";
      const visualClass = ["visual-blue", "visual-dark", "visual-light"][index % 3];
      const publicationDate = publication.data_publicacao ? formatDate(publication.data_publicacao) : "Max Som";
      const plainContent = String(publication.conteudo || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const excerpt = String(publication.resumo || plainContent).slice(0, 170);
      const needsDetails = Boolean(publication.conteudo && plainContent.length > excerpt.length);
      return `
      <article class="publication-card post-card">
        <div class="publication-visual ${visualClass}">
          <img class="publication-image" src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy">
          <span class="publication-category">PUBLICAÇÃO</span>
          <span class="publication-stamp">MAX SOM</span>
        </div>
        <div class="publication-body post-info">
          <div class="publication-meta"><span>Novidades e informações</span><span>${esc(publicationDate)}</span></div>
          <h3>${esc(publication.titulo || "Publicação")}</h3>
          ${excerpt ? `<p>${esc(excerpt)}${plainContent.length > 170 ? "…" : ""}</p>` : ""}
          ${publication.conteudo ? `<details class="publication-details"><summary class="publication-link">Ler publicação completa <span aria-hidden="true">→</span></summary><p>${esc(plainContent || publication.conteudo)}</p></details>` : ""}
        </div>
      </article>
    `;
    }).join("");
  });
}

/* =========================================================
   23. LINKS DE SERVICOS / WHATSAPP
   ========================================================= */

function setupServiceLinks() {
  qsa("[data-service]").forEach((element) => {
    if (element.dataset.serviceBound === "true") return;

    element.dataset.serviceBound = "true";
    element.addEventListener("click", (event) => {
      event.preventDefault();
      const service =
        element.dataset.service ||
        element.textContent.trim() ||
        "Atendimento";
      window.location.href =
        `atendimento.html?servico=${encodeURIComponent(service)}`;
    });
  });
}

function setupWhatsApp() {
  const whatsappLinks = [
    ...qsa("[data-whatsapp]"),
    ...qsa(".topbar-right .top-link").filter((element) =>
      /whatsapp/i.test(element.textContent || "")
    )
  ];

  [...new Set(whatsappLinks)].forEach((element) => {
    if (element.dataset.whatsappBound === "true") return;

    element.dataset.whatsappBound = "true";
    element.addEventListener("click", (event) => {
      event.preventDefault();
      const message =
        element.dataset.whatsappMessage ||
        "Olá! Gostaria de falar com a Max Som.";
      window.open(
        `https://wa.me/5565996262514?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
  });
}

/* =========================================================
   24. CONVERSAS
   ========================================================= */

async function loadConversations() {
  const container = qs(
    "#conversationsList",
    "#conversationList",
    "#conversasLista"
  );

  if (!container || !currentUser) return;

  let conversationsQuery = supabase
    .from(TABLES.CONVERSAS)
    .select("id,cliente_id,funcionario_id,assunto,status,criado_em,atualizado_em");
  if (!isAdmin()) conversationsQuery = conversationsQuery.eq("cliente_id", currentUser.id);
  const { data, error } = await conversationsQuery.order("atualizado_em", { ascending: false });

  if (error) {
    container.innerHTML =
      '<div class="empty">Não foi possível carregar suas conversas.</div>';
    console.error(error);
    return;
  }

  if (!data?.length) {
    container.innerHTML =
      '<div class="empty">Nenhuma conversa encontrada.</div>';
    return;
  }

  container.innerHTML = data.map((conversation) => `
    <a
      class="conversation-card"
      href="conversa.html?id=${encodeURIComponent(conversation.id)}"
    >
      <div class="conversation-card-content">
        <div>
          <h3>${esc(conversation.assunto || "Atendimento Max Som")}</h3>
          <span>${esc(conversation.status || "aberta")}</span>
        </div>
        <time>${esc(formatDateTime(conversation.atualizado_em || conversation.criado_em))}</time>
      </div>
    </a>
  `).join("");
}

async function createConversation(assunto = "Atendimento Max Som") {
  if (!isSupabaseReady()) {
    alert("Não foi possível iniciar a conversa porque a conexão com o Supabase não está disponível. Recarregue a página e tente novamente.");
    return null;
  }

  if (!currentUser) {
    window.location.replace("login.html");
    return null;
  }

  const {
    data,
    error
  } = await supabase
    .from(TABLES.CONVERSAS)
    .insert({
      cliente_id: currentUser.id,
      assunto,
      status: "aberta"
    })
    .select(
      "id,cliente_id,funcionario_id,assunto,status,criado_em,atualizado_em"
    )
    .single();

  if (error) {
    alert("Não foi possível iniciar a conversa. Verifique se sua conta tem um perfil válido e se as permissões de conversas estão configuradas no Supabase.");
    console.error("Erro ao iniciar conversa:", error);
    return null;
  }

  return data;
}

async function openConversation(assunto) {
  const conversation =
    await createConversation(assunto || "Atendimento geral");

  if (!conversation) return;

  window.location.href =
    `conversa.html?id=${encodeURIComponent(conversation.id)}`;
}

function setupConversationButtons() {
  qsa("[data-open-conversation]").forEach((button) => {
    if (button.dataset.conversationBound === "true") return;

    button.dataset.conversationBound = "true";
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      await openConversation(
        button.dataset.openConversation ||
        button.dataset.assunto ||
        button.textContent.trim() ||
        "Atendimento geral"
      );
    });
  });
}

async function loadConversation() {
  const container = qs(
    "#conversaContainer",
    "#chatMessages"
  );

  if (!container || !currentUser) return;

  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get("id");

  if (!conversationId) {
    container.innerHTML =
      '<div class="empty">Conversa não encontrada.</div>';
    return;
  }

  const {
    data: conversation,
    error
  } = await supabase
    .from(TABLES.CONVERSAS)
    .select(
      "id,cliente_id,funcionario_id,assunto,status,criado_em,atualizado_em"
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !conversation) {
    container.innerHTML =
      '<div class="empty">Esta conversa não está disponível.</div>';
    if (error) console.error(error);
    return;
  }
  const isParticipant = conversation.cliente_id === currentUser.id || conversation.funcionario_id === currentUser.id;
  if (!isParticipant && !isAdmin()) {
    container.innerHTML = '<div class="empty">Você não tem permissão para acessar esta conversa.</div>';
    return;
  }

  const title = qs("#conversaTitulo", "#chatTitle");
  const status = qs("#conversaStatus", "#chatStatus");

  if (title) title.textContent = conversation.assunto || "Atendimento Max Som";
  if (status) status.textContent = conversation.status || "aberta";

  await loadMessages(conversationId);
  setupMessageForm(conversationId);
}

async function loadMessages(conversationId) {
  const container = qs(
    "#mensagensLista",
    "#chatMessages"
  );

  if (!container || !conversationId) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.MENSAGENS)
    .select(
      "id,conversa_id,remetente_id,conteudo,lida,criado_em"
    )
    .eq("conversa_id", conversationId)
    .order("criado_em", { ascending: true });

  if (error) {
    container.innerHTML =
      '<div class="empty">Não foi possível carregar as mensagens.</div>';
    console.error(error);
    return;
  }

  if (!data?.length) {
    container.innerHTML =
      '<div class="empty-messages">Nenhuma mensagem ainda.</div>';
    return;
  }

  container.innerHTML = data.map((message) => {
    const mine = message.remetente_id === currentUser?.id;

    return `
      <div class="message ${mine ? "message-own" : "message-other"}">
        <div class="message-content">
          <p>${esc(message.conteudo || "")}</p>
          <time>${esc(formatDateTime(message.criado_em))}</time>
        </div>
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function setupMessageForm(conversationId) {
  const form = qs(
    "#mensagemForm",
    "#chatForm",
    "#messageForm"
  );
  if (!form || form.dataset.messageBound === "true") return;

  const input = qs(
    "#mensagemInput",
    "#chatMessage",
    "#messageInput",
    "#mensagem",
    "#textoMensagem"
  );
  const button = qs(
    "#mensagemEnviar",
    "#chatSend",
    "#messageSend"
  );

  form.dataset.messageBound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) return;

    const content = input?.value.trim() || "";
    if (!content) return;

    if (button) button.disabled = true;
    try {
      const { error } = await supabase
        .from(TABLES.MENSAGENS)
        .insert({
          conversa_id: conversationId,
          remetente_id: currentUser.id,
          conteudo: content,
          lida: false
        });

      if (error) throw error;
      if (input) input.value = "";
      clearMessage("#mensagemConversa");
      await loadMessages(conversationId);
    } catch (error) {
      showMessage(
        "#mensagemConversa",
        "Não foi possível enviar a mensagem. Verifique a conexão e tente novamente.",
        "error"
      );
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* =========================================================
   25. NOTIFICACOES
   ========================================================= */

async function loadNotifications() {
  const container = qs(
    "#notificacoesLista",
    "#notificationsList",
    "#notificationList"
  );

  if (!container || !currentUser) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.NOTIFICACOES)
    .select(
      "id,usuario_id,titulo,mensagem,lida,link,criado_em"
    )
    .eq("usuario_id", currentUser.id)
    .order("criado_em", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erro ao carregar notificações da conta:", error);
    renderAccountQueryError(
      container,
      "suas notificações",
      "public.notificacao",
      error,
      loadNotifications
    );
    return;
  }

  if (!data?.length) {
    container.innerHTML =
      '<div class="empty">Nenhuma notificação.</div>';
    return;
  }

  container.innerHTML = data.map((notification) => `
    <article class="notification-card ${notification.lida ? "read" : "unread"}">
      <div>
        <strong>${esc(notification.titulo || "Notificação")}</strong>
        ${notification.mensagem ? `<p>${esc(notification.mensagem)}</p>` : ""}
        ${notification.criado_em ? `<small>${esc(formatDateTime(notification.criado_em))}</small>` : ""}
      </div>
      <div class="notification-actions">
        ${notification.link ? `<a class="btn btn-secondary" href="${esc(safeHref(notification.link))}">Abrir</a>` : ""}
        ${!notification.lida
          ? `<button type="button" class="btn btn-outline" data-mark-notification data-notification-id="${esc(notification.id)}">Marcar como lida</button>`
          : ""}
      </div>
    </article>
  `).join("");

  setupNotificationActions();
}

async function markNotificationAsRead(notificationId) {
  if (!currentUser || !notificationId) return false;

  const { error } = await supabase
    .from(TABLES.NOTIFICACOES)
    .update({ lida: true })
    .eq("id", notificationId)
    .eq("usuario_id", currentUser.id);

  if (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return false;
  }

  await loadNotifications();
  return true;
}

function setupNotificationActions() {
  qsa("[data-mark-notification]").forEach((button) => {
    if (button.dataset.notificationBound === "true") return;

    button.dataset.notificationBound = "true";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const updated = await markNotificationAsRead(button.dataset.notificationId);
      if (!updated) button.disabled = false;
    });
  });
}

/* =========================================================
   26. ADMIN - ESTATISTICAS
   ========================================================= */

async function countTable(table) {
  const {
    count,
    error
  } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error(`Erro ao contar ${table}:`, error);
    // Zero significa que a consulta foi bem-sucedida e não encontrou linhas.
    // null significa que não foi possível determinar a contagem (RLS/tabela/conexão).
    return null;
  }

  return count ?? 0;
}

async function adminStats() {
  const container = qs("#adminStats");
  if (!container || !currentUser || !isAdmin()) return;

  const [
    produtos,
    servicos,
    projetos,
    publicacoes,
    usuarios,
    solicitacoes,
    conversas
  ] = await Promise.all([
    countTable(TABLES.PRODUTOS),
    countTable(TABLES.SERVICOS),
    countTable(TABLES.PROJETOS),
    countTable(TABLES.PUBLICACOES),
    countTable(TABLES.USUARIO),
    countTable(TABLES.SOLICITACOES),
    countTable(TABLES.CONVERSAS)
  ]);

  const values = [
    ["Produtos", produtos],
    ["Serviços", servicos],
    ["Projetos", projetos],
    ["Publicações", publicacoes],
    ["Usuários", usuarios],
    ["Solicitações", solicitacoes],
    ["Conversas", conversas]
  ];

  container.innerHTML = values.map(([label, value]) => `
    <div class="stat-card" title="${value === null ? "Não foi possível consultar este indicador" : "Contagem consultada no banco"}">
      <span>${esc(label)}</span>
      <strong>${value === null ? "—" : value}</strong>
      ${value === null ? '<small class="stat-unavailable">Indisponível</small>' : ""}
    </div>
  `).join("");
}

/* =========================================================
   27. ADMIN - LISTAS
   ========================================================= */

async function adminUsers() {
  const container = qs("#adminUsuariosLista");
  if (!container) return;
  if (!isOwner()) {
    container.innerHTML = '<p>Esta área é exclusiva do dono/administrador principal.</p>';
    return;
  }

  const {
    data,
    error
  } = await supabase
    .from(TABLES.USUARIO)
    .select("id,nome,telefone,whatsapp,tipo_usuario")
    .order("nome", { ascending: true });

  if (error) {
    container.innerHTML = '<p>Erro ao carregar usuários.</p>';
    console.error(error);
    return;
  }

  container.innerHTML = (data || []).map((user) => {
    const type = normalizeType(user.tipo_usuario);
    const action = type === "solicitante_admin"
      ? `
        <div class="admin-user-actions">
          <button type="button" class="btn-aprovar-admin" data-user-id="${esc(user.id)}" data-action="aprovar">Aprovar administrador</button>
          <button type="button" class="btn-recusar-admin" data-user-id="${esc(user.id)}" data-action="recusar">Recusar</button>
        </div>
      `
      : "";

    return `
      <div class="admin-user-card">
        <div class="admin-user-info">
          <strong>${esc(user.nome || "Sem nome")}</strong>
          <span>${esc(user.tipo_usuario || "cliente")}</span>
        </div>
        ${OWNER_TYPES.includes(type)
          ? '<span class="admin-badge">Administrador</span>'
          : STAFF_TYPES.includes(type)
            ? '<span class="admin-badge">Funcionário autorizado</span>'
            : action}
      </div>
    `;
  }).join("") || '<p>Nenhum usuário encontrado.</p>';

  setupAdminUserActions();
}

async function adminRequests() {
  const requests = qs("#adminSolicitacoes");
  const conversations = qs("#adminConversas");
  if (!isAdmin()) return;

  if (requests) {
    const { data, error } = await supabase
      .from(TABLES.SOLICITACOES)
      .select("id,cliente_id,servico_id,status,descricao_problema,observacoes,criado_em")
      .order("criado_em", { ascending: false })
      .limit(30);

    requests.innerHTML = error
      ? '<p>Não foi possível carregar as solicitações. Confira a conexão, o nome da tabela e as permissões RLS.</p>'
      : data?.length
        ? data.map((item) => {
            const status = normalizeType(item.status || "solicitado");
            const needsReview = ["solicitado", "pendente", "em_analise", "em análise"].includes(status);
            const waitingClient = ["aguardando_informacoes", "aguardando_informação", "aguardando_cliente", "aguardando informações", "aguardando informação"].includes(status);
            const closed = ["recusado", "concluido", "concluído", "cancelado", "finalizado"].includes(status);
            const description = item.descricao_problema || item.observacoes || "Sem descrição informada.";
            return `
              <article class="account-item admin-request-card" data-request-card="${esc(item.id)}">
                <div class="admin-request-heading">
                  <strong>Solicitação #${esc(String(item.id).slice(0, 8))}</strong>
                  <span class="admin-request-status">${esc(item.status || "solicitado")}</span>
                </div>
                <small>Cliente: ${esc(item.cliente_id || "não identificado")} · ${esc(formatDateTime(item.criado_em))}</small>
                <p>${esc(description)}</p>
                ${item.observacoes ? `<details><summary>Ver observações/histórico</summary><p>${esc(item.observacoes)}</p></details>` : ""}
                <div class="admin-request-actions">
                  ${needsReview ? `
                    <button type="button" class="btn btn-primary" data-request-action="accept" data-request-id="${esc(item.id)}" data-request-client="${esc(item.cliente_id || "")}" data-request-description="${esc(description)}">Aceitar e abrir conversa</button>
                    <button type="button" class="btn btn-outline" data-request-action="ask" data-request-id="${esc(item.id)}">Pedir informações</button>
                    <button type="button" class="btn btn-danger" data-request-action="refuse" data-request-id="${esc(item.id)}">Recusar</button>
                  ` : waitingClient ? '<span>Aguardando resposta do cliente.</span>' : closed ? '<span>Solicitação finalizada. O histórico foi preservado.</span>' : '<span>Em acompanhamento.</span>'}
                </div>
              </article>
            `;
          }).join("")
        : '<p>Nenhuma solicitação encontrada.</p>';
    if (!error) setupAdminRequestActions();
    if (error) console.error("Erro ao carregar solicitações administrativas:", error);
  }

  if (conversations) {
    const { data, error } = await supabase
      .from(TABLES.CONVERSAS)
      .select("id,assunto,status,criado_em,atualizado_em")
      .order("atualizado_em", { ascending: false })
      .limit(30);

    conversations.innerHTML = error
      ? '<p>Não foi possível carregar as conversas.</p>'
      : data?.length
        ? data.map((item) => `
            <div class="account-item">
              <strong>${esc(item.assunto || "Atendimento")}</strong>
              <span>${esc(item.status || "aberta")} • ${esc(formatDateTime(item.atualizado_em || item.criado_em))}</span>
              <a href="conversa.html?id=${encodeURIComponent(item.id)}">Abrir conversa →</a>
            </div>
          `).join("")
        : '<p>Nenhuma conversa encontrada.</p>';
    if (error) console.error("Erro ao carregar conversas administrativas:", error);
  }
}

function appendRequestHistory(existing, heading, message) {
  const stamp = new Date().toLocaleString("pt-BR");
  const entry = `[${stamp}] ${heading}: ${String(message || "").trim()}`;
  return [String(existing || "").trim(), entry].filter(Boolean).join("\n\n");
}

async function notifyUserBestEffort(userId, title, message, link = "conta.html") {
  if (!userId || !supabase) return;
  const { error } = await supabase.from(TABLES.NOTIFICACOES).insert({
    usuario_id: userId,
    titulo: title,
    mensagem: message,
    lida: false,
    link
  });
  // A notificação não pode invalidar a alteração principal se a política do banco
  // não autorizar o funcionário a inserir notificações diretamente.
  if (error) console.warn("A alteração foi processada, mas a notificação não pôde ser criada:", error);
}

async function setupAdminRequestActions() {
  qsa("[data-request-action]").forEach((button) => {
    if (button.dataset.requestActionBound === "true") return;
    button.dataset.requestActionBound = "true";
    button.addEventListener("click", async () => {
      if (!isAdmin()) {
        alert("Somente a equipe autorizada pode alterar solicitações.");
        return;
      }
      const id = button.dataset.requestId;
      const action = button.dataset.requestAction;
      if (!id || !action) return;
      button.disabled = true;
      try {
        const { data: item, error: readError } = await supabase
          .from(TABLES.SOLICITACOES)
          .select("id,cliente_id,status,descricao_problema,observacoes,criado_em")
          .eq("id", id)
          .maybeSingle();
        if (readError || !item) throw readError || new Error("Solicitação não encontrada.");

        let status = "";
        let historyLabel = "";
        let historyText = "";
        if (action === "ask") {
          const question = window.prompt("Quais informações o cliente precisa enviar?");
          if (!question || !question.trim()) return;
          status = "aguardando_informacoes";
          historyLabel = "Equipe solicitou informações";
          historyText = question.trim();
        } else if (action === "refuse") {
          const reason = window.prompt("Informe o motivo da recusa (ele ficará registrado no histórico do cliente):");
          if (!reason || !reason.trim()) return;
          status = "recusado";
          historyLabel = "Solicitação recusada";
          historyText = reason.trim();
        } else if (action === "accept") {
          status = "aceito";
          historyLabel = "Solicitação aceita pela equipe";
          historyText = "A equipe aceitou a solicitação e iniciou a preparação do atendimento.";
        } else {
          return;
        }

        const newHistory = appendRequestHistory(item.observacoes, historyLabel, historyText);
        const { error: updateError } = await supabase
          .from(TABLES.SOLICITACOES)
          .update({ status, observacoes: newHistory })
          .eq("id", id);
        if (updateError) {
          throw new Error(`Não foi possível atualizar o status. O banco pode exigir outro valor de status ou negar a operação por RLS. ${updateError.message || ""}`);
        }

        let conversationId = null;
        if (action === "accept") {
          // A referência da solicitação fica no assunto para não inventar colunas no banco.
          const title = `[Solicitação #${String(id).slice(0, 8)}] ${String(item.descricao_problema || "Atendimento").replace(/\s+/g, " ").slice(0, 90)}`;
          const { data: conversation, error: conversationError } = await supabase
            .from(TABLES.CONVERSAS)
            .insert({
              cliente_id: item.cliente_id,
              funcionario_id: currentUser.id,
              assunto: title,
              status: "aberta"
            })
            .select("id")
            .single();
          if (conversationError) {
            console.error("Solicitação aceita, mas não foi possível criar a conversa:", conversationError);
            alert("A solicitação foi aceita, mas não foi possível abrir a conversa. Confira as permissões RLS da tabela conversas.");
          } else {
            conversationId = conversation.id;
            await notifyUserBestEffort(item.cliente_id, "Solicitação aceita", "A equipe aceitou sua solicitação e abriu uma conversa para continuar o atendimento.", `conversa.html?id=${encodeURIComponent(conversationId)}`);
          }
        } else if (action === "ask") {
          await notifyUserBestEffort(item.cliente_id, "Precisamos de mais informações", historyText, "conta.html");
        } else if (action === "refuse") {
          await notifyUserBestEffort(item.cliente_id, "Atualização da solicitação", `Sua solicitação foi recusada. Motivo: ${historyText}. Você pode registrar uma nova solicitação pela página de atendimento.`, "atendimento.html");
        }

        await adminRequests();
        await adminStats();
        alert(action === "accept"
          ? (conversationId ? "Solicitação aceita e conversa criada." : "Solicitação aceita. A conversa precisa ser criada manualmente.")
          : action === "ask" ? "Pedido de informações registrado." : "Recusa registrada com motivo; o histórico foi preservado.");
      } catch (error) {
        console.error("Erro ao processar solicitação:", error);
        alert(error?.message || "Não foi possível processar a solicitação.");
      } finally {
        button.disabled = false;
      }
    });
  });
}

async function replyToRequest(requestId, textarea, button) {
  if (!currentUser || !requestId || !textarea) return;
  const reply = textarea.value.trim();
  if (!reply) {
    textarea.focus();
    alert("Escreva as informações antes de enviar.");
    return;
  }
  button.disabled = true;
  try {
    const { data: item, error: readError } = await supabase
      .from(TABLES.SOLICITACOES)
      .select("id,status,observacoes")
      .eq("id", requestId)
      .eq("cliente_id", currentUser.id)
      .maybeSingle();
    if (readError || !item) throw readError || new Error("Solicitação não encontrada para esta conta.");
    const currentStatus = normalizeType(item.status || "");
    if (!["aguardando_informacoes", "aguardando_informação", "aguardando_cliente", "aguardando informações", "aguardando informação"].includes(currentStatus)) {
      throw new Error("Esta solicitação não está aguardando informações do cliente.");
    }
    const { error } = await supabase
      .from(TABLES.SOLICITACOES)
      .update({
        status: "solicitado",
        observacoes: appendRequestHistory(item.observacoes, "Resposta do cliente", reply)
      })
      .eq("id", requestId)
      .eq("cliente_id", currentUser.id);
    if (error) throw error;
    await loadAccountRequests();
    alert("Informações enviadas. A solicitação voltou para análise.");
  } catch (error) {
    console.error("Erro ao responder solicitação:", error);
    alert("Não foi possível enviar as informações. Confira sua conexão e as permissões RLS.");
  } finally {
    button.disabled = false;
  }
}

/* =========================================================
   28. ADMIN - CRUD
   ========================================================= */

async function saveAdminRow(table, id, values) {
  const contentTables = [TABLES.PRODUTOS, TABLES.SERVICOS, TABLES.PROJETOS];
  const allowedTables = [...contentTables, TABLES.PUBLICACOES];
  if (!isAdmin() || !allowedTables.includes(table)) {
    alert("Você não tem permissão para salvar este conteúdo.");
    return false;
  }
  if (contentTables.includes(table) && !isOwner()) {
    alert("O cadastro e a edição deste conteúdo são exclusivos do dono.");
    return false;
  }
  if (!supabase) {
    alert("A conexão com o Supabase não está disponível.");
    return false;
  }
  const query = id
    ? supabase.from(table).update(values).eq("id", id)
    : supabase.from(table).insert(values);

  const {
    error
  } = await query;

  if (error) {
    alert(dbError(error, "Não foi possível salvar."));
    return false;
  }

  alert("Dados salvos com sucesso.");
  return true;
}

async function loadAdminProducts() {
  const container = qs("#produtosAdminLista");
  if (!container || !isAdmin()) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.PRODUTOS)
    .select("id,nome,Modelo,descricao,imagem_capa,disponivel,destaque,categoria_id,marca_id")
    .order("nome", { ascending: true });

  if (error) {
    container.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
    return;
  }

  container.innerHTML = (data || []).map((item) => `
    <div class="admin-item" data-admin-item>
      <div>
        <strong>${esc(item.nome || "Produto")}</strong>
        <span>${esc(item.modelo || item.Modelo || "")}</span>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="btn btn-outline" data-edit-type="produto" data-edit-id="${esc(item.id)}">Editar</button>
        <button type="button" class="btn btn-danger" data-delete-table="${TABLES.PRODUTOS}" data-delete-id="${esc(item.id)}">Excluir</button>
      </div>
    </div>
  `).join("") || '<p>Nenhum produto cadastrado.</p>';
}

async function loadAdminServices() {
  const container = qs("#servicosAdminLista");
  if (!container || !isAdmin()) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.SERVICOS)
    .select("id,nome,descricao,imagem_capa,ativo")
    .order("nome", { ascending: true });

  if (error) {
    container.innerHTML = '<p>Não foi possível carregar os serviços.</p>';
    return;
  }

  container.innerHTML = (data || []).map((item) => `
    <div class="admin-item" data-admin-item>
      <div><strong>${esc(item.nome || "Serviço")}</strong></div>
      <div class="admin-item-actions">
        <button type="button" class="btn btn-outline" data-edit-type="servico" data-edit-id="${esc(item.id)}">Editar</button>
        <button type="button" class="btn btn-danger" data-delete-table="${TABLES.SERVICOS}" data-delete-id="${esc(item.id)}">Excluir</button>
      </div>
    </div>
  `).join("") || '<p>Nenhum serviço cadastrado.</p>';
}

async function loadAdminProjects() {
  const container = qs("#projetosAdminLista");
  if (!container || !isAdmin()) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.PROJETOS)
    .select("id,titulo,categoria,descricao,imagem_capa,publicado")
    .order("titulo", { ascending: true });

  if (error) {
    container.innerHTML = '<p>Não foi possível carregar os projetos.</p>';
    return;
  }

  container.innerHTML = (data || []).map((item) => `
    <div class="admin-item" data-admin-item>
      <div><strong>${esc(item.titulo || "Projeto")}</strong></div>
      <div class="admin-item-actions">
        <button type="button" class="btn btn-outline" data-edit-type="projeto" data-edit-id="${esc(item.id)}">Editar</button>
        <button type="button" class="btn btn-danger" data-delete-table="${TABLES.PROJETOS}" data-delete-id="${esc(item.id)}">Excluir</button>
      </div>
    </div>
  `).join("") || '<p>Nenhum projeto cadastrado.</p>';
}

async function loadAdminPosts() {
  const container = qs("#publicacoesAdminLista");
  if (!container || !isAdmin()) return;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.PUBLICACOES)
    .select("id,titulo,resumo,publica,data_publicacao")
    .order("data_publicacao", { ascending: false });

  if (error) {
    container.innerHTML = '<p>Não foi possível carregar as publicações.</p>';
    return;
  }

  container.innerHTML = (data || []).map((item) => `
    <div class="admin-item" data-admin-item>
      <div><strong>${esc(item.titulo || "Publicação")}</strong><span>${item.publica ? "Publicada" : "Rascunho"}</span></div>
      <div class="admin-item-actions">
        <button type="button" class="btn btn-outline" data-edit-type="publicacao" data-edit-id="${esc(item.id)}">Editar</button>
        <button type="button" class="btn btn-danger" data-delete-table="${TABLES.PUBLICACOES}" data-delete-id="${esc(item.id)}">Excluir</button>
      </div>
    </div>
  `).join("") || '<p>Nenhuma publicação cadastrada.</p>';
}

async function loadOptionsIntoSelect(selectId, tableCandidates, label) {
  const select = qs(selectId);
  if (!select) return [];
  const previousValue = select.value;
  let foundAnyTable = false;
  let finalRows = [];

  for (const table of tableCandidates) {
    let result = await supabase.from(table).select("id,nome,ativo").order("nome", { ascending: true });
    if (result.error) {
      result = await supabase.from(table).select("id,nome").order("nome", { ascending: true });
    }
    if (result.error) continue;
    foundAnyTable = true;
    const rows = (result.data || []).filter((row) => row.ativo !== false);
    if (rows.length) {
      finalRows = rows;
      break;
    }
    finalRows = rows;
  }

  select.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = finalRows.length ? `Selecione ${label}` :
    foundAnyTable ? `Nenhuma opção cadastrada (${label})` : `${label} indisponível — confira o Supabase`;
  select.appendChild(placeholder);

  finalRows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row.id;
    option.textContent = row.nome || label;
    select.appendChild(option);
  });
  if (previousValue && finalRows.some((row) => String(row.id) === previousValue)) {
    select.value = previousValue;
  }
  select.disabled = !finalRows.length;
  return finalRows;
}

async function loadAdminReferenceOptions() {
  if (!isSupabaseReady()) return;
  const tasks = [
    loadOptionsIntoSelect("#publicacaoCategoria", ["categoria_publicacao", "categorias_publicacao"], "uma categoria")
  ];
  if (isOwner()) {
    tasks.push(
      loadOptionsIntoSelect("#produtoCategoria", ["categoria_produto", "categorias_produto"], "uma categoria"),
      loadOptionsIntoSelect("#produtoMarca", ["marcas", "marca"], "uma marca")
    );
  }
  await Promise.all(tasks);
}

async function setupAdminForms() {
  if (!isAdmin()) return;

  if (isOwner()) {
  const productForm = qs("#produtoForm");
  if (productForm && productForm.dataset.formBound !== "true") {
    productForm.dataset.formBound = "true";
    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = qs("#produtoId")?.value || "";
      const categoriaId = qs("#produtoCategoria")?.value || "";
      const marcaId = qs("#produtoMarca")?.value || "";
      if (!categoriaId || !marcaId) {
        alert("Para salvar o produto, cadastre e selecione uma categoria e uma marca no Supabase.");
        return;
      }
      const values = {
        nome: qs("#produtoNome")?.value.trim() || "",
        "Modelo": qs("#produtoModelo")?.value.trim() || null,
        descricao: qs("#produtoDescricao")?.value.trim() || null,
        imagem_capa: qs("#produtoImagem")?.value.trim() || null,
        categoria_id: qs("#produtoCategoria")?.value || null,
        marca_id: qs("#produtoMarca")?.value || null,
        disponivel: !!qs("#produtoDisponivel")?.checked,
        destaque: !!qs("#produtoDestaque")?.checked
      };
      if (await saveAdminRow(TABLES.PRODUTOS, id, values)) {
        productForm.reset();
        qs("#produtoId") && (qs("#produtoId").value = "");
        await loadAdminProducts();
        await loadProducts();
      }
    });
  }

  const serviceForm = qs("#servicoForm");
  if (serviceForm && serviceForm.dataset.formBound !== "true") {
    serviceForm.dataset.formBound = "true";
    serviceForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = qs("#servicoId")?.value || "";
      const values = {
        nome: qs("#servicoNome")?.value.trim() || "",
        descricao: qs("#servicoDescricao")?.value.trim() || null,
        imagem_capa: qs("#servicoImagem")?.value.trim() || null,
        ativo: !!qs("#servicoAtivo")?.checked
      };
      if (await saveAdminRow(TABLES.SERVICOS, id, values)) {
        serviceForm.reset();
        qs("#servicoId") && (qs("#servicoId").value = "");
        await loadAdminServices();
        await loadServices();
      }
    });
  }

  const projectForm = qs("#projetoForm");
  if (projectForm && projectForm.dataset.formBound !== "true") {
    projectForm.dataset.formBound = "true";
    projectForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = qs("#projetoId")?.value || "";
      const values = {
        titulo: qs("#projetoTitulo")?.value.trim() || "",
        categoria: qs("#projetoCategoria")?.value.trim() || null,
        descricao: qs("#projetoDescricao")?.value.trim() || null,
        imagem_capa: qs("#projetoImagem")?.value.trim() || null,
        publicado: !!qs("#projetoPublicado")?.checked,
        ...(id ? {} : { criado_por: currentUser.id })
      };
      if (await saveAdminRow(TABLES.PROJETOS, id, values)) {
        projectForm.reset();
        qs("#projetoId") && (qs("#projetoId").value = "");
        await loadAdminProjects();
        await loadProjects();
      }
    });
  }

  }

  const postForm = qs("#publicacaoForm");
  if (postForm && postForm.dataset.formBound !== "true") {
    postForm.dataset.formBound = "true";
    postForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = qs("#publicacaoId")?.value || "";
      const categoriaId = qs("#publicacaoCategoria")?.value || "";
      if (!categoriaId) {
        alert("Para salvar a publicação, cadastre e selecione uma categoria.");
        return;
      }
      const values = {
        titulo: qs("#publicacaoTitulo")?.value.trim() || "",
        resumo: qs("#publicacaoResumo")?.value.trim() || null,
        conteudo: qs("#publicacaoConteudo")?.value.trim() || null,
        imagem_capa: qs("#publicacaoImagem")?.value.trim() || null,
        categoria_id: qs("#publicacaoCategoria")?.value || null,
        publica: !!qs("#publicacaoPublicado")?.checked,
        ...(id ? {} : { autor_id: currentUser.id }),
        data_publicacao: qs("#publicacaoPublicado")?.checked ? new Date().toISOString() : null
      };
      if (await saveAdminRow(TABLES.PUBLICACOES, id, values)) {
        postForm.reset();
        qs("#publicacaoId") && (qs("#publicacaoId").value = "");
        await loadAdminPosts();
        await loadPosts();
      }
    });
  }
}

async function bindEditButtons() {
  qsa("[data-edit-type]").forEach((button) => {
    if (button.dataset.editBound === "true") return;

    button.dataset.editBound = "true";
    button.addEventListener("click", async () => {
      const type = button.dataset.editType;
      const id = button.dataset.editId;

      if (!type || !id) return;
      if (!isOwner() && type !== "publicacao") {
        alert("Esta edição é exclusiva do dono/administrador principal.");
        return;
      }

      const tableMap = {
        produto: TABLES.PRODUTOS,
        servico: TABLES.SERVICOS,
        projeto: TABLES.PROJETOS,
        publicacao: TABLES.PUBLICACOES
      };

      const table = tableMap[type];
      if (!table) return;

      const {
        data,
        error
      } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        console.error(error);
        return;
      }

      if (type === "produto") {
        qs("#produtoId") && (qs("#produtoId").value = data.id || "");
        qs("#produtoNome") && (qs("#produtoNome").value = data.nome || "");
        qs("#produtoModelo") && (qs("#produtoModelo").value = data.modelo || data.Modelo || "");
        qs("#produtoDescricao") && (qs("#produtoDescricao").value = data.descricao || "");
        qs("#produtoImagem") && (qs("#produtoImagem").value = data.imagem_capa || "");
        qs("#produtoCategoria") && (qs("#produtoCategoria").value = data.categoria_id || "");
        qs("#produtoMarca") && (qs("#produtoMarca").value = data.marca_id || "");
        qs("#produtoDisponivel") && (qs("#produtoDisponivel").checked = !!data.disponivel);
        qs("#produtoDestaque") && (qs("#produtoDestaque").checked = !!data.destaque);
      }

      if (type === "servico") {
        qs("#servicoId") && (qs("#servicoId").value = data.id || "");
        qs("#servicoNome") && (qs("#servicoNome").value = data.nome || "");
        qs("#servicoDescricao") && (qs("#servicoDescricao").value = data.descricao || "");
        qs("#servicoImagem") && (qs("#servicoImagem").value = data.imagem_capa || "");
        qs("#servicoAtivo") && (qs("#servicoAtivo").checked = !!data.ativo);
      }

      if (type === "projeto") {
        qs("#projetoId") && (qs("#projetoId").value = data.id || "");
        qs("#projetoTitulo") && (qs("#projetoTitulo").value = data.titulo || "");
        qs("#projetoCategoria") && (qs("#projetoCategoria").value = data.categoria || "");
        qs("#projetoDescricao") && (qs("#projetoDescricao").value = data.descricao || "");
        qs("#projetoImagem") && (qs("#projetoImagem").value = data.imagem_capa || "");
        qs("#projetoPublicado") && (qs("#projetoPublicado").checked = !!data.publicado);
      }

      if (type === "publicacao") {
        qs("#publicacaoId") && (qs("#publicacaoId").value = data.id || "");
        qs("#publicacaoTitulo") && (qs("#publicacaoTitulo").value = data.titulo || "");
        qs("#publicacaoResumo") && (qs("#publicacaoResumo").value = data.resumo || "");
        qs("#publicacaoConteudo") && (qs("#publicacaoConteudo").value = data.conteudo || "");
        qs("#publicacaoImagem") && (qs("#publicacaoImagem").value = data.imagem_capa || "");
        qs("#publicacaoCategoria") && (qs("#publicacaoCategoria").value = data.categoria_id || "");
        qs("#publicacaoPublicado") && (qs("#publicacaoPublicado").checked = !!data.publica);
      }
    });
  });
}

function setupDeleteButtons() {
  qsa("[data-delete-table]").forEach((button) => {
    if (button.dataset.deleteBound === "true") return;

    button.dataset.deleteBound = "true";
    button.addEventListener("click", async () => {
      const table = button.dataset.deleteTable;
      const id = button.dataset.deleteId;
      if (!table || !id) return;
      const deletableTables = [TABLES.PRODUTOS, TABLES.SERVICOS, TABLES.PROJETOS, TABLES.PUBLICACOES];
      if (!isAdmin() || !deletableTables.includes(table)) {
        alert("Você não tem permissão para excluir este item.");
        return;
      }
      if (!isOwner() && table !== TABLES.PUBLICACOES) {
        alert("Esta exclusão é exclusiva do dono/administrador principal.");
        return;
      }

      if (!window.confirm("Tem certeza que deseja excluir este item?")) {
        return;
      }

      const {
        error
      } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        alert("Não foi possível excluir o item.");
        console.error(error);
        return;
      }

      button.closest("[data-admin-item]")?.remove();
      await adminStats();
      await loadAdminProducts();
      await loadAdminServices();
      await loadAdminProjects();
      await loadAdminPosts();
    });
  });
}

function setupAdminUserActions() {
  qsa("[data-action]").forEach((button) => {
    if (button.dataset.userActionBound === "true") return;

    button.dataset.userActionBound = "true";
    button.addEventListener("click", async () => {
      if (!isOwner()) {
        alert("Somente o dono pode alterar permissões de usuários.");
        return;
      }
      const userId = button.dataset.userId;
      const action = button.dataset.action;

      if (!userId || !action) return;

      const newType = action === "aprovar" ? "admin" : "cliente";

      const {
        error
      } = await supabase
        .from(TABLES.USUARIO)
        .update({ tipo_usuario: newType })
        .eq("id", userId);

      if (error) {
        alert("Não foi possível atualizar o usuário.");
        console.error(error);
        return;
      }

      await adminUsers();
    });
  });
}

/* =========================================================
   29. MENU ADMIN
   ========================================================= */

function setupAdminMenu() {
  const buttons = qsa("[data-panel]").filter((button) => isOwner() || !button.hasAttribute("data-owner-only"));
  const panels = qsa(".admin-panel").filter((panel) => isOwner() || !panel.hasAttribute("data-owner-only"));

  if (!buttons.length || !panels.length) return;

  buttons.forEach((button) => {
    if (button.dataset.panelBound === "true") return;

    button.dataset.panelBound = "true";
    button.addEventListener("click", () => {
      const target = button.dataset.panel;

      buttons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      panels.forEach((panel) => {
        panel.style.display =
          panel.id === target ? "block" : "none";
      });
    });
  });

  buttons[0]?.click();
}

async function loadAdminArea() {
  if (getCurrentPage() !== "admin.html") return;

  const allowed = await requireAdmin();
  if (!allowed) return;
  const adminMain = qs("#adminMain");
  if (adminMain) adminMain.hidden = false;

  const tasks = [adminStats(), adminRequests(), loadAdminPosts()];
  if (isOwner()) tasks.push(loadAdminProducts(), loadAdminServices(), loadAdminProjects(), adminUsers());
  await Promise.allSettled(tasks);

  await loadAdminReferenceOptions();
  await setupAdminForms();
  await bindEditButtons();
  setupDeleteButtons();
  setupAdminMenu();
}

/* =========================================================
   30. REALTIME
   ========================================================= */

function setupRealtime() {
  if (!supabase || !currentUser) return;

  const conversationId =
    new URLSearchParams(window.location.search).get("id");

  if (conversationId && qs("#conversaContainer", "#chatMessages")) {
    supabase
      .channel(`maxsom-conversa-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLES.MENSAGENS,
          filter: `conversa_id=eq.${conversationId}`
        },
        async () => {
          await loadMessages(conversationId);
        }
      )
      .subscribe();
  }

  supabase
    .channel(`maxsom-notificacoes-${currentUser.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.NOTIFICACOES,
        filter: `usuario_id=eq.${currentUser.id}`
      },
      async () => {
        await loadNotifications();
      }
    )
    .subscribe();
}

function cleanupRealtimeChannels() {
  if (!supabase) return;

  supabase.getChannels().forEach((channel) => {
    try {
      supabase.removeChannel(channel);
    } catch (error) {
      console.warn("Não foi possível remover canal:", error);
    }
  });
}

/* =========================================================
   31. INTERFACE
   ========================================================= */

function setupCancelButtons() {
  qsa(
    "#produtoCancelar, #servicoCancelar, #projetoCancelar, #publicacaoCancelar, [data-cancel-form]"
  ).forEach((button) => {
    if (button.dataset.cancelBound === "true") return;

    button.dataset.cancelBound = "true";
    button.addEventListener("click", () => {
      const form = button.closest("form");
      form?.reset();
      form?.querySelector("input[type='hidden']") &&
        (form.querySelector("input[type='hidden']").value = "");
    });
  });
}

function markCurrentPage() {
  const page = getCurrentPage();

  // Apenas marca a página atual. A visibilidade dos itens de menu
  // pertence a updateNav(), que considera a sessão e as permissões.
  qsa("nav a[href]").forEach((link) => {
    const href = link.getAttribute("href")
      ?.split("?")[0]
      ?.split("#")[0]
      ?.toLowerCase();

    if (href === page) {
      link.classList.add("active", "nav-current");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active", "nav-current");
      link.removeAttribute("aria-current");
    }
  });
}

function enhancePublicInterface() {
  qsa(
    ".product-card, .service-card, .project-card, .post-card, .benefit-card"
  ).forEach((card, index) => {
    card.style.animationDelay = `${Math.min(index * 45, 250)}ms`;
  });
}

/* =========================================================
   32. CARREGAMENTO POR PAGINA
   ========================================================= */

async function loadCurrentPageData() {
  const page = getCurrentPage();

  // Carrega somente os dados usados pela página atual. Antes, os quatro catálogos
  // eram consultados em todas as páginas; isso podia atrasar a conta mesmo quando
  // produtos/serviços/projetos/publicações não apareciam nela.
  const pageLoaders = {
    "index.html": [loadProducts, loadServices, loadProjects, loadPosts],
    "produtos.html": [loadProducts],
    "servicos.html": [loadServices],
    "projetos.html": [loadProjects],
    "publicacoes.html": [loadPosts]
  };

  if (page === "conta.html") {
    // A conta é prioridade: primeiro renderiza nome/e-mail/perfil, depois suas listas.
    await loadAccountPage();
  } else if (page === "conversas.html") {
    await loadConversations();
  } else if (page === "conversa.html") {
    await loadConversation();
  } else if (page === "atendimento.html") {
    await setupAttendancePage();
  }

  const loaders = pageLoaders[page] || [];
  if (loaders.length) {
    await Promise.allSettled(loaders.map((loader) => loader()));
  }

  if (currentUser && page !== "conta.html") {
    await loadNotifications();
  }

  if (page === "admin.html") {
    await loadAdminArea();
  }
}

/* =========================================================
   MENU LATERAL / RESPONSIVO (LAYOUT ATUAL)
   ========================================================= */

function setupLayoutMenu() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeSidebarButton = document.getElementById("closeSidebar");
  const overlays = [
    document.getElementById("sidebarOverlay"),
    document.getElementById("overlay")
  ].filter(Boolean);
  const navLinks = document.querySelectorAll(".nav-link, .nav-item");
  const newerSidebarLayout = Boolean(
    closeSidebarButton || sidebar?.querySelector(".sidebar-nav") ||
    document.querySelector(".sidebar-nav .nav-item")
  );
  try {
    if (window.matchMedia("(min-width: 769px)").matches && localStorage.getItem("maxsom-sidebar-collapsed") === "1") {
      document.body.classList.add("sidebar-collapsed");
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Expandir menu");
        const label = menuToggle.querySelector(".toggle-label");
        if (label) label.textContent = "Expandir menu";
      }
    }
  } catch (_) { /* armazenamento indisponível: o menu continua funcional */ }

  function openMobileMenu() {
    document.body.classList.add("mobile-sidebar-open", "sidebar-open", "menu-open");
    if (sidebar) sidebar.classList.add("active", "open");
    overlays.forEach((overlay) => overlay.classList.add("active", "visible", "show"));
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    if (mobileMenu) mobileMenu.setAttribute("aria-expanded", "true");
  }

  function closeMobileMenu() {
    document.body.classList.remove("mobile-sidebar-open", "sidebar-open", "menu-open");
    if (sidebar) sidebar.classList.remove("active", "open");
    overlays.forEach((overlay) => overlay.classList.remove("active", "visible", "show"));
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    if (mobileMenu) mobileMenu.setAttribute("aria-expanded", "false");
  }

  // Layout novo: o botão menuToggle abre/fecha a sidebar no celular.
  // Layout antigo: menuToggle recolhe/expande a sidebar no computador.
  if (menuToggle && menuToggle.dataset.layoutMenuBound !== "true") {
    menuToggle.dataset.layoutMenuBound = "true";
    menuToggle.addEventListener("click", () => {
      if (newerSidebarLayout || window.matchMedia("(max-width: 768px)").matches) {
        const isOpen = document.body.classList.contains("mobile-sidebar-open") ||
          document.body.classList.contains("sidebar-open") ||
          sidebar?.classList.contains("active") || sidebar?.classList.contains("open");
        if (isOpen) closeMobileMenu();
        else openMobileMenu();
        return;
      }

      document.body.classList.toggle("sidebar-collapsed");
      const collapsed = document.body.classList.contains("sidebar-collapsed");
      try { localStorage.setItem("maxsom-sidebar-collapsed", collapsed ? "1" : "0"); } catch (_) {}
      menuToggle.setAttribute("aria-expanded", String(!collapsed));
      menuToggle.setAttribute(
        "aria-label",
        collapsed ? "Expandir menu" : "Recolher menu"
      );
      const label = menuToggle.querySelector(".toggle-label");
      if (label) {
        label.textContent = collapsed ? "Expandir menu" : "Recolher menu";
      }
    });
  }

  if (mobileMenu && mobileMenu.dataset.layoutMenuBound !== "true") {
    mobileMenu.dataset.layoutMenuBound = "true";
    mobileMenu.addEventListener("click", () => {
      const open = document.body.classList.contains("mobile-sidebar-open") ||
        document.body.classList.contains("sidebar-open");
      if (open) closeMobileMenu();
      else openMobileMenu();
    });
  }

  if (closeSidebarButton && closeSidebarButton.dataset.layoutMenuBound !== "true") {
    closeSidebarButton.dataset.layoutMenuBound = "true";
    closeSidebarButton.setAttribute("type", "button");
    closeSidebarButton.addEventListener("click", closeMobileMenu);
  }

  overlays.forEach((overlay) => {
    if (overlay.dataset.layoutMenuBound === "true") return;
    overlay.dataset.layoutMenuBound = "true";
    overlay.addEventListener("click", closeMobileMenu);
  });

  if (document.body.dataset.layoutEscapeBound !== "true") {
    document.body.dataset.layoutEscapeBound = "true";
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileMenu();
    });
  }

  // Ao navegar, fecha o menu se a versão móvel estiver aberta. Não cancela o link.
  navLinks.forEach((link) => {
    if (link.dataset.layoutLinkBound === "true") return;
    link.dataset.layoutLinkBound = "true";
    link.addEventListener("click", () => {
      if (document.body.classList.contains("mobile-sidebar-open") ||
          document.body.classList.contains("sidebar-open") ||
          newerSidebarLayout) {
        closeMobileMenu();
      }
    });
  });

  // Destacar o link da página atual nos dois modelos de menu.
  const page = getCurrentPage();
  navLinks.forEach((link) => {
    const href = link.getAttribute("href")
      ?.split("?")[0]
      ?.split("#")[0]
      ?.toLowerCase();

    if (href === page) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });

  const year = String(new Date().getFullYear());
  ["sidebarYear", "currentYear"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.textContent = year;
  });
}
/* =========================================================
   33. INICIALIZACAO
   ========================================================= */

async function initializeMaxSom() {
  try {
    // Ligue os formulários imediatamente, antes de qualquer chamada assíncrona.
    // Isso evita que um clique rápido dispare o POST nativo para uma página HTML estática
    // e produza HTTP 405 na hospedagem. As funções são idempotentes e podem ser chamadas
    // novamente depois que a sessão/perfil forem carregados.
    setupLogin();
    setupSignup();
    setupAttendanceForm();
    setupConversationButtons();

    // menu.js injeta o menu compartilhado no DOMContentLoaded; esta segunda chamada
    // conecta os controles depois que a barra lateral realmente existe.
    setupLayoutMenu();
    if (!isSupabaseReady()) {
      console.error("Supabase JS não foi carregado.");
      await updateNav();
      markCurrentPage();
      setupLogin();
      setupSignup();
      setupAttendanceForm();
      setupConversationButtons();
      setupGeneralNavigation();
      const offlineMessage = '<div class="empty">Conteúdo indisponível no momento. O sistema não conseguiu carregar o Supabase; verifique a conexão e tente novamente.</div>';
      ["#productsGrid", "#produtosGrid", "#servicesGrid", "#projectsGrid", "#postsGrid", "#publicacoesGrid", "#publicacoesLista", "#conversationsList", "#accountRequests", "#accountConversations", "#notificacoesLista", "#adminStats", "#adminSolicitacoes", "#adminConversas"].forEach((selector) => {
        qsa(selector).forEach((container) => { container.innerHTML = offlineMessage; });
      });
      const serviceSelect = qs("#servico", "#requestServico", "#servicoId");
      if (serviceSelect) {
        serviceSelect.innerHTML = '<option value="">Serviços indisponíveis: conexão com o sistema não carregada</option>';
        serviceSelect.disabled = true;
      }
      const page = getCurrentPage();
      if (["conta.html", "conversas.html", "conversa.html", "admin.html"].includes(page)) {
        const main = document.querySelector("main");
        if (main) {
          main.innerHTML = '<section class="empty system-connection-error" role="alert"><h1>Não foi possível validar sua sessão</h1><p>O sistema de autenticação não está disponível. Nenhum dado privado foi carregado. Recarregue a página quando a conexão com o Supabase estiver normalizada.</p><a class="button button-primary" href="login.html">Ir para o login</a></section>';
        }
      }
      return;
    }

    const {
      data,
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao recuperar sessão:", error);
      setupLogin();
      setupSignup();
      setupAttendanceForm();
      setupConversationButtons();
      setupGeneralNavigation();
      const offlineMessage = '<div class="empty">Não foi possível confirmar a sessão nem carregar os dados. Verifique a conexão e as permissões do Supabase e tente novamente.</div>';
      ["#productsGrid", "#produtosGrid", "#servicesGrid", "#projectsGrid", "#postsGrid", "#publicacoesGrid", "#publicacoesLista", "#conversationsList", "#accountRequests", "#accountConversations", "#notificacoesLista", "#adminStats", "#adminSolicitacoes", "#adminConversas"].forEach((selector) => qsa(selector).forEach((container) => { container.innerHTML = offlineMessage; }));
      const serviceSelect = qs("#servico", "#requestServico", "#servicoId");
      if (serviceSelect) { serviceSelect.innerHTML = '<option value="">Serviços indisponíveis: falha na conexão</option>'; serviceSelect.disabled = true; }
      const page = getCurrentPage();
      if (["conta.html", "conversas.html", "conversa.html", "admin.html"].includes(page)) {
        const main = document.querySelector("main");
        if (main) main.innerHTML = '<section class="empty system-connection-error" role="alert"><h1>Não foi possível validar sua sessão</h1><p>Nenhum dado privado foi carregado porque a autenticação não pôde ser confirmada. Recarregue a página quando a conexão estiver normalizada.</p><a class="button button-primary" href="login.html">Ir para o login</a></section>';
      }
      return;
    }

    currentUser = data?.session?.user || null;
    if (!currentUser) currentProfile = null;

    // Atualiza os links de sessão antes da leitura do perfil, que pode demorar.
    await updateNav();

    if (currentUser) {
      await loadProfile(currentUser);
    } else {
      currentProfile = null;
    }

    await updateNav();
    markCurrentPage();
    setupLogin();
    setupSignup();
    setupGeneralNavigation();
    setupServiceLinks();
    setupWhatsApp();
    setupConversationButtons();
    setupCancelButtons();
    setupAdminRequestButton();

    if (currentUser && ["login.html", "cadastro.html"].includes(getCurrentPage())) {
      await redirectAuthenticatedUser();
      return;
    }

    const allowed = await enforcePageAccess();
    if (!allowed) return;

    await loadCurrentPageData();
    setupRealtime();
    enhancePublicInterface();
    setupAuthListener();

  } catch (error) {
    console.error("Erro na inicialização do Max Som:", error);
    const status = document.getElementById("accountLoadStatus");
    if (status && document.querySelector("[data-account-page]")) {
      status.hidden = false;
      status.textContent = "A página abriu, mas não conseguiu terminar de carregar os dados da conta. Atualize a página; se continuar, abra o Console do navegador para ver o erro técnico.";
    }
  }
}

// O menu compartilhado pode terminar de ser criado antes da leitura da sessão.
// Sincronizamos novamente os links assim que o componente estiver pronto.
document.addEventListener("maxsom:menu-ready", () => {
  if (window.MaxSom?.updateNav) {
    window.MaxSom.updateNav().catch((error) => console.error("Não foi possível sincronizar o menu:", error));
  }
});

// O menu é renderizado por js/menu.js; a inicialização liga os eventos quando o DOM está pronto.
function startMaxSomInitialization() {
  // Exposto apenas como Promise de inicialização para que a página Minha Conta
  // consiga recuperar os dados básicos se main.js interromper a renderização.
  window.maxSomInitializationPromise = initializeMaxSom();
  return window.maxSomInitializationPromise;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMaxSomInitialization, { once: true });
} else {
  startMaxSomInitialization();
}

window.MaxSom = {
  initialize: initializeMaxSom,
  updateNav,
  ensureProfile,
  requireAdmin,
  refreshAccountForUser,
  reloadAccountLists,
  logout,
  loadProducts,
  loadServices,
  loadProjects,
  loadPosts,
  loadConversations,
  loadConversation,
  loadNotifications,
  setupLogin,
  setupSignup
};

