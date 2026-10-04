const SUPABASE_URL = "https://diabhunpflawknocixit.supabase.co";
const SUPABASE_KEY = "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const adminTypes = [
  "admin",
  "funcionario",
  "funcionário",
  "dono",
  "administrador"
];

let currentUser = null;
let currentProfile = null;

async function ensureProfile() {
  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) {
    currentUser = null;
    currentProfile = null;
    return null;
  }

  currentUser = user;

  const { data, error } = await supabase
    .from("usuario")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar perfil:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data;
  return data;
}

function isAdmin(profile = currentProfile) {
  const type = String(profile?.tipo_usuario || "")
    .trim()
    .toLowerCase();

  return adminTypes.includes(type);
}

async function updateNav() {
  const p = await ensureProfile();

  const adminLink = document.querySelector("#adminLink");

  if (adminLink) {
    adminLink.style.display = isAdmin(p) ? "" : "none";
  }

  const loginLink = document.querySelector("#loginLink");
  const accountLink = document.querySelector("#accountLink");

  if (p) {
    if (loginLink) loginLink.style.display = "none";
    if (accountLink) accountLink.style.display = "";
  } else {
    if (loginLink) loginLink.style.display = "";
    if (accountLink) accountLink.style.display = "none";
  }
}

async function setupLogin() {
  const form = document.querySelector("#loginForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email =
      document.querySelector("#loginEmail")?.value.trim();

    const password =
      document.querySelector("#loginPassword")?.value;

    const errorBox = document.querySelector("#loginError");

    if (errorBox) {
      errorBox.textContent = "";
    }

    if (!email || !password) {
      if (errorBox) {
        errorBox.textContent =
          "Preencha o e-mail e a senha.";
      }
      return;
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error(error);

      if (errorBox) {
        errorBox.textContent =
          error.message || "Erro ao entrar.";
      }

      return;
    }

    const profile = await ensureProfile();

    const type = String(profile?.tipo_usuario || "")
      .trim()
      .toLowerCase();

    if (adminTypes.includes(type)) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  });
}

async function setupSignup() {
  const form = document.querySelector("#signupForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome =
      document.querySelector("#signupNome")?.value.trim();

    const email =
      document.querySelector("#signupEmail")?.value.trim();

    const password =
      document.querySelector("#signupPassword")?.value;

    const errorBox =
      document.querySelector("#signupError");

    if (errorBox) {
      errorBox.textContent = "";
    }

    if (!nome || !email || !password) {
      if (errorBox) {
        errorBox.textContent =
          "Preencha todos os campos.";
      }
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password
      });

    if (error) {
      console.error(error);

      if (errorBox) {
        errorBox.textContent =
          error.message || "Erro ao criar conta.";
      }

      return;
    }

    const user = data?.user;

    if (!user) {
      if (errorBox) {
        errorBox.textContent =
          "Não foi possível criar o usuário.";
      }
      return;
    }

    const { error: profileError } =
      await supabase
        .from("usuario")
        .insert({
          id: user.id,
          nome: nome,
          tipo_usuario: "cliente"
        });

    if (profileError) {
      console.error(
        "Erro ao criar perfil:",
        profileError
      );

      if (errorBox) {
        errorBox.textContent =
          "Conta criada, mas houve um erro ao criar o perfil.";
      }

      return;
    }

    window.location.href = "login.html";
  });
}

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao sair:", error);
    return;
  }

  window.location.href = "index.html";
}

async function adminStats() {
  const tables = [
    "usuario",
    "produtos",
    "servicos",
    "solicitações_servico"
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", {
        count: "exact",
        head: true
      });

    if (error) {
      console.error(
        `Erro ao contar ${table}:`,
        error
      );
      continue;
    }

    const element =
      document.querySelector(
        `[data-count="${table}"]`
      );

    if (element) {
      element.textContent = count ?? 0;
    }
  }
}

async function adminUsers() {
  const container =
    document.querySelector("#adminUsuariosLista");

  if (!container) return;

  const { data, error } =
    await supabase
      .from("usuario")
      .select("*")
      .order("nome", {
        ascending: true
      });

  if (error) {
    console.error(
      "Erro ao carregar usuários:",
      error
    );

    container.innerHTML =
      "<p>Erro ao carregar usuários.</p>";

    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML =
      "<p>Nenhum usuário encontrado.</p>";
    return;
  }

  container.innerHTML = data
    .map((user) => {
      const type = String(
        user.tipo_usuario || "cliente"
      )
        .trim()
        .toLowerCase();

      const isSolicitante =
        type === "solicitante_admin";

      const isUserAdmin =
        adminTypes.includes(type);

      let action = "";

      if (isSolicitante) {
        action = `
          <button
            class="btn-aprovar-admin"
            data-user-id="${user.id}"
            data-action="aprovar"
          >
            Aprovar administrador
          </button>

          <button
            class="btn-recusar-admin"
            data-user-id="${user.id}"
            data-action="recusar"
          >
            Recusar
          </button>
        `;
      }

      return `
        <div class="admin-user-card">
          <div>
            <strong>
              ${user.nome || "Sem nome"}
            </strong>

            <span>
              ${user.tipo_usuario || "cliente"}
            </span>
          </div>

          ${
            isUserAdmin
              ? `<span class="admin-badge">Administrador</span>`
              : action
          }
        </div>
      `;
    })
    .join("");

  bindUserActions();
}

function bindUserActions() {
  document
    .querySelectorAll("[data-action]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const userId =
          button.dataset.userId;

        const action =
          button.dataset.action;

        if (!userId || !action) return;

        let newType = "cliente";

        if (action === "aprovar") {
          newType = "admin";
        }

        const { error } =
          await supabase
            .from("usuario")
            .update({
              tipo_usuario: newType
            })
            .eq("id", userId);

        if (error) {
          console.error(
            "Erro ao atualizar usuário:",
            error
          );

          alert(
            "Não foi possível atualizar o usuário."
          );

          return;
        }

        await adminUsers();
      });
    });
}

async function requireAdmin() {
  const profile = await ensureProfile();

  if (!profile || !isAdmin(profile)) {
    window.location.href = "index.html";
    return false;
  }

  return true;
}

async function account() {
  const container =
    document.querySelector("#accountContent");

  if (!container) return;

  const { data: { user }, error } =
    await supabase.auth.getUser();

  if (error || !user) {
    container.innerHTML = `
      <p>Você precisa estar logado.</p>
    `;
    return;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("usuario")
      .select("tipo_usuario")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "Erro ao carregar conta:",
      profileError
    );
  }

  const type = String(
    profile?.tipo_usuario || "cliente"
  )
    .trim()
    .toLowerCase();

  let typeLabel = "Visualizador";

  if (
    type === "admin" ||
    type === "administrador"
  ) {
    typeLabel = "Administrador";
  } else if (
    type === "solicitante_admin"
  ) {
    typeLabel = "Solicitação de administrador";
  }

  container.innerHTML = `
    <div class="account-card">
      <h2>Minha conta</h2>

      <p>
        <strong>E-mail:</strong>
        ${user.email || ""}
      </p>

      <p>
        <strong>Tipo de conta:</strong>
        ${typeLabel}
      </p>

      <button id="logoutButton">
        Sair
      </button>
    </div>
  `;

  const logoutButton =
    document.querySelector("#logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      logout
    );
  }
}

async function requestAdminAccess() {
  const { data: { user }, error } =
    await supabase.auth.getUser();

  if (error || !user) {
    alert(
      "Você precisa estar logado para solicitar acesso."
    );
    return;
  }

  const { error: updateError } =
    await supabase
      .from("usuario")
      .update({
        tipo_usuario: "solicitante_admin"
      })
      .eq("id", user.id);

  if (updateError) {
    console.error(
      "Erro ao solicitar administrador:",
      updateError
    );

    alert(
      "Não foi possível enviar a solicitação."
    );

    return;
  }

  alert(
    "Sua solicitação de administrador foi enviada."
  );

  await account();
}

async function setupAdminRequestButton() {
  const button =
    document.querySelector(
      "#requestAdminButton"
    );

  if (!button) return;

  button.addEventListener(
    "click",
    requestAdminAccess
  );
}

async function loadAdminPage() {
  const isAllowed =
    await requireAdmin();

  if (!isAllowed) return;

  await adminStats();
  await adminUsers();
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await updateNav();

    await setupLogin();
    await setupSignup();

    await setupAdminRequestButton();

    await account();

    if (
      document.querySelector(
        "#adminUsuariosLista"
      )
    ) {
      await loadAdminPage();
    }

    const logoutButton =
      document.querySelector(
        "#logoutButton"
      );

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        logout
      );
    }
  }
);

supabase.auth.onAuthStateChange(
  async () => {
    await updateNav();
  }
);
