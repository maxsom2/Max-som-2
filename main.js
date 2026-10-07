/* =========================================================

   MAX SOM

   MAIN.JS — VERSAO LIMPA E CORRIGIDA

   ========================================================= */


/* =========================================================

   1. SUPABASE

   ========================================================= */


const SUPABASE_URL =

  "https://diabhunpflawknocixit.supabase.co";


const SUPABASE_KEY =

  "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";


const supabase =

  window.supabase && typeof window.supabase.createClient === "function"

    ? window.supabase.createClient(

        SUPABASE_URL,

        SUPABASE_KEY,

        {

          auth: {

            persistSession: true,

            autoRefreshToken: true,

            detectSessionInUrl: true

          }

        }

      )

    : null;


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

  PUBLICACOES: "publicacoes"

};


let currentUser = null;

let currentProfile = null;

let authListenerBound = false;


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


function normalizeType(type) {

  return String(type ?? "").trim().toLowerCase();

}


function isAdmin(profile = currentProfile) {

  return ADMIN_TYPES.includes(

    normalizeType(profile?.tipo_usuario)

  );

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

  if (!isSupabaseReady()) return;


  const logged = !!currentUser;

  const profile =

    currentProfile ||

    (logged ? await loadProfile(currentUser) : null);

  const admin = isAdmin(profile);


  qsa("[data-guest-only]").forEach((element) => {

    element.style.display = logged ? "none" : "";

  });


  qsa("[data-logged-only]").forEach((element) => {

    element.style.display = logged ? "" : "none";

  });


  qsa("[data-conversations-link]").forEach((element) => {

    element.style.display = logged ? "" : "none";

  });


  qsa("[data-admin-only]").forEach((element) => {

    element.style.display = admin ? "" : "none";

  });


  qsa("[data-logout]").forEach((button) => {

    button.style.display = logged ? "" : "none";


    if (button.dataset.logoutBound === "true") return;


    button.dataset.logoutBound = "true";

    button.addEventListener("click", async (event) => {

      event.preventDefault();

      await logout();

    });

  });

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

      qs("#loginError", "#mensagemLogin");

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

      await loadProfile(data.user);

      await updateNav();


      window.location.replace("conta.html");


    } catch (error) {

      showMessage(

        message,

        "E-mail ou senha incorretos. Verifique os dados e tente novamente.",

        "error"

      );

      console.error("Erro no login:", error);

    } finally {

      setButtonLoading(button, false, "Entrar");

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

        await ensureProfile(data.user, {

          nome,

          telefone,

          whatsapp

        });

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

      showMessage(

        message,

        dbError(error, "Não foi possível criar a conta."),

        "error"

      );

    } finally {

      setButtonLoading(button, false, "Criar conta");

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


  supabase.auth.onAuthStateChange(async (event, session) => {

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

        window.location.replace("login.html");

      }

    }

  });

}


/* =========================================================

   10. PROTECAO DO ADMIN

   ========================================================= */


async function requireAdmin() {

  if (!currentUser) {

    window.location.replace("login.html");

    return false;

  }


  const profile =

    currentProfile ||

    await loadProfile(currentUser);


  if (!profile || !isAdmin(profile)) {

    window.location.replace("index.html");

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

  if (getCurrentPage() !== "login.html") return;

  if (!currentUser) return;


  window.location.replace("conta.html");

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


  const displayName =

    profile?.nome ||

    currentUser.email?.split("@")[0] ||

    "Usuário";


  const type = normalizeType(

    profile?.tipo_usuario || "cliente"

  );


  let typeLabel = "Visualizador";

  if (isAdmin(profile)) {

    typeLabel = "Administrador";

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

      "-";

  }

  if (typeField) typeField.textContent = typeLabel;


  await loadAccountRequests();

  await loadAccountConversations();

  await loadNotifications();

  setupAdminRequestButton();

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

    .select(

      "id,servico_id,status,descricao_problema,observacoes,criado_em"

    )

    .eq("cliente_id", currentUser.id)

    .order("criado_em", { ascending: false })

    .limit(20);


  if (error) {

    container.innerHTML =

      '<div class="empty">Não foi possível carregar suas solicitações.</div>';

    console.error(error);

    return;

  }


  if (!data?.length) {

    container.innerHTML =

      '<div class="empty">Nenhuma solicitação encontrada.</div>';

    return;

  }


  container.innerHTML = data.map((item) => `

    <article class="account-item">

      <strong>Solicitação de atendimento</strong>

      <span>${esc(item.status || "Em análise")} • ${esc(formatDateTime(item.criado_em))}</span>

      <p>${esc(item.descricao_problema || item.observacoes || "")}</p>

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

    .select(

      "id,cliente_id,funcionario_id,assunto,status,criado_em,atualizado_em"

    )

    .or(

      `cliente_id.eq.${currentUser.id},funcionario_id.eq.${currentUser.id}`

    )

    .order("atualizado_em", { ascending: false })

    .limit(20);


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

  if (!currentUser) {

    window.location.replace("login.html");

    return;

  }


  const profile =

    currentProfile ||

    await loadProfile(currentUser);


  if (!profile) return;


  const type = normalizeType(profile.tipo_usuario);


  if (isAdmin(profile)) {

    alert("Sua conta já possui acesso de administrador.");

    return;

  }


  if (type === "solicitante_admin") {

    alert("Sua solicitação de administrador já foi enviada.");

    return;

  }


  const { error } = await supabase

    .from(TABLES.USUARIO)

    .update({ tipo_usuario: "solicitante_admin" })

    .eq("id", currentUser.id);


  if (error) {

    alert("Não foi possível enviar a solicitação.");

    console.error(error);

    return;

  }


  currentProfile = {

    ...profile,

    tipo_usuario: "solicitante_admin"

  };


  alert("Solicitação enviada para análise.");

  await updateNav();

  await loadAccountPage();

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


    if (!descricao) {

      showMessage(

        "#mensagemAtendimento",

        "Explique o que você precisa.",

        "error"

      );

      descriptionInput?.focus();

      return;

    }


    setButtonLoading(button, true, "Enviar para o WhatsApp");

    clearMessage("#mensagemAtendimento");


    const result = await saveAttendanceRequest({

      serviceId,

      nome,

      telefone,

      equipamento,

      descricao

    });


    const whatsappMessage = buildAttendanceWhatsAppMessage({

      nome,

      telefone,

      servico: serviceNome,

      equipamento,

      descricao

    });


    window.open(

      `https://wa.me/5565996262514?text=${encodeURIComponent(whatsappMessage)}`,

      "_blank",

      "noopener,noreferrer"

    );


    form.reset();


    showMessage(

      "#mensagemAtendimento",

      result.saved

        ? "Solicitação registrada. O WhatsApp foi aberto."

        : "O WhatsApp foi aberto com sua mensagem pronta.",

      "success"

    );


    setButtonLoading(button, false, "Enviar para o WhatsApp");

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


async function loadProducts() {

  const containers = qsa(

    "#productsGrid",

    "#produtosGrid",

    "#produtosLista",

    "#productsList",

    "#produtosContainer"

  );


  if (!containers.length || !isSupabaseReady()) return;


  let query = supabase

    .from(TABLES.PRODUTOS)

    .select(

      "id,nome,modelo,descricao,especificacoes,imagem_capa,disponivel,destaque,criado_em"

    )

    .eq("disponivel", true);


  if (getCurrentPage() === "index.html") {

    query = query.eq("destaque", true).limit(6);

  }


  const {

    data,

    error

  } = await query.order("criado_em", { ascending: false });


  containers.forEach((container) => {

    if (error) {

      container.innerHTML =

        '<div class="empty">Não foi possível carregar os produtos.</div>';

      return;

    }


    if (!data?.length) {

      container.innerHTML =

        '<div class="empty">Nenhum produto disponível no momento.</div>';

      return;

    }


    container.innerHTML = data.map((product) => `

      <article class="product-card">

        ${product.imagem_capa

          ? `<img src="${esc(product.imagem_capa)}" alt="${esc(product.nome || "Produto Max Som")}" loading="lazy">`

          : `<div class="product-image">Max Som</div>`}

        <div class="product-info">

          <span>Equipamento</span>

          <h3>${esc(product.nome || "Produto")}</h3>

          ${product.modelo ? `<p><strong>Modelo:</strong> ${esc(product.modelo)}</p>` : ""}

          <p>${esc(product.descricao || "Consulte a Max Som para mais informações.")}</p>

          ${product.especificacoes

            ? `<details><summary>Especificações</summary><p>${esc(product.especificacoes)}</p></details>`

            : ""}

        </div>

      </article>

    `).join("");

  });

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

    "#servicosContainer"

  );


  if (!containers.length || !isSupabaseReady()) return;


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

    if (error) {

      container.innerHTML =

        '<div class="empty">Não foi possível carregar os serviços.</div>';

      return;

    }


    if (!data?.length) {

      container.innerHTML =

        '<div class="empty">Nenhum serviço disponível.</div>';

      return;

    }


    container.innerHTML = data.map((service) => `

      <article class="service-card">

        ${service.imagem_capa ? `<img src="${esc(service.imagem_capa)}" alt="${esc(service.nome || "Serviço Max Som")}" loading="lazy">` : ""}

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

    `).join("");

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

    "#projectsList"

  );


  if (!containers.length || !isSupabaseReady()) return;


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

    if (error) {

      container.innerHTML =

        '<div class="empty">Não foi possível carregar os projetos.</div>';

      return;

    }


    if (!data?.length) {

      container.innerHTML =

        '<div class="empty">Nenhum projeto publicado.</div>';

      return;

    }


    container.innerHTML = data.map((project) => `

      <article class="project-card">

        ${project.imagem_capa

          ? `<img src="${esc(project.imagem_capa)}" alt="${esc(project.titulo || "Projeto Max Som")}" loading="lazy">`

          : `<div class="project-image">Max Som</div>`}

        <div class="project-info">

          ${project.categoria ? `<span>${esc(project.categoria)}</span>` : ""}

          <h3>${esc(project.titulo || "Projeto")}</h3>

          ${project.descricao ? `<p>${esc(project.descricao)}</p>` : ""}

        </div>

      </article>

    `).join("");

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

    "#publicacoesContainer"

  );


  if (!containers.length || !isSupabaseReady()) return;


  let query = supabase

    .from(TABLES.PUBLICACOES)

    .select(

      "id,titulo,resumo,conteudo,imagem_capa,publicado,data_publicacao,criado_em"

    )

    .eq("publicado", true);


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


    container.innerHTML = data.map((publication) => `

      <article class="post-card">

        ${publication.imagem_capa

          ? `<img src="${esc(publication.imagem_capa)}" alt="${esc(publication.titulo || "Publicação Max Som")}" loading="lazy">`

          : `<div class="post-image">Max Som</div>`}

        <div class="post-info">

          <span>Publicação</span>

          <h3>${esc(publication.titulo || "Publicação")}</h3>

          ${publication.resumo ? `<p>${esc(publication.resumo)}</p>` : ""}

          ${publication.data_publicacao ? `<small>${esc(formatDate(publication.data_publicacao))}</small>` : ""}

          ${publication.conteudo ? `<details><summary>Ler publicação</summary><p>${esc(publication.conteudo)}</p></details>` : ""}

        </div>

      </article>

    `).join("");

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

  qsa("[data-whatsapp]").forEach((element) => {

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

    .order("atualizado_em", { ascending: false });


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

    alert("Não foi possível iniciar a conversa.");

    console.error(error);

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

    console.error(error);

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

      showMessage(

        "#mensagemConversa",

        "Não foi possível enviar a mensagem.",

        "error"

      );

      console.error(error);

    } else if (input) {

      input.value = "";

      await loadMessages(conversationId);

    }


    if (button) button.disabled = false;

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

    container.innerHTML =

      '<div class="empty">Não foi possível carregar as notificações.</div>';

    console.error(error);

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

        ${notification.link ? `<a class="btn btn-secondary" href="${esc(notification.link)}">Abrir</a>` : ""}

        ${!notification.lida

          ? `<button type="button" class="btn btn-outline" data-mark-notification data-notification-id="${esc(notification.id)}">Marcar como lida</button>`

          : ""}

      </div>

    </article>

  `).join("");


  setupNotificationActions();

}


async function markNotificationAsRead(notificationId) {

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

    if (button.dataset.notificationBound === "true") return;


    button.dataset.notificationBound = "true";

    button.addEventListener("click", async () => {

      button.disabled = true;

      await markNotificationAsRead(button.dataset.notificationId);

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

    return 0;

  }


  return count || 0;

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

    <div class="stat-card">

      <span>${esc(label)}</span>

      <strong>${value}</strong>

    </div>

  `).join("");

}


/* =========================================================

   27. ADMIN - LISTAS

   ========================================================= */


async function adminUsers() {

  const container = qs("#adminUsuariosLista");

  if (!container || !isAdmin()) return;


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

          <button class="btn-aprovar-admin" data-user-id="${esc(user.id)}" data-action="aprovar">Aprovar administrador</button>

          <button class="btn-recusar-admin" data-user-id="${esc(user.id)}" data-action="recusar">Recusar</button>

        </div>

      `

      : "";


    return `

      <div class="admin-user-card">

        <div class="admin-user-info">

          <strong>${esc(user.nome || "Sem nome")}</strong>

          <span>${esc(user.tipo_usuario || "cliente")}</span>

        </div>

        ${ADMIN_TYPES.includes(type)

          ? '<span class="admin-badge">Administrador</span>'

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

    const {

      data,

      error

    } = await supabase

      .from(TABLES.SOLICITACOES)

      .select("id,status,descricao_problema,observacoes,criado_em")

      .order("criado_em", { ascending: false })

      .limit(30);


    requests.innerHTML = error

      ? '<p>Não foi possível carregar as solicitações.</p>'

      : data?.length

        ? data.map((item) => `

            <div class="account-item">

              <strong>${esc(item.status || "Solicitado")}</strong>

              <span>${esc(formatDateTime(item.criado_em))}</span>

              <p>${esc(item.descricao_problema || item.observacoes || "")}</p>

            </div>

          `).join("")

        : '<p>Nenhuma solicitação encontrada.</p>';

  }


  if (conversations) {

    const {

      data,

      error

    } = await supabase

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

            </div>

          `).join("")

        : '<p>Nenhuma conversa encontrada.</p>';

  }

}


/* =========================================================

   28. ADMIN - CRUD

   ========================================================= */


async function saveAdminRow(table, id, values) {

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

    .select("id,nome,modelo,descricao,imagem_capa,disponivel,destaque")

    .order("nome", { ascending: true });


  if (error) {

    container.innerHTML = '<p>Não foi possível carregar os produtos.</p>';

    return;

  }


  container.innerHTML = (data || []).map((item) => `

    <div class="admin-item" data-admin-item>

      <div>

        <strong>${esc(item.nome || "Produto")}</strong>

        <span>${esc(item.modelo || "")}</span>

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

    .select("id,titulo,resumo,publicado,data_publicacao")

    .order("data_publicacao", { ascending: false });


  if (error) {

    container.innerHTML = '<p>Não foi possível carregar as publicações.</p>';

    return;

  }


  container.innerHTML = (data || []).map((item) => `

    <div class="admin-item" data-admin-item>

      <div><strong>${esc(item.titulo || "Publicação")}</strong></div>

      <div class="admin-item-actions">

        <button type="button" class="btn btn-outline" data-edit-type="publicacao" data-edit-id="${esc(item.id)}">Editar</button>

        <button type="button" class="btn btn-danger" data-delete-table="${TABLES.PUBLICACOES}" data-delete-id="${esc(item.id)}">Excluir</button>

      </div>

    </div>

  `).join("") || '<p>Nenhuma publicação cadastrada.</p>';

}


async function setupAdminForms() {

  if (!isAdmin()) return;


  const productForm = qs("#produtoForm");

  if (productForm && productForm.dataset.formBound !== "true") {

    productForm.dataset.formBound = "true";

    productForm.addEventListener("submit", async (event) => {

      event.preventDefault();

      const id = qs("#produtoId")?.value || "";

      const values = {

        nome: qs("#produtoNome")?.value.trim() || "",

        modelo: qs("#produtoModelo")?.value.trim() || null,

        descricao: qs("#produtoDescricao")?.value.trim() || null,

        imagem_capa: qs("#produtoImagem")?.value.trim() || null,

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

        publicado: !!qs("#projetoPublicado")?.checked

      };

      if (await saveAdminRow(TABLES.PROJETOS, id, values)) {

        projectForm.reset();

        qs("#projetoId") && (qs("#projetoId").value = "");

        await loadAdminProjects();

        await loadProjects();

      }

    });

  }


  const postForm = qs("#publicacaoForm");

  if (postForm && postForm.dataset.formBound !== "true") {

    postForm.dataset.formBound = "true";

    postForm.addEventListener("submit", async (event) => {

      event.preventDefault();

      const id = qs("#publicacaoId")?.value || "";

      const values = {

        titulo: qs("#publicacaoTitulo")?.value.trim() || "",

        resumo: qs("#publicacaoResumo")?.value.trim() || null,

        conteudo: qs("#publicacaoConteudo")?.value.trim() || null,

        imagem_capa: qs("#publicacaoImagem")?.value.trim() || null,

        publicado: !!qs("#publicacaoPublicado")?.checked,

        data_publicacao: new Date().toISOString()

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

        qs("#produtoModelo") && (qs("#produtoModelo").value = data.modelo || "");

        qs("#produtoDescricao") && (qs("#produtoDescricao").value = data.descricao || "");

        qs("#produtoImagem") && (qs("#produtoImagem").value = data.imagem_capa || "");

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

        qs("#publicacaoPublicado") && (qs("#publicacaoPublicado").checked = !!data.publicado);

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

  const buttons = qsa("[data-panel]");

  const panels = qsa(".admin-panel");


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


  await Promise.all([

    adminStats(),

    adminUsers(),

    adminRequests(),

    loadAdminProducts(),

    loadAdminServices(),

    loadAdminProjects(),

    loadAdminPosts()

  ]);


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


  qsa("nav a[href]").forEach((link) => {

    const href =

      link.getAttribute("href")?.split("?")[0]?.toLowerCase();


    if (href === page) {

      link.classList.add("active", "nav-current");

    }

  });


  qsa("[data-admin-only]").forEach((element) => {

    element.style.display = "none";

  });


  qsa("[data-guest-only]").forEach((element) => {

    element.style.display = "";

  });


  qsa("[data-logged-only]").forEach((element) => {

    element.style.display = "none";

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


  await Promise.allSettled([

    loadProducts(),

    loadServices(),

    loadProjects(),

    loadPosts()

  ]);


  if (page === "conta.html") {

    await loadAccountPage();

  }


  if (page === "conversas.html") {

    await loadConversations();

  }


  if (page === "conversa.html") {

    await loadConversation();

  }


  if (page === "atendimento.html") {

    await setupAttendancePage();

  }


  if (currentUser) {

    await loadNotifications();

  }


  if (page === "admin.html") {

    await loadAdminArea();

  }

}


/* =========================================================

   33. INICIALIZACAO

   ========================================================= */


async function initializeMaxSom() {

  try {

    if (!isSupabaseReady()) {

      console.error("Supabase JS não foi carregado.");

      return;

    }


    const {

      data,

      error

    } = await supabase.auth.getSession();


    if (error) {

      console.error("Erro ao recuperar sessão:", error);

      return;

    }


    currentUser = data?.session?.user || null;


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


    if (currentUser && getCurrentPage() === "login.html") {

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

  }

}


if (document.readyState === "loading") {

  document.addEventListener("DOMContentLoaded", initializeMaxSom);

} else {

  initializeMaxSom();

}


window.MaxSom = {

  initialize: initializeMaxSom,

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
