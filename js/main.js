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
