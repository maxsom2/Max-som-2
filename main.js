/* =========================================================

   MAX SOM

   MAIN.JS — VERSAO LIMPA E CORRIGIDA

 

   Objetivos desta versão:

   - um único fluxo de autenticação;

   - Login sempre leva para conta.html;

   - Painel aparece somente para administradores;

   - admin.html fica protegido;

   - uso das tabelas atuais do projeto;

   - sem alterar o banco de dados;

   - compatível com os IDs antigos e novos das páginas.

 

   IMPORTANTE:

   - Não carregar supabase.js junto com este arquivo.

   - Cada página deve carregar o SDK do Supabase antes deste main.js.

   ========================================================= */

 

/* =========================================================

   1. SUPABASE

   ========================================================= */

 

const SUPABASE_URL =

  "https://diabhunpflawknocixit.supabase.co";

 

const SUPABASE_KEY =

  "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";

 

let supabase = null;

 

if (

  window.supabase &&

  typeof window.supabase.createClient === "function"

) {

  supabase = window.supabase.createClient(

    SUPABASE_URL,

    SUPABASE_KEY,

    {

      auth: {

        persistSession: true,

        autoRefreshToken: true,

        detectSessionInUrl: true

      }

    }

  );

} else {

  console.error(

    "Supabase JS nao foi carregado antes do main.js."

  );

}

 

/* =========================================================

   2. CONFIGURACOES

   ========================================================= */

 

const ADMIN_TYPES = [

  "admin",

  "funcionario",

  "funcionário",

  "dono",

  "administrador"

];

 

const TABLES = {

  USUARIO: "usuario",

  PRODUTOS: "produtos",

  SERVICOS: "servicos",

  SOLICITACOES: "solicitações_servico",

  CONVERSAS: "conversas",

  MENSAGENS: "mensagem",

  NOTIFICACOES: "notificacao",

  PROJETOS: "projetos",

  PUBLICACOES: "publicacoes",

  ARQUIVOS: "arquivos",

  MARCAS: "marcas"

};

 

let currentUser = null;

let currentProfile = null;

let authListenerBound = false;

let currentConversationChannel = null;

let conversationListChannel = null;

let notificationChannel = null;

let messageChannel = null;

 

/* =========================================================

   3. AUXILIARES

   ========================================================= */

 

function qs(...selectors) {

  for (const selector of selectors) {

    const element = document.querySelector(selector);

    if (element) return element;

  }

  return null;

}

 

function qsa(selector) {

  return Array.from(document.querySelectorAll(selector));

}

 

function esc(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}

 

function normalizeType(value) {

  return String(value ?? "")

    .trim()

    .toLowerCase();

}

 

function isAdmin(profile = currentProfile) {

  return ADMIN_TYPES.includes(

    normalizeType(profile?.tipo_usuario)

  );

}

 

function isLoggedIn() {

  return !!currentUser;

}

 

function getCurrentPage() {

  const path =

    window.location.pathname

      .split("/")

      .pop()

      .toLowerCase();

 

  return path || "index.html";

}

 

function formatDate(value) {

  if (!value) return "";

 

  const date = new Date(value);

 

  if (Number.isNaN(date.getTime())) return "";

 

  return date.toLocaleDateString("pt-BR", {

    day: "2-digit",

    month: "2-digit",

    year: "numeric"

  });

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

    typeof target === "string"

      ? document.querySelector(target)

      : target;

 

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

    typeof target === "string"

      ? document.querySelector(target)

      : target;

 

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

      button.dataset.originalText =

        button.textContent.trim();

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

  if (supabase) return true;

 

  console.error(

    "Cliente Supabase indisponivel."

  );

 

  return false;

}

 

/* =========================================================

   4. PERFIL

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

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.USUARIO)

    .select("*")

    .eq("id", authUser.id)

    .maybeSingle();

 

  if (error) {

    console.error(

      "Erro ao carregar perfil:",

      error

    );

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

 

  const existing =

    await loadProfile(authUser);

 

  if (existing) return existing;

 

  const nome = String(

    values.nome ||

    authUser.user_metadata?.nome ||

    authUser.email?.split("@")[0] ||

    "Cliente"

  ).trim();

 

  const telefone = String(

    values.telefone ||

    authUser.user_metadata?.telefone ||

    ""

  ).trim();

 

  const whatsapp = String(

    values.whatsapp ||

    authUser.user_metadata?.whatsapp ||

    ""

  ).trim();

 

  const newProfile = {

    id: authUser.id,

    nome,

    telefone: telefone || null,

    whatsapp: whatsapp || null,

    tipo_usuario: "cliente"

  };

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.USUARIO)

    .insert(newProfile)

    .select("*")

    .single();

 

  if (error) {

    console.error(

      "Erro ao criar perfil:",

      error

    );

    return null;

  }

 

  currentProfile = data;

  return data;

}

 

/* =========================================================

   5. NAVEGACAO

   ========================================================= */

 

async function updateNav() {

  if (!isSupabaseReady()) return;

 

  const logged = !!currentUser;

  const admin = isAdmin(currentProfile);

 

  qsa("[data-guest-only]").forEach((element) => {

    element.style.display = logged ? "none" : "";

  });

 

  qsa("[data-logged-only]").forEach((element) => {

    element.style.display = logged ? "" : "none";

  });

 

  qsa("[data-admin-only]").forEach((element) => {

    element.style.display = admin ? "" : "none";

  });

 

  qsa("[data-conversations-link]").forEach((element) => {

    element.style.display = logged ? "" : "none";

  });

}

 

/* =========================================================

   6. LOGIN

   ========================================================= */

 

async function setupLogin() {

  const form = qs(

    "#loginForm",

    "#formLogin"

  );

 

  if (!form) return;

 

  if (form.dataset.loginBound === "true") {

    return;

  }

 

  form.dataset.loginBound = "true";

 

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

 

    const email = qs(

      "#loginEmail",

      "#email"

    )?.value.trim().toLowerCase();

 

    const password = qs(

      "#loginPassword",

      "#senha"

    )?.value || "";

 

    const message = qs(

      "#loginError",

      "#mensagemLogin"

    );

 

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

        "O sistema de login nao foi carregado.",

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

        throw new Error("A sessao nao foi criada.");

      }

 

      currentUser = data.user;

 

      await ensureProfile(data.user);

 

      showMessage(

        message,

        "Login realizado com sucesso. Entrando...",

        "success"

      );

 

      await updateNav();

 

      /*

       * REGRA DO PROJETO:

       * o login sempre entra primeiro em Minha conta.

       * O admin continua podendo abrir o Painel depois.

       */

      window.location.href = "conta.html";

 

    } catch (error) {

      showMessage(

        message,

        "E-mail ou senha incorretos. Verifique os dados e tente novamente.",

        "error"

      );

      console.error("Erro no login:", error);

 

    } finally {

      setButtonLoading(

        button,

        false,

        "Entrar"

      );

    }

  });

}

 

/* =========================================================

   7. CADASTRO

   ========================================================= */

 

async function setupSignup() {

  const form = qs(

    "#signupForm",

    "#formCadastro"

  );

 

  if (!form) return;

 

  if (form.dataset.signupBound === "true") {

    return;

  }

 

  form.dataset.signupBound = "true";

 

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

 

    const nome = qs(

      "#signupNome",

      "#nome"

    )?.value.trim() || "";

 

    const telefone = qs(

      "#signupTelefone",

      "#telefone"

    )?.value.trim() || "";

 

    const whatsapp = qs(

      "#signupWhatsapp",

      "#whatsapp"

    )?.value.trim() || "";

 

    const email = qs(

      "#signupEmail",

      "#email"

    )?.value.trim().toLowerCase() || "";

 

    const password = qs(

      "#signupPassword",

      "#senha"

    )?.value || "";

 

    const message = qs(

      "#signupError",

      "#mensagemCadastro"

    );

 

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

      showMessage(

        message,

        "O sistema de cadastro nao foi carregado.",

        "error"

      );

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

 

      const user = data?.user;

 

      if (!user) {

        throw new Error("O usuario nao foi criado.");

      }

 

      if (data.session) {

        await ensureProfile(user, {

          nome,

          telefone,

          whatsapp

        });

 

        showMessage(

          message,

          "Conta criada com sucesso. Entrando...",

          "success"

        );

 

        window.location.href = "conta.html";

        return;

      }

 

      showMessage(

        message,

        "Conta criada. Confirme seu e-mail e depois faca login.",

        "success"

      );

 

      form.reset();

 

    } catch (error) {

      showMessage(

        message,

        dbError(

          error,

          "Nao foi possivel criar a conta."

        ),

        "error"

      );

 

    } finally {

      setButtonLoading(

        button,

        false,

        "Criar conta"

      );

    }

  });

}

 

/* =========================================================

   8. LOGOUT

   ========================================================= */

 

async function logout() {

  if (!isSupabaseReady()) return;

 

  const {

    error

  } = await supabase.auth.signOut();

 

  if (error) {

    alert(

      "Nao foi possivel sair da conta."

    );

    console.error(error);

    return;

  }

 

  cleanupRealtimeChannels();

  currentUser = null;

  currentProfile = null;

  window.location.href = "index.html";

}

 

/* =========================================================

   9. LISTENER DE AUTENTICACAO

   ========================================================= */

 

function setupAuthListener() {

  if (!isSupabaseReady()) return;

  if (authListenerBound) return;

 

  authListenerBound = true;

 

  supabase.auth.onAuthStateChange(

    async (event, session) => {

      currentUser = session?.user || null;

 

      if (currentUser) {

        await loadProfile(currentUser);

      } else {

        currentProfile = null;

      }

 

      await updateNav();

 

      if (event === "SIGNED_OUT") {

        cleanupRealtimeChannels();

 

        const page = getCurrentPage();

 

        if ([

          "conta.html",

          "conversas.html",

          "conversa.html",

          "admin.html"

        ].includes(page)) {

          window.location.href = "login.html";

        }

      }

    }

  );

}

 

/* =========================================================

   10. PROTECAO DO ADMIN

   ========================================================= */

 

async function requireAdmin() {

  if (!currentUser) {

    window.location.href = "login.html";

    return false;

  }

 

  const profile =

    currentProfile ||

    await loadProfile(currentUser);

 

  if (!profile || !isAdmin(profile)) {

    window.location.href = "index.html";

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

      window.location.href = "login.html";

      return false;

    }

  }

 

  if (page === "admin.html") {

    return await requireAdmin();

  }

 

  return true;

}

 

/* =========================================================

   12. REDIRECIONAMENTO DE USUARIO JA LOGADO

   ========================================================= */

 

async function redirectAuthenticatedUser() {

  if (getCurrentPage() !== "login.html") {

    return;

  }

 

  if (!currentUser) {

    return;

  }

 

  await loadProfile(currentUser);

 

  window.location.href = "conta.html";

}

 

/* =========================================================

   13. ATUALIZACAO DE LINKS

   ========================================================= */

 

function setupLogoutButtons() {

  qsa(

    "#logoutButton, #logoutLink, [data-logout]"

  ).forEach((button) => {

    if (button.dataset.logoutBound === "true") {

      return;

    }

 

    button.dataset.logoutBound = "true";

 

    button.addEventListener("click", async (event) => {

      event.preventDefault();

      await logout();

    });

  });

}

 

function setupGeneralNavigation() {

  qsa(

    "a[href='conta.html'], a[href='conversas.html'], a[href='conversa.html']"

  ).forEach((link) => {

    if (link.dataset.navigationBound === "true") {

      return;

    }

 

    link.dataset.navigationBound = "true";

 

    link.addEventListener("click", (event) => {

      if (!currentUser) {

        event.preventDefault();

        window.location.href = "login.html";

      }

    });

  });

}

 

/* =========================================================

   14. PAGINA MINHA CONTA

   ========================================================= */

 

async function loadAccountPage() {

  const page = qs(

    "[data-account-page]",

    ".account-page"

  );

 

  if (!page) return;

 

  if (!currentUser) {

    window.location.href = "login.html";

    return;

  }

 

  const profile =

    currentProfile ||

    await loadProfile(currentUser);

 

  if (!profile) return;

 

  const name =

    profile.nome ||

    currentUser.email?.split("@")[0] ||

    "Usuario";

 

  const type = normalizeType(

    profile.tipo_usuario || "cliente"

  );

 

  let typeLabel = "Visualizador";

 

  if (isAdmin(profile)) {

    typeLabel = "Administrador";

  } else if (type === "solicitante_admin") {

    typeLabel = "Solicitacao de administrador";

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

 

  if (nameTitle) nameTitle.textContent = name;

  if (nameField) nameField.textContent = name;

  if (emailField) {

    emailField.textContent =

      currentUser.email || "-";

  }

  if (phoneField) {

    phoneField.textContent =

      profile.whatsapp ||

      profile.telefone ||

      "-";

  }

  if (typeField) typeField.textContent = typeLabel;

 

  await loadAccountRequests();

  await loadAccountConversations();

  await loadNotifications();

}

 

/* =========================================================

   15. SOLICITACOES DA CONTA

   ========================================================= */

 

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

    .select(`

      id,

      status,

      descricao_problema,

      observacoes,

      criado_em,

      servicos(nome)

    `)

    .eq("cliente_id", currentUser.id)

    .order("criado_em", { ascending: false })

    .limit(20);

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar suas solicitacoes.

      </div>

    `;

    console.error(error);

    return;

  }

 

  if (!data?.length) {

    container.innerHTML = `

      <div class="empty">

        Nenhuma solicitacao encontrada.

      </div>

    `;

    return;

  }

 

  container.innerHTML = data.map((item) => `

    <article class="account-item">

      <strong>

        ${esc(item.servicos?.nome || "Solicitacao")}

      </strong>

      <span>

        ${esc(item.status || "Em analise")}

        •

        ${esc(formatDateTime(item.criado_em))}

      </span>

      <p>

        ${esc(item.descricao_problema || "")}

      </p>

    </article>

  `).join("");

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

    .select(`

      id,

      cliente_id,

      funcionario_id,

      assunto,

      status,

      criado_em,

      atualizado_em

    `)

    .or(

      `cliente_id.eq.${currentUser.id},funcionario_id.eq.${currentUser.id}`

    )

    .order("atualizado_em", { ascending: false })

    .limit(20);

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar suas conversas.

      </div>

    `;

    console.error(error);

    return;

  }

 

  if (!data?.length) {

    container.innerHTML = `

      <div class="empty">

        Nenhuma conversa encontrada.

      </div>

    `;

    return;

  }

 

  container.innerHTML = data.map((conversation) => `

    <a

      href="conversa.html?id=${encodeURIComponent(conversation.id)}"

      class="conversation-card"

    >

      <div class="conversation-card-content">

        <div>

          <h3>

            ${esc(conversation.assunto || "Atendimento Max Som")}

          </h3>

          <span>

            ${esc(conversation.status || "aberta")}

          </span>

        </div>

        <time>

          ${esc(formatDateTime(

            conversation.atualizado_em || conversation.criado_em

          ))}

        </time>

      </div>

    </a>

  `).join("");

}

 

/* =========================================================

   17. SOLICITACAO DE ADMINISTRADOR

   ========================================================= */

 

function setupAdminRequestButton() {

  const button = qs(

    "#requestAdminButton",

    "[data-request-admin]"

  );

 

  if (!button) return;

 

  if (button.dataset.adminRequestBound === "true") {

    return;

  }

 

  button.dataset.adminRequestBound = "true";

 

  button.addEventListener("click", async () => {

    if (!currentUser) {

      window.location.href = "login.html";

      return;

    }

 

    const profile =

      currentProfile ||

      await loadProfile(currentUser);

 

    if (!profile) return;

 

    if (isAdmin(profile)) {

      alert(

        "Sua conta ja possui acesso de administrador."

      );

      return;

    }

 

    if (

      normalizeType(profile.tipo_usuario) ===

      "solicitante_admin"

    ) {

      alert(

        "Sua solicitacao de administrador ja foi enviada."

      );

      return;

    }

 

    const {

      error

    } = await supabase

      .from(TABLES.USUARIO)

      .update({

        tipo_usuario: "solicitante_admin"

      })

      .eq("id", currentUser.id);

 

    if (error) {

      alert(

        "Nao foi possivel enviar a solicitacao."

      );

      console.error(error);

      return;

    }

 

    currentProfile = {

      ...profile,

      tipo_usuario: "solicitante_admin"

    };

 

    alert(

      "Solicitacao enviada para analise."

    );

 

    await updateNav();

    await loadAccountPage();

  });

}

 

/* =========================================================

   18. ATENDIMENTO - SERVICOS

   ========================================================= */

 

async function loadAttendanceServices() {

  const select = qs(

    "#servico",

    "#requestServico",

    "#servicoId"

  );

 

  if (!select || !isSupabaseReady()) return;

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.SERVICOS)

    .select("id,nome,ativo")

    .eq("ativo", true)

    .order("nome", { ascending: true });

 

  if (error) {

    select.innerHTML = `

      <option value="">

        Nao foi possivel carregar os servicos

      </option>

    `;

    console.error(error);

    return;

  }

 

  select.innerHTML = `

    <option value="">Selecione um servico</option>

  `;

 

  (data || []).forEach((service) => {

    const option = document.createElement("option");

    option.value = service.id;

    option.textContent = service.nome;

    option.dataset.nome = service.nome;

    select.appendChild(option);

  });

 

  const params = new URLSearchParams(

    window.location.search

  );

 

  const serviceFromUrl =

    params.get("servico") ||

    params.get("service");

 

  if (!serviceFromUrl) return;

 

  const match =

    Array.from(select.options).find((option) => {

      const byId =

        option.value === serviceFromUrl;

 

      const byName =

        String(option.dataset.nome || "")

          .trim()

          .toLowerCase() ===

        serviceFromUrl.trim().toLowerCase();

 

      return byId || byName;

    });

 

  if (match) {

    select.value = match.value;

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

 

  if (!nameInput && !phoneInput) return;

 

  const profile =

    currentProfile ||

    await loadProfile(currentUser);

 

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

 

/* =========================================================

   19. ATENDIMENTO - SALVAR SOLICITACAO

   ========================================================= */

 

async function saveAttendanceRequest({

  serviceId = null,

  nome = "",

  telefone = "",

  equipamento = "",

  descricao = ""

} = {}) {

  if (!currentUser) {

    return {

      saved: false,

      error: null

    };

  }

 

  const descricaoProblema = [

    equipamento

      ? `Produto/equipamento: ${equipamento}`

      : "",

    descricao

  ]

    .filter(Boolean)

    .join("\n\n");

 

  const observacoes = [

    nome

      ? `Nome informado: ${nome}`

      : "",

    telefone

      ? `Telefone/WhatsApp: ${telefone}`

      : ""

  ]

    .filter(Boolean)

    .join("\n");

 

  const payload = {

    cliente_id: currentUser.id,

    servico_id: serviceId || null,

    equipamento_id: null,

    descricao_problema: descricaoProblema || null,

    status: "solicitado",

    observacoes: observacoes || null

  };

 

  const {

    error

  } = await supabase

    .from(TABLES.SOLICITACOES)

    .insert(payload);

 

  if (error) {

    console.error(

      "Erro ao salvar solicitacao:",

      error

    );

 

    return {

      saved: false,

      error

    };

  }

 

  return {

    saved: true,

    error: null

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

    "Ola! Quero falar com a Max Som.",

    nome ? `Nome: ${nome}` : "",

    telefone

      ? `Telefone/WhatsApp: ${telefone}`

      : "",

    servico ? `Servico: ${servico}` : "",

    equipamento

      ? `Produto/equipamento: ${equipamento}`

      : "",

    descricao ? `Mensagem: ${descricao}` : ""

  ]

    .filter(Boolean)

    .join("\n");

}

 

/* =========================================================

   20. ATENDIMENTO - FORMULARIO

   ========================================================= */

 

async function setupAttendancePage() {

  if (getCurrentPage() !== "atendimento.html") {

    return;

  }

 

  const form = qs(

    "#formAtendimento",

    "#serviceRequestForm",

    "#formSolicitacao",

    "#requestForm"

  );

 

  if (!form) return;

 

  if (form.dataset.attendanceBound === "true") {

    return;

  }

 

  form.dataset.attendanceBound = "true";

 

  await loadAttendanceServices();

  await fillAttendanceUserData();

 

  const button =

    form.querySelector('button[type="submit"]');

 

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

 

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

 

    const serviceSelect = qs(

      "#servico",

      "#requestServico",

      "#servicoId"

    );

 

    const equipmentInput = qs(

      "#equipamento",

      "#requestEquipamento"

    );

 

    const descriptionInput = qs(

      "#descricao",

      "#requestDescricao",

      "#mensagem"

    );

 

    const nome =

      nameInput?.value.trim() || "";

 

    const telefone =

      phoneInput?.value.trim() || "";

 

    const equipamento =

      equipmentInput?.value.trim() || "";

 

    const descricao =

      descriptionInput?.value.trim() || "";

 

    const serviceOption =

      serviceSelect?.selectedOptions?.[0] || null;

 

    const serviceId =

      serviceSelect?.value || null;

 

    const serviceName =

      serviceOption?.dataset?.nome ||

      serviceOption?.textContent?.trim() ||

      "";

 

    if (!nome) {

      showMessage(

        "#mensagemAtendimento",

        "Digite seu nome.",

        "error"

      );

      nameInput?.focus();

      return;

    }

 

    if (!descricao) {

      showMessage(

        "#mensagemAtendimento",

        "Explique o que voce precisa.",

        "error"

      );

      descriptionInput?.focus();

      return;

    }

 

    setButtonLoading(

      button,

      true,

      "Enviar para o WhatsApp"

    );

 

    clearMessage("#mensagemAtendimento");

 

    let saveResult = {

      saved: false,

      error: null

    };

 

    if (currentUser) {

      saveResult = await saveAttendanceRequest({

        serviceId,

        nome,

        telefone,

        equipamento,

        descricao

      });

    }

 

    const whatsappMessage =

      buildAttendanceWhatsAppMessage({

        nome,

        telefone,

        servico: serviceName,

        equipamento,

        descricao

      });

 

    const whatsappUrl =

      `https://wa.me/5565996262514?text=${encodeURIComponent(

        whatsappMessage

      )}`;

 

    window.open(

      whatsappUrl,

      "_blank",

      "noopener,noreferrer"

    );

 

    form.reset();

    await loadAttendanceServices();

    await fillAttendanceUserData();

 

    if (saveResult.saved) {

      showMessage(

        "#mensagemAtendimento",

        "Solicitacao registrada. O WhatsApp foi aberto para continuar o atendimento.",

        "success"

      );

    } else {

      showMessage(

        "#mensagemAtendimento",

        "O WhatsApp foi aberto com sua mensagem pronta.",

        "success"

      );

    }

 

    setButtonLoading(

      button,

      false,

      "Enviar para o WhatsApp"

    );

  });

}

 

/* =========================================================

   21. DADOS PUBLICOS - PRODUTOS

   ========================================================= */

 

async function loadProducts() {

  const containers = qsa(

    "#productsGrid",

    "#produtosGrid",

    "#produtosLista",

    "#productsList"

  );

 

  if (!containers.length || !isSupabaseReady()) {

    return;

  }

 

  let query = supabase

    .from(TABLES.PRODUTOS)

    .select(`

      id,

      categoria_id,

      marca_id,

      nome,

      modelo,

      descricao,

      especificacoes,

      imagem_capa,

      disponivel,

      destaque,

      criado_em

    `)

    .eq("disponivel", true);

 

  if (getCurrentPage() === "index.html") {

    query = query

      .eq("destaque", true)

      .limit(6);

  }

 

  const {

    data,

    error

  } = await query.order(

    "criado_em",

    { ascending: false }

  );

 

  containers.forEach((container) => {

    if (error) {

      container.innerHTML = `

        <div class="empty">

          Nao foi possivel carregar os produtos.

        </div>

      `;

      return;

    }

 

    if (!data?.length) {

      container.innerHTML = `

        <div class="empty">

          Nenhum produto disponivel no momento.

        </div>

      `;

      return;

    }

 

    container.innerHTML = data.map((product) => `

      <article class="product-card">

        ${product.imagem_capa

          ? `

            <img

              src="${esc(product.imagem_capa)}"

              alt="${esc(product.nome || "Produto Max Som")}"

              loading="lazy"

            >

          `

          : `

            <div class="product-image">

              Max Som

            </div>

          `}

 

        <div class="product-info">

          <span>Equipamento</span>

          <h3>${esc(product.nome || "Produto")}</h3>

 

          ${product.modelo

            ? `

              <p>

                <strong>Modelo:</strong>

                ${esc(product.modelo)}

              </p>

            `

            : ""}

 

          <p>

            ${esc(

              product.descricao ||

              "Consulte a Max Som para mais informacoes."

            )}

          </p>

 

          ${product.especificacoes

            ? `

              <details>

                <summary>Especificacoes</summary>

                <p>${esc(product.especificacoes)}</p>

              </details>

            `

            : ""}

        </div>

      </article>

    `).join("");

  });

}

 

/* =========================================================

   22. DADOS PUBLICOS - SERVICOS

   ========================================================= */

 

async function loadServices() {

  const containers = qsa(

    "#servicesGrid",

    "#servicosGrid",

    "#servicosLista",

    "#servicesList"

  );

 

  if (!containers.length || !isSupabaseReady()) {

    return;

  }

 

  let query = supabase

    .from(TABLES.SERVICOS)

    .select(`

      id,

      nome,

      descricao,

      imagem_capa,

      ativo,

      criado_em

    `)

    .eq("ativo", true);

 

  if (getCurrentPage() === "index.html") {

    query = query.limit(6);

  }

 

  const {

    data,

    error

  } = await query.order(

    "criado_em",

    { ascending: false }

  );

 

  containers.forEach((container) => {

    if (error) {

      container.innerHTML = `

        <div class="empty">

          Nao foi possivel carregar os servicos.

        </div>

      `;

      return;

    }

 

    if (!data?.length) {

      container.innerHTML = `

        <div class="empty">

          Nenhum servico disponivel no momento.

        </div>

      `;

      return;

    }

 

    container.innerHTML = data.map((service) => `

      <article class="service-card">

        ${service.imagem_capa

          ? `

            <img

              src="${esc(service.imagem_capa)}"

              alt="${esc(service.nome || "Servico Max Som")}"

              loading="lazy"

            >

          `

          : ""}

 

        <div class="service-info">

          <h3>${esc(service.nome || "Servico")}</h3>

          <p>

            ${esc(

              service.descricao ||

              "Consulte a Max Som para conhecer este servico."

            )}

          </p>

          <span class="service-price">

            Sob orcamento

          </span>

          <a

            href="atendimento.html?servico=${encodeURIComponent(service.id)}"

            class="btn btn-primary"

          >

            Solicitar atendimento

          </a>

        </div>

      </article>

    `).join("");

  });

}

 

/* =========================================================

   23. DADOS PUBLICOS - PROJETOS

   ========================================================= */

 

async function loadProjects() {

  const containers = qsa(

    "#projectsGrid",

    "#projetosGrid",

    "#projetosLista",

    "#projectsList"

  );

 

  if (!containers.length || !isSupabaseReady()) {

    return;

  }

 

  let query = supabase

    .from(TABLES.PROJETOS)

    .select(`

      id,

      titulo,

      categoria,

      descricao,

      imagem_capa,

      publicado,

      criado_em

    `)

    .eq("publicado", true);

 

  if (getCurrentPage() === "index.html") {

    query = query.limit(6);

  }

 

  const {

    data,

    error

  } = await query.order(

    "criado_em",

    { ascending: false }

  );

 

  containers.forEach((container) => {

    if (error) {

      container.innerHTML = `

        <div class="empty">

          Nao foi possivel carregar os projetos.

        </div>

      `;

      return;

    }

 

    if (!data?.length) {

      container.innerHTML = `

        <div class="empty">

          Nenhum projeto publicado no momento.

        </div>

      `;

      return;

    }

 

    container.innerHTML = data.map((project) => `

      <article class="project-card">

        ${project.imagem_capa

          ? `

            <img

              src="${esc(project.imagem_capa)}"

              alt="${esc(project.titulo || "Projeto Max Som")}"

              loading="lazy"

            >

          `

          : `

            <div class="project-image">

              Max Som

            </div>

          `}

 

        <div class="project-info">

          ${project.categoria

            ? `<span>${esc(project.categoria)}</span>`

            : ""}

 

          <h3>${esc(project.titulo || "Projeto")}</h3>

 

          ${project.descricao

            ? `<p>${esc(project.descricao)}</p>`

            : ""}

        </div>

      </article>

    `).join("");

  });

}

 

/* =========================================================

   24. DADOS PUBLICOS - PUBLICACOES

   ========================================================= */

 

async function loadPosts() {

  const containers = qsa(

    "#postsGrid",

    "#publicacoesGrid",

    "#publicacoesLista",

    "#publicationsList"

  );

 

  if (!containers.length || !isSupabaseReady()) {

    return;

  }

 

  let query = supabase

    .from(TABLES.PUBLICACOES)

    .select(`

      id,

      categoria_id,

      autor_id,

      titulo,

      resumo,

      conteudo,

      imagem_capa,

      publicado,

      data_publicacao

    `)

    .eq("publicado", true);

 

  if (getCurrentPage() === "index.html") {

    query = query.limit(6);

  }

 

  const {

    data,

    error

  } = await query.order(

    "data_publicacao",

    { ascending: false }

  );

 

  containers.forEach((container) => {

    if (error) {

      container.innerHTML = `

        <div class="empty">

          Nao foi possivel carregar as publicacoes.

        </div>

      `;

      return;

    }

 

    if (!data?.length) {

      container.innerHTML = `

        <div class="empty">

          Nenhuma publicacao disponivel no momento.

        </div>

      `;

      return;

    }

 

    container.innerHTML = data.map((post) => `

      <article class="post-card">

        ${post.imagem_capa

          ? `

            <img

              src="${esc(post.imagem_capa)}"

              alt="${esc(post.titulo || "Publicacao Max Som")}"

              loading="lazy"

            >

          `

          : `

            <div class="post-image">

              Max Som

            </div>

          `}

 

        <div class="post-info">

          <span>Publicacao</span>

          <h3>${esc(post.titulo || "Publicacao")}</h3>

 

          ${post.resumo

            ? `<p>${esc(post.resumo)}</p>`

            : post.conteudo

              ? `<p>${esc(post.conteudo)}</p>`

              : ""}

 

          ${post.data_publicacao

            ? `<small class="muted">${esc(formatDate(post.data_publicacao))}</small>`

            : ""}

 

          ${post.conteudo

            ? `

              <details>

                <summary>Ler publicacao</summary>

                <p>${esc(post.conteudo)}</p>

              </details>

            `

            : ""}

        </div>

      </article>

    `).join("");

  });

}

 

/* =========================================================

   25. CONVERSAS

   ========================================================= */

 

async function loadConversations() {

  const container = qs(

    "#conversationsList",

    "#conversationList",

    "#conversasLista"

  );

 

  if (!container || !currentUser) {

    return;

  }

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.CONVERSAS)

    .select(`

      id,

      cliente_id,

      funcionario_id,

      assunto,

      status,

      criado_em,

      atualizado_em

    `)

    .or(

      `cliente_id.eq.${currentUser.id},funcionario_id.eq.${currentUser.id}`

    )

    .order("atualizado_em", { ascending: false });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar suas conversas.

      </div>

    `;

    console.error(error);

    return;

  }

 

  if (!data?.length) {

    container.innerHTML = `

      <div class="empty">

        Nenhuma conversa ainda.

      </div>

    `;

    return;

  }

 

  container.innerHTML = data.map((conversation) => `

    <a

      href="conversa.html?id=${encodeURIComponent(conversation.id)}"

      class="conversation-card"

    >

      <div class="conversation-card-content">

        <div>

          <h3>

            ${esc(conversation.assunto || "Atendimento Max Som")}

          </h3>

          <span>${esc(conversation.status || "aberta")}</span>

        </div>

        <time>

          ${esc(formatDateTime(

            conversation.atualizado_em || conversation.criado_em

          ))}

        </time>

      </div>

    </a>

  `).join("");

}

 

async function createConversation(

  assunto = "Atendimento Max Som"

) {

  if (!currentUser) {

    window.location.href = "login.html";

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

    .select(`

      id,

      cliente_id,

      funcionario_id,

      assunto,

      status,

      criado_em,

      atualizado_em

    `)

    .single();

 

  if (error) {

    console.error(error);

    alert(

      "Nao foi possivel iniciar a conversa."

    );

    return null;

  }

 

  return data;

}

 

function setupConversationButtons() {

  qsa("[data-open-conversation]").forEach((button) => {

    if (button.dataset.conversationBound === "true") {

      return;

    }

 

    button.dataset.conversationBound = "true";

 

    button.addEventListener("click", async (event) => {

      event.preventDefault();

 

      const assunto =

        button.dataset.openConversation ||

        button.dataset.assunto ||

        button.textContent.trim() ||

        "Atendimento Max Som";

 

      const conversation =

        await createConversation(assunto);

 

      if (conversation) {

        window.location.href =

          `conversa.html?id=${encodeURIComponent(conversation.id)}`;

      }

    });

  });

}

 

/* =========================================================

   26. CONVERSA INDIVIDUAL

   ========================================================= */

 

async function loadConversation() {

  const container = qs(

    "#conversaContainer",

    "#chatMessages"

  );

 

  if (!container) return;

 

  const params = new URLSearchParams(

    window.location.search

  );

 

  const conversationId = params.get("id");

 

  if (!conversationId) {

    container.innerHTML = `

      <div class="empty">

        Conversa nao encontrada.

      </div>

    `;

    return;

  }

 

  if (!currentUser) {

    container.innerHTML = `

      <div class="empty">

        Voce precisa estar logado para abrir esta conversa.

      </div>

    `;

    return;

  }

 

  const {

    data: conversation,

    error

  } = await supabase

    .from(TABLES.CONVERSAS)

    .select(`

      id,

      cliente_id,

      funcionario_id,

      assunto,

      status,

      criado_em,

      atualizado_em

    `)

    .eq("id", conversationId)

    .maybeSingle();

 

  if (error || !conversation) {

    container.innerHTML = `

      <div class="empty">

        Esta conversa nao esta disponivel.

      </div>

    `;

    console.error(error);

    return;

  }

 

  const title = qs(

    "#conversaTitulo",

    "#chatTitle"

  );

 

  const status = qs(

    "#conversaStatus",

    "#chatStatus"

  );

 

  if (title) {

    title.textContent =

      conversation.assunto ||

      "Atendimento Max Som";

  }

 

  if (status) {

    status.textContent =

      conversation.status ||

      "aberta";

  }

 

  await loadMessages(conversationId);

  await markConversationMessagesRead(conversationId);

  setupMessageForm(conversationId);

  setupCurrentConversationRealtime(conversationId);

}

 

/* =========================================================

   27. MENSAGENS

   ========================================================= */

 

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

    .select(`

      id,

      conversa_id,

      remetente_id,

      conteudo,

      lida,

      criado_em

    `)

    .eq("conversa_id", conversationId)

    .order("criado_em", { ascending: true });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar as mensagens.

      </div>

    `;

    console.error(error);

    return;

  }

 

  if (!data?.length) {

    container.innerHTML = `

      <div class="empty">

        Nenhuma mensagem ainda.

      </div>

    `;

    return;

  }

 

  container.innerHTML = data.map((message) => {

    const mine =

      message.remetente_id === currentUser?.id;

 

    return `

      <div class="message ${

        mine

          ? "message-own"

          : "message-other"

      }">

        <div class="message-content">

          <p>${esc(message.conteudo || "")}</p>

          <time>

            ${esc(formatDateTime(message.criado_em))}

          </time>

        </div>

      </div>

    `;

  }).join("");

 

  container.scrollTop =

    container.scrollHeight;

}

 

async function markConversationMessagesRead(

  conversationId

) {

  if (!currentUser || !conversationId) return;

 

  const {

    error

  } = await supabase

    .from(TABLES.MENSAGENS)

    .update({ lida: true })

    .eq("conversa_id", conversationId)

    .neq("remetente_id", currentUser.id)

    .eq("lida", false);

 

  if (error) {

    console.warn(

      "Nao foi possivel marcar mensagens como lidas:",

      error

    );

  }

}

 

function setupMessageForm(conversationId) {

  const form = qs(

    "#mensagemForm",

    "#chatForm",

    "#messageForm"

  );

 

  if (!form) return;

 

  if (form.dataset.messageBound === "true") {

    return;

  }

 

  form.dataset.messageBound = "true";

 

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

 

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

 

    if (!currentUser) {

      window.location.href = "login.html";

      return;

    }

 

    const content =

      input?.value?.trim() || "";

 

    if (!content) {

      input?.focus();

      return;

    }

 

    if (button) button.disabled = true;

 

    const {

      error

    } = await supabase

      .from(TABLES.MENSAGENS)

      .insert({

        conversa_id: conversationId,

        remetente_id: currentUser.id,

        conteudo: content,

        lida: false

      });

 

    if (error) {

      console.error(error);

      showMessage(

        "#mensagemConversa",

        "Nao foi possivel enviar a mensagem.",

        "error"

      );

 

      if (button) button.disabled = false;

      return;

    }

 

    if (input) input.value = "";

 

    await loadMessages(conversationId);

    await markConversationMessagesRead(conversationId);

 

    if (button) button.disabled = false;

  });

}

 

/* =========================================================

   28. NOTIFICACOES

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

    .select(`

      id,

      usuario_id,

      titulo,

      mensagem,

      lida,

      link,

      criado_em

    `)

    .eq("usuario_id", currentUser.id)

    .order("criado_em", { ascending: false })

    .limit(20);

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar as notificacoes.

      </div>

    `;

    console.error(error);

    return;

  }

 

  if (!data?.length) {

    container.innerHTML = `

      <div class="empty">

        Nenhuma notificacao.

      </div>

    `;

    return;

  }

 

  container.innerHTML = data.map((notification) => `

    <article class="notification-card ${

      notification.lida ? "read" : "unread"

    }">

      <div>

        <strong>

          ${esc(notification.titulo || "Notificacao")}

        </strong>

 

        ${notification.mensagem

          ? `<p>${esc(notification.mensagem)}</p>`

          : ""}

 

        <small>

          ${esc(formatDateTime(notification.criado_em))}

        </small>

      </div>

 

      <div class="notification-actions">

        ${notification.link

          ? `

            <a

              href="${esc(notification.link)}"

              class="btn btn-secondary"

            >

              Abrir

            </a>

          `

          : ""}

 

        ${!notification.lida

          ? `

            <button

              type="button"

              class="btn btn-outline"

              data-mark-notification

              data-notification-id="${esc(notification.id)}"

            >

              Marcar como lida

            </button>

          `

          : ""}

      </div>

    </article>

  `).join("");

 

  setupNotificationActions();

}

 

async function markNotificationAsRead(

  notificationId

) {

  if (!currentUser || !notificationId) return;

 

  const {

    error

  } = await supabase

    .from(TABLES.NOTIFICACOES)

    .update({ lida: true })

    .eq("id", notificationId)

    .eq("usuario_id", currentUser.id);

 

  if (error) {

    console.error(error);

    return;

  }

 

  await loadNotifications();

}

 

function setupNotificationActions() {

  qsa("[data-mark-notification]").forEach((button) => {

    if (button.dataset.notificationBound === "true") {

      return;

    }

 

    button.dataset.notificationBound = "true";

 

    button.addEventListener("click", async () => {

      button.disabled = true;

 

      await markNotificationAsRead(

        button.dataset.notificationId

      );

    });

  });

}

 

/* =========================================================

   29. REALTIME

   ========================================================= */

 

function cleanupRealtimeChannels() {

  if (supabase) {

    if (currentConversationChannel) {

      supabase.removeChannel(

        currentConversationChannel

      );

    }

 

    if (conversationListChannel) {

      supabase.removeChannel(

        conversationListChannel

      );

    }

 

    if (notificationChannel) {

      supabase.removeChannel(

        notificationChannel

      );

    }

 

    if (messageChannel) {

      supabase.removeChannel(

        messageChannel

      );

    }

  }

 

  currentConversationChannel = null;

  conversationListChannel = null;

  notificationChannel = null;

  messageChannel = null;

}

 

function setupCurrentConversationRealtime(conversationId) {

  if (!supabase || !conversationId) return;

 

  if (currentConversationChannel) {

    supabase.removeChannel(

      currentConversationChannel

    );

  }

 

  currentConversationChannel =

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

          await markConversationMessagesRead(

            conversationId

          );

        }

      )

      .subscribe();

}

 

function setupConversationListRealtime() {

  if (!supabase || !currentUser) return;

 

  if (conversationListChannel) {

    supabase.removeChannel(

      conversationListChannel

    );

  }

 

  conversationListChannel =

    supabase

      .channel("maxsom-conversas-lista")

      .on(

        "postgres_changes",

        {

          event: "*",

          schema: "public",

          table: TABLES.CONVERSAS

        },

        async () => {

          await loadConversations();

          await loadAccountConversations();

        }

      )

      .subscribe();

}

 

function setupNotificationRealtime() {

  if (!supabase || !currentUser) return;

 

  if (notificationChannel) {

    supabase.removeChannel(

      notificationChannel

    );

  }

 

  notificationChannel =

    supabase

      .channel(

        `maxsom-notificacoes-${currentUser.id}`

      )

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

 

/* =========================================================

   30. ADMIN - ESTATISTICAS

   ========================================================= */

 

async function adminStats() {

  const counters = qsa(

    "[data-admin-count]"

  );

 

  if (!counters.length) return;

 

  const tables = {

    usuarios: TABLES.USUARIO,

    produtos: TABLES.PRODUTOS,

    servicos: TABLES.SERVICOS,

    projetos: TABLES.PROJETOS

  };

 

  for (const [key, table] of Object.entries(tables)) {

    const element = qs(

      `[data-admin-count="${key}"]`

    );

 

    if (!element) continue;

 

    const {

      count,

      error

    } = await supabase

      .from(table)

      .select("*", {

        count: "exact",

        head: true

      });

 

    if (error) {

      element.textContent = "-";

      console.error(error);

      continue;

    }

 

    element.textContent = count ?? 0;

  }

}

 

/* =========================================================

   31. ADMIN - USUARIOS

   ========================================================= */

 

async function adminUsers() {

  const container = qs(

    "#adminUsuariosLista"

  );

 

  if (!container) return;

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.USUARIO)

    .select("id,nome,telefone,whatsapp,tipo_usuario")

    .order("nome", { ascending: true });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar os usuarios.

      </div>

    `;

    console.error(error);

    return;

  }

 

  if (!data?.length) {

    container.innerHTML = `

      <div class="empty">

        Nenhum usuario encontrado.

      </div>

    `;

    return;

  }

 

  container.innerHTML = data.map((user) => {

    const type = normalizeType(

      user.tipo_usuario || "cliente"

    );

 

    const request =

      type === "solicitante_admin";

 

    const admin = isAdmin(user);

 

    return `

      <div class="admin-request">

        <div>

          <strong>

            ${esc(user.nome || "Sem nome")}

          </strong>

          <small>

            ${esc(

              user.telefone ||

              user.whatsapp ||

              "Sem telefone"

            )}

            •

            ${esc(user.tipo_usuario || "cliente")}

          </small>

        </div>

 

        <div class="admin-actions">

          ${request

            ? `

              <button

                type="button"

                class="btn btn-primary"

                data-approve-admin

                data-user-id="${esc(user.id)}"

              >

                Aprovar administrador

              </button>

 

              <button

                type="button"

                class="btn btn-outline"

                data-reject-admin

                data-user-id="${esc(user.id)}"

              >

                Recusar

              </button>

            `

            : ""}

 

          ${admin

            ? `

              <span class="muted">

                Administrador

              </span>

            `

            : ""}

        </div>

      </div>

    `;

  }).join("");

 

  setupAdminUserActions();

}

 

function setupAdminUserActions() {

  qsa("[data-approve-admin]").forEach((button) => {

    if (button.dataset.adminActionBound === "true") {

      return;

    }

 

    button.dataset.adminActionBound = "true";

 

    button.addEventListener("click", async () => {

      const userId = button.dataset.userId;

      if (!userId) return;

 

      const {

        error

      } = await supabase

        .from(TABLES.USUARIO)

        .update({

          tipo_usuario: "admin"

        })

        .eq("id", userId);

 

      if (error) {

        alert(

          "Nao foi possivel aprovar o usuario."

        );

        console.error(error);

        return;

      }

 

      await adminUsers();

      await adminStats();

    });

  });

 

  qsa("[data-reject-admin]").forEach((button) => {

    if (button.dataset.adminActionBound === "true") {

      return;

    }

 

    button.dataset.adminActionBound = "true";

 

    button.addEventListener("click", async () => {

      const userId = button.dataset.userId;

      if (!userId) return;

 

      const {

        error

      } = await supabase

        .from(TABLES.USUARIO)

        .update({

          tipo_usuario: "cliente"

        })

        .eq("id", userId);

 

      if (error) {

        alert(

          "Nao foi possivel recusar a solicitacao."

        );

        console.error(error);

        return;

      }

 

      await adminUsers();

    });

  });

}

 

/* =========================================================

   32. ADMIN - SOLICITACOES E CONVERSAS

   ========================================================= */

 

async function adminRequests() {

  const requestContainer = qs(

    "#adminSolicitacoes"

  );

 

  const conversationContainer = qs(

    "#adminConversas"

  );

 

  if (requestContainer) {

    const {

      data,

      error

    } = await supabase

      .from(TABLES.SOLICITACOES)

      .select(`

        id,

        cliente_id,

        servico_id,

        descricao_problema,

        status,

        observacoes,

        criado_em,

        servicos(nome)

      `)

      .order("criado_em", { ascending: false })

      .limit(30);

 

    if (error) {

      requestContainer.innerHTML = `

        <div class="empty">

          Nao foi possivel carregar as solicitacoes.

        </div>

      `;

      console.error(error);

    } else if (!data?.length) {

      requestContainer.innerHTML = `

        <div class="empty">

          Nenhuma solicitacao encontrada.

        </div>

      `;

    } else {

      requestContainer.innerHTML = data.map((item) => `

        <article class="account-item">

          <strong>

            ${esc(item.servicos?.nome || "Servico")}

          </strong>

          <span>

            ${esc(item.status || "solicitado")}

            •

            ${esc(formatDateTime(item.criado_em))}

          </span>

          <p>

            ${esc(item.descricao_problema || "")}

          </p>

        </article>

      `).join("");

    }

  }

 

  if (conversationContainer) {

    const {

      data,

      error

    } = await supabase

      .from(TABLES.CONVERSAS)

      .select(`

        id,

        assunto,

        status,

        criado_em,

        atualizado_em

      `)

      .order("atualizado_em", { ascending: false })

      .limit(30);

 

    if (error) {

      conversationContainer.innerHTML = `

        <div class="empty">

          Nao foi possivel carregar as conversas.

        </div>

      `;

      console.error(error);

    } else if (!data?.length) {

      conversationContainer.innerHTML = `

        <div class="empty">

          Nenhuma conversa encontrada.

        </div>

      `;

    } else {

      conversationContainer.innerHTML = data.map((item) => `

        <a

          href="conversa.html?id=${encodeURIComponent(item.id)}"

          class="conversation-card"

        >

          <div class="conversation-card-content">

            <div>

              <h3>

                ${esc(item.assunto || "Atendimento")}

              </h3>

              <span>

                ${esc(item.status || "aberta")}

              </span>

            </div>

            <time>

              ${esc(formatDateTime(

                item.atualizado_em || item.criado_em

              ))}

            </time>

          </div>

        </a>

      `).join("");

    }

  }

}

 

/* =========================================================

   33. ADMIN - LISTAS DE CONTEUDO

   ========================================================= */

 

async function loadAdminProducts() {

  const container = qs(

    "#produtosAdminLista"

  );

 

  if (!container) return;

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.PRODUTOS)

    .select("id,nome,modelo,descricao,imagem_capa,disponivel,destaque")

    .order("nome", { ascending: true });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar os produtos.

      </div>

    `;

    console.error(error);

    return;

  }

 

  container.innerHTML = (data || []).map((item) => `

    <div class="admin-item" data-admin-item>

      <div>

        <strong>${esc(item.nome || "Produto")}</strong>

        <small>

          ${esc(item.modelo || "Sem modelo")}

          •

          ${item.disponivel ? "Disponivel" : "Oculto"}

          ${item.destaque ? " • Destaque" : ""}

        </small>

      </div>

      <div class="admin-actions">

        <button

          type="button"

          class="btn btn-outline"

          data-admin-edit="produto"

          data-id="${esc(item.id)}"

        >

          Editar

        </button>

        <button

          type="button"

          class="btn btn-danger"

          data-admin-delete="produtos"

          data-id="${esc(item.id)}"

        >

          Excluir

        </button>

      </div>

    </div>

  `).join("") || `

    <div class="empty">

      Nenhum produto cadastrado.

    </div>

  `;

}

 

async function loadAdminServices() {

  const container = qs(

    "#servicosAdminLista"

  );

 

  if (!container) return;

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.SERVICOS)

    .select("id,nome,descricao,imagem_capa,ativo")

    .order("nome", { ascending: true });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar os servicos.

      </div>

    `;

    console.error(error);

    return;

  }

 

  container.innerHTML = (data || []).map((item) => `

    <div class="admin-item" data-admin-item>

      <div>

        <strong>${esc(item.nome || "Servico")}</strong>

        <small>

          ${item.ativo ? "Ativo" : "Oculto"}

        </small>

      </div>

      <div class="admin-actions">

        <button

          type="button"

          class="btn btn-outline"

          data-admin-edit="servico"

          data-id="${esc(item.id)}"

        >

          Editar

        </button>

        <button

          type="button"

          class="btn btn-danger"

          data-admin-delete="servicos"

          data-id="${esc(item.id)}"

        >

          Excluir

        </button>

      </div>

    </div>

  `).join("") || `

    <div class="empty">

      Nenhum servico cadastrado.

    </div>

  `;

}

 

async function loadAdminProjects() {

  const container = qs(

    "#projetosAdminLista"

  );

 

  if (!container) return;

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.PROJETOS)

    .select("id,titulo,categoria,descricao,imagem_capa,publicado")

    .order("titulo", { ascending: true });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar os projetos.

      </div>

    `;

    console.error(error);

    return;

  }

 

  container.innerHTML = (data || []).map((item) => `

    <div class="admin-item" data-admin-item>

      <div>

        <strong>${esc(item.titulo || "Projeto")}</strong>

        <small>

          ${esc(item.categoria || "Sem categoria")}

          •

          ${item.publicado ? "Publicado" : "Rascunho"}

        </small>

      </div>

      <div class="admin-actions">

        <button

          type="button"

          class="btn btn-outline"

          data-admin-edit="projeto"

          data-id="${esc(item.id)}"

        >

          Editar

        </button>

        <button

          type="button"

          class="btn btn-danger"

          data-admin-delete="projetos"

          data-id="${esc(item.id)}"

        >

          Excluir

        </button>

      </div>

    </div>

  `).join("") || `

    <div class="empty">

      Nenhum projeto cadastrado.

    </div>

  `;

}

 

async function loadAdminPosts() {

  const container = qs(

    "#publicacoesAdminLista"

  );

 

  if (!container) return;

 

  const {

    data,

    error

  } = await supabase

    .from(TABLES.PUBLICACOES)

    .select("id,titulo,resumo,conteudo,imagem_capa,publicado,data_publicacao")

    .order("data_publicacao", { ascending: false });

 

  if (error) {

    container.innerHTML = `

      <div class="empty">

        Nao foi possivel carregar as publicacoes.

      </div>

    `;

    console.error(error);

    return;

  }

 

  container.innerHTML = (data || []).map((item) => `

    <div class="admin-item" data-admin-item>

      <div>

        <strong>${esc(item.titulo || "Publicacao")}</strong>

        <small>

          ${item.publicado ? "Publicado" : "Rascunho"}

          ${item.data_publicacao

            ? ` • ${esc(formatDate(item.data_publicacao))}`

            : ""}

        </small>

      </div>

      <div class="admin-actions">

        <button

          type="button"

          class="btn btn-outline"

          data-admin-edit="publicacao"

          data-id="${esc(item.id)}"

        >

          Editar

        </button>

        <button

          type="button"

          class="btn btn-danger"

          data-admin-delete="publicacoes"

          data-id="${esc(item.id)}"

        >

          Excluir

        </button>

      </div>

    </div>

  `).join("") || `

    <div class="empty">

      Nenhuma publicacao cadastrada.

    </div>

  `;

}

 

/* =========================================================

   34. ADMIN - PREENCHER EDICAO

   ========================================================= */

 

async function editAdminItem(kind, id) {

  if (!id) return;

 

  const map = {

    produto: {

      table: TABLES.PRODUTOS,

      form: "#produtoForm"

    },

    servico: {

      table: TABLES.SERVICOS,

      form: "#servicoForm"

    },

    projeto: {

      table: TABLES.PROJETOS,

      form: "#projetoForm"

    },

    publicacao: {

      table: TABLES.PUBLICACOES,

      form: "#publicacaoForm"

    }

  };

 

  const config = map[kind];

  if (!config) return;

 

  const {

    data,

    error

  } = await supabase

    .from(config.table)

    .select("*")

    .eq("id", id)

    .maybeSingle();

 

  if (error || !data) {

    alert(

      "Nao foi possivel carregar este item."

    );

    console.error(error);

    return;

  }

 

  const form = document.querySelector(config.form);

  if (!form) return;

 

  if (kind === "produto") {

    qs("#produtoId").value = data.id || "";

    qs("#produtoNome").value = data.nome || "";

    qs("#produtoModelo").value = data.modelo || "";

    qs("#produtoDescricao").value = data.descricao || "";

    qs("#produtoImagem").value = data.imagem_capa || "";

    qs("#produtoDisponivel").checked = !!data.disponivel;

    qs("#produtoDestaque").checked = !!data.destaque;

  }

 

  if (kind === "servico") {

    qs("#servicoId").value = data.id || "";

    qs("#servicoNome").value = data.nome || "";

    qs("#servicoDescricao").value = data.descricao || "";

    qs("#servicoImagem").value = data.imagem_capa || "";

    qs("#servicoAtivo").checked = !!data.ativo;

  }

 

  if (kind === "projeto") {

    qs("#projetoId").value = data.id || "";

    qs("#projetoTitulo").value = data.titulo || "";

    qs("#projetoCategoria").value = data.categoria || "";

    qs("#projetoDescricao").value = data.descricao || "";

    qs("#projetoImagem").value = data.imagem_capa || "";

    qs("#projetoPublicado").checked = !!data.publicado;

  }

 

  if (kind === "publicacao") {

    qs("#publicacaoId").value = data.id || "";

    qs("#publicacaoTitulo").value = data.titulo || "";

    qs("#publicacaoResumo").value = data.resumo || "";

    qs("#publicacaoConteudo").value = data.conteudo || "";

    qs("#publicacaoImagem").value = data.imagem_capa || "";

    qs("#publicacaoPublicado").checked = !!data.publicado;

  }

 

  form.scrollIntoView({

    behavior: "smooth",

    block: "start"

  });

}

 

/* =========================================================

   35. ADMIN - SALVAR

   ========================================================= */

 

async function saveAdminRecord(

  table,

  id,

  payload,

  form

) {

  if (!await requireAdmin()) {

    return false;

  }

 

  const query = id

    ? supabase

        .from(table)

        .update(payload)

        .eq("id", id)

    : supabase

        .from(table)

        .insert(payload);

 

  const {

    error

  } = await query;

 

  if (error) {

    alert(

      dbError(

        error,

        "Nao foi possivel salvar os dados."

      )

    );

    return false;

  }

 

  if (form) {

    form.reset();

 

    const idInput =

      form.querySelector(

        "input[type='hidden']"

      );

 

    if (idInput) {

      idInput.value = "";

    }

  }

 

  return true;

}

 

/* =========================================================

   36. ADMIN - FORMULARIOS

   ========================================================= */

 

function setupAdminForms() {

  const productForm = qs(

    "#produtoForm"

  );

 

  if (productForm && productForm.dataset.bound !== "true") {

    productForm.dataset.bound = "true";

 

    productForm.addEventListener("submit", async (event) => {

      event.preventDefault();

 

      const id = qs("#produtoId")?.value || "";

 

      const payload = {

        nome: qs("#produtoNome")?.value.trim() || "",

        modelo: qs("#produtoModelo")?.value.trim() || null,

        descricao: qs("#produtoDescricao")?.value.trim() || null,

        imagem_capa: qs("#produtoImagem")?.value.trim() || null,

        disponivel: !!qs("#produtoDisponivel")?.checked,

        destaque: !!qs("#produtoDestaque")?.checked

      };

 

      const saved = await saveAdminRecord(

        TABLES.PRODUTOS,

        id,

        payload,

        productForm

      );

 

      if (saved) {

        await loadAdminProducts();

        await adminStats();

      }

    });

  }

 

  const serviceForm = qs(

    "#servicoForm"

  );

 

  if (serviceForm && serviceForm.dataset.bound !== "true") {

    serviceForm.dataset.bound = "true";

 

    serviceForm.addEventListener("submit", async (event) => {

      event.preventDefault();

 

      const id = qs("#servicoId")?.value || "";

 

      const payload = {

        nome: qs("#servicoNome")?.value.trim() || "",

        descricao: qs("#servicoDescricao")?.value.trim() || null,

        imagem_capa: qs("#servicoImagem")?.value.trim() || null,

        ativo: !!qs("#servicoAtivo")?.checked

      };

 

      const saved = await saveAdminRecord(

        TABLES.SERVICOS,

        id,

        payload,

        serviceForm

      );

 

      if (saved) {

        await loadAdminServices();

        await adminStats();

      }

    });

  }

 

  const projectForm = qs(

    "#projetoForm"

  );

 

  if (projectForm && projectForm.dataset.bound !== "true") {

    projectForm.dataset.bound = "true";

 

    projectForm.addEventListener("submit", async (event) => {

      event.preventDefault();

 

      const id = qs("#projetoId")?.value || "";

 

      const payload = {

        titulo: qs("#projetoTitulo")?.value.trim() || "",

        categoria: qs("#projetoCategoria")?.value.trim() || null,

        descricao: qs("#projetoDescricao")?.value.trim() || null,

        imagem_capa: qs("#projetoImagem")?.value.trim() || null,

        publicado: !!qs("#projetoPublicado")?.checked

      };

 

      const saved = await saveAdminRecord(

        TABLES.PROJETOS,

        id,

        payload,

        projectForm

      );

 

      if (saved) {

        await loadAdminProjects();

        await adminStats();

      }

    });

  }

 

  const publicationForm = qs(

    "#publicacaoForm"

  );

 

  if (publicationForm && publicationForm.dataset.bound !== "true") {

    publicationForm.dataset.bound = "true";

 

    publicationForm.addEventListener("submit", async (event) => {

      event.preventDefault();

 

      const id = qs("#publicacaoId")?.value || "";

 

      const payload = {

        titulo: qs("#publicacaoTitulo")?.value.trim() || "",

        resumo: qs("#publicacaoResumo")?.value.trim() || null,

        conteudo: qs("#publicacaoConteudo")?.value.trim() || null,

        imagem_capa: qs("#publicacaoImagem")?.value.trim() || null,

        publicado: !!qs("#publicacaoPublicado")?.checked,

        data_publicacao: new Date().toISOString()

      };

 

      const saved = await saveAdminRecord(

        TABLES.PUBLICACOES,

        id,

        payload,

        publicationForm

      );

 

      if (saved) {

        await loadAdminPosts();

        await adminStats();

      }

    });

  }

}

 

/* =========================================================

   37. ADMIN - EDITAR / EXCLUIR

   ========================================================= */

 

function setupAdminActions() {

  qsa("[data-admin-edit]").forEach((button) => {

    if (button.dataset.actionBound === "true") {

      return;

    }

 

    button.dataset.actionBound = "true";

 

    button.addEventListener("click", async () => {

      await editAdminItem(

        button.dataset.adminEdit,

        button.dataset.id

      );

    });

  });

 

  qsa("[data-admin-delete]").forEach((button) => {

    if (button.dataset.actionBound === "true") {

      return;

    }

 

    button.dataset.actionBound = "true";

 

    button.addEventListener("click", async () => {

      const table =

        button.dataset.adminDelete;

 

      const id =

        button.dataset.id;

 

      if (!table || !id) return;

 

      const confirmed = window.confirm(

        "Tem certeza que deseja excluir este item?"

      );

 

      if (!confirmed) return;

 

      if (!await requireAdmin()) return;

 

      const {

        error

      } = await supabase

        .from(table)

        .delete()

        .eq("id", id);

 

      if (error) {

        alert(

          "Nao foi possivel excluir este item."

        );

        console.error(error);

        return;

      }

 

      button

        .closest("[data-admin-item]")

        ?.remove();

 

      await adminStats();

    });

  });

}

 

/* =========================================================

   38. ADMIN - MENU

   ========================================================= */

 

function setupAdminMenu() {

  const buttons = qsa(

    "[data-panel]"

  );

 

  if (!buttons.length) return;

 

  const panels = qsa(

    ".admin-panel"

  );

 

  buttons.forEach((button) => {

    if (button.dataset.panelBound === "true") {

      return;

    }

 

    button.dataset.panelBound = "true";

 

    button.addEventListener("click", () => {

      const target =

        button.dataset.panel;

 

      buttons.forEach((item) => {

        item.classList.toggle(

          "active",

          item === button

        );

      });

 

      panels.forEach((panel) => {

        panel.style.display =

          panel.id === target

            ? "block"

            : "none";

      });

    });

  });

 

  const firstButton =

    buttons[0];

 

  firstButton?.click();

}

 

/* =========================================================

   39. ADMIN - CARREGAR

   ========================================================= */

 

async function loadAdminArea() {

  if (getCurrentPage() !== "admin.html") {

    return;

  }

 

  const allowed =

    await requireAdmin();

 

  if (!allowed) return;

 

  await adminStats();

  await adminUsers();

  await adminRequests();

  await loadAdminProducts();

  await loadAdminServices();

  await loadAdminProjects();

  await loadAdminPosts();

 

  setupAdminMenu();

  setupAdminForms();

  setupAdminActions();

}

 

/* =========================================================

   40. LINKS E INTERFACE

   ========================================================= */

 

function setupServiceLinks() {

  qsa("[data-service]").forEach((element) => {

    if (element.dataset.serviceBound === "true") {

      return;

    }

 

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

  qsa("[data-whatsapp]").forEach((element) => {

    if (element.dataset.whatsappBound === "true") {

      return;

    }

 

    element.dataset.whatsappBound = "true";

 

    element.addEventListener("click", (event) => {

      event.preventDefault();

 

      const message =

        element.dataset.whatsappMessage ||

        "Ola! Gostaria de falar com a Max Som.";

 

      const url =

        `https://wa.me/5565996262514?text=${encodeURIComponent(message)}`;

 

      window.open(

        url,

        "_blank",

        "noopener,noreferrer"

      );

    });

  });

}

 

function markCurrentPage() {

  const page = getCurrentPage();

 

  qsa("nav a[href]").forEach((link) => {

    const href =

      link

        .getAttribute("href")

        ?.split("?")[0]

        .toLowerCase();

 

    if (href === page) {

      link.classList.add("active");

      link.classList.add("nav-current");

    }

  });

}

 

/* =========================================================

   41. REALTIME DAS CONVERSAS

   ========================================================= */

 

function setupConversationPageRealtime() {

  if (!currentUser) return;

 

  if (getCurrentPage() === "conversas.html") {

    setupConversationListRealtime();

  }

 

  if (getCurrentPage() === "conta.html") {

    setupConversationListRealtime();

  }

}

 

/* =========================================================

   42. LIMPAR ESTADOS DE EDICAO

   ========================================================= */

 

function setupCancelButtons() {

  qsa(

    "#produtoCancelar",

    "#servicoCancelar",

    "#projetoCancelar",

    "#publicacaoCancelar",

    "[data-cancel-form]"

  ).forEach((button) => {

    if (button.dataset.cancelBound === "true") {

      return;

    }

 

    button.dataset.cancelBound = "true";

 

    button.addEventListener("click", () => {

      const form = button.closest("form");

 

      if (!form) return;

 

      form.reset();

 

      const hidden =

        form.querySelector(

          "input[type='hidden']"

        );

 

      if (hidden) hidden.value = "";

    });

  });

}

 

/* =========================================================

   43. INTERFACE PUBLICA

   ========================================================= */

 

function enhancePublicInterface() {

  qsa(

    ".product-card, .service-card, .project-card, .post-card, .benefit-card"

  ).forEach((card, index) => {

    card.style.animationDelay =

      `${Math.min(index * 45, 250)}ms`;

  });

}

 

/* =========================================================

   44. CARREGAMENTO DA PAGINA

   ========================================================= */

 

async function loadCurrentPageData() {

  const page = getCurrentPage();

 

  if (page === "conta.html") {

    await loadAccountPage();

  }

 

  if (page === "conversas.html") {

    await loadConversations();

    setupConversationButtons();

  }

 

  if (page === "conversa.html") {

    await loadConversation();

  }

 

  if (page === "atendimento.html") {

    await setupAttendancePage();

  }

 

  await Promise.allSettled([

    loadProducts(),

    loadServices(),

    loadProjects(),

    loadPosts()

  ]);

 

  if (currentUser) {

    await loadNotifications();

  }

}

 

/* =========================================================

   45. INICIALIZACAO PRINCIPAL

   ========================================================= */

 

async function initializeMaxSom() {

  try {

    if (!isSupabaseReady()) {

      return;

    }

 

    /*

     * 1. Recupera a sessao antes de qualquer verificacao.

     */

    const {

      data: sessionData

    } = await supabase.auth.getSession();

 

    currentUser =

      sessionData?.session?.user || null;

 

    if (currentUser) {

      await loadProfile(currentUser);

    } else {

      currentProfile = null;

    }

 

    /*

     * 2. Atualiza menu.

     */

    await updateNav();

 

    setupLogoutButtons();

    setupGeneralNavigation();

    markCurrentPage();

    setupServiceLinks();

    setupWhatsApp();

    setupConversationButtons();

    setupAdminRequestButton();

    setupCancelButtons();

 

    /*

     * 3. Login/cadastro sao ligados cedo.

     */

    await setupLogin();

    await setupSignup();

 

    /*

     * 4. Paginas protegidas.

     */

    const allowed =

      await enforcePageAccess();

 

    if (!allowed) {

      return;

    }

 

    /*

     * 5. Se alguem abriu login ja estando logado,

     * vai para Minha conta.

     */

    await redirectAuthenticatedUser();

 

    /*

     * 6. Pagina atual.

     */

    await loadCurrentPageData();

 

    /*

     * 7. Area administrativa.

     */

    await loadAdminArea();

 

    /*

     * 8. Realtime.

     */

    if (currentUser) {

      setupConversationPageRealtime();

      setupNotificationRealtime();

    }

 

    /*

     * 9. Listener unico de autenticacao.

     */

    setupAuthListener();

 

    enhancePublicInterface();

 

  } catch (error) {

    console.error(

      "Erro na inicializacao do Max Som:",

      error

    );

  }

}

 

/* =========================================================

   46. EXECUCAO

   ========================================================= */

 

if (document.readyState === "loading") {

  document.addEventListener(

    "DOMContentLoaded",

    initializeMaxSom

  );

} else {

  initializeMaxSom();

}

 

/* =========================================================

   47. API PUBLICA

   ========================================================= */

 

window.MaxSom = {

  reload: initializeMaxSom,

  updateNav,

  ensureProfile,

  requireAdmin,

  logout,

  loadProducts,

  loadServices,

  loadProjects,

  loadPosts,

  loadConversations,

  loadConversation,

  loadNotifications

};
