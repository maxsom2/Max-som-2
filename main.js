/* =========================================================
   MAX SOM
   MAIN.JS
   Sistema principal
   ========================================================= */


/* =========================================================
   1. SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://diabhunpflawknocixit.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";

var supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   2. CONFIGURAÇÕES GERAIS
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
  MENSAGENS: "mensagens",
  ARQUIVOS: "arquivos",
  NOTIFICACOES: "notificacoes",
  PROJETOS: "projetos",
  PUBLICACOES: "publicacoes"
};


/* =========================================================
   3. ESTADO ATUAL
   ========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   4. FUNÇÕES AUXILIARES
   ========================================================= */

function qs(...selectors) {
  return (
    selectors
      .map((selector) => document.querySelector(selector))
      .find(Boolean) || null
  );
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
  return String(type || "")
    .trim()
    .toLowerCase();
}


function isAdmin(profile = currentProfile) {
  const type =
    normalizeType(profile?.tipo_usuario);

  return ADMIN_TYPES.includes(type);
}


function isLoggedIn() {
  return !!currentUser;
}


function formatDate(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


function formatDateTime(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


/* =========================================================
   5. USUÁRIO / PERFIL
   ========================================================= */

async function ensureProfile() {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {

    currentUser = null;
    currentProfile = null;

    return null;
  }

  currentUser = user;

  const {
    data,
    error
  } = await supabase
    .from(TABLES.USUARIO)
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {

    console.error(
      "Erro ao buscar perfil:",
      error
    );

    currentProfile = null;

    return null;
  }

  currentProfile = data || null;

  return currentProfile;
}
/* =========================================================
   6. NAVEGAÇÃO
   ========================================================= */

async function updateNav() {

  const profile =
    await ensureProfile();

  const adminLink =
    qs("#adminLink", "[data-admin-only]");

  const accountLink =
    qs("#accountLink", "[data-logged-only]");

  const loginLink =
    qs("#loginLink", "[data-guest-only]");

  const conversationsLink =
    qs("#conversationsLink", "[data-conversations-link]");

  const signupLink =
    qs("#signupLink", "[data-signup-link]");

  const logoutLinks =
    document.querySelectorAll(
      "[data-logout], #logoutLink"
    );


  /* ADMIN */

  if (adminLink) {

    adminLink.style.display =
      isAdmin(profile)
        ? ""
        : "none";
  }


  /* LOGIN / CONTA / CADASTRO */

  if (profile) {

    if (loginLink) {
      loginLink.style.display = "none";
    }

    if (signupLink) {
      signupLink.style.display = "none";
    }

    if (accountLink) {
      accountLink.style.display = "";
    }

    if (conversationsLink) {
      conversationsLink.style.display = "";
    }

  } else {

    if (loginLink) {
      loginLink.style.display = "";
    }

    if (signupLink) {
      signupLink.style.display = "";
    }

    if (accountLink) {
      accountLink.style.display = "none";
    }

    if (conversationsLink) {
      conversationsLink.style.display = "none";
    }
  }

  logoutLinks.forEach((element) => {

    element.style.display =
      profile ? "" : "none";

    if (!element.dataset.logoutBound) {

      element.dataset.logoutBound = "true";

      element.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          logout();
        }
      );
    }
  });
}


/* =========================================================
   7. LOGIN
   ========================================================= */

async function setupLogin() {

  const form =
    qs("#loginForm", "#formLogin");

  if (!form) return;


  if (form.dataset.loginBound === "true") {
    return;
  }

  form.dataset.loginBound = "true";


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        qs("#loginEmail", "#email")
          ?.value
          .trim();


      const password =
        qs("#loginPassword", "#senha")
          ?.value;


      const errorBox =
        qs("#loginError", "#mensagemLogin");


      if (errorBox) {

        errorBox.textContent = "";

        errorBox.classList.add("hidden");
      }


      if (!email || !password) {

        if (errorBox) {

          errorBox.textContent =
            "Preencha o e-mail e a senha.";

          errorBox.classList.remove("hidden");
        }

        return;
      }


      const {
        data,
        error
      } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });


      if (error) {

        console.error(
          "Erro no login:",
          error
        );


        if (errorBox) {

          errorBox.textContent =
            "E-mail ou senha incorretos. Verifique os dados e tente novamente.";

          errorBox.classList.remove("hidden");
        }

        return;
      }


      if (errorBox) {

        errorBox.textContent =
          "Login realizado com sucesso!";

        errorBox.classList.remove("hidden");
      }


      const profile =
        await ensureProfile();


if (isAdmin(profile)) {

  window.location.href =
    "admin.html";

} else {

  window.location.href =
    "conta.html";
}

  });
}


/* =========================================================
   8. CADASTRO
   ========================================================= */

async function setupSignup() {

  const form =
    qs("#signupForm", "#formCadastro");

  if (!form) return;


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const nome =
        qs("#signupNome", "#nome")
          ?.value
          .trim();

      const email =
        qs("#signupEmail", "#email")
          ?.value
          .trim();

      const password =
        qs("#signupPassword", "#senha")
          ?.value;

      const errorBox =
        qs("#signupError", "#mensagemCadastro");


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


      const {
        data,
        error
      } =
        await supabase.auth.signUp({
          email,
          password
        });


      if (error) {

        console.error(error);

        if (errorBox) {

          errorBox.textContent =
            error.message ||
            "Erro ao criar conta.";
        }

        return;
      }


      const user =
        data?.user;


      if (!user) {

        if (errorBox) {

          errorBox.textContent =
            "Não foi possível criar o usuário.";
        }

        return;
      }


      const {
        error: profileError
      } =
        await supabase
          .from(TABLES.USUARIO)
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


      window.location.href =
        "login.html";
    }
  );
}


/* =========================================================
   9. LOGOUT
   ========================================================= */

async function logout() {

  const {
    error
  } =
    await supabase.auth.signOut();


  if (error) {

    console.error(
      "Erro ao sair:",
      error
    );

    return;
  }


  currentUser = null;
  currentProfile = null;

  window.location.href =
    "index.html";
}


/* =========================================================
   10. PROTEÇÃO DO PAINEL
   ========================================================= */

async function requireAdmin() {

  const profile =
    await ensureProfile();


  if (!profile || !isAdmin(profile)) {

    window.location.href =
      "index.html";

    return false;
  }


  return true;
}


/* =========================================================
   11. ESTATÍSTICAS DO ADMIN
   ========================================================= */

async function adminStats() {

  const tables = [

    {
      table: TABLES.USUARIO,
      selector: "usuario"
    },

    {
      table: TABLES.PRODUTOS,
      selector: "produtos"
    },

    {
      table: TABLES.SERVICOS,
      selector: "servicos"
    },

    {
      table: TABLES.SOLICITACOES,
      selector: "solicitações_servico"
    },

    {
      table: TABLES.CONVERSAS,
      selector: "conversas"
    },

    {
      table: TABLES.MENSAGENS,
      selector: "mensagens"
    }
  ];


  for (const item of tables) {

    const {
      count,
      error
    } =
      await supabase
        .from(item.table)
        .select("*", {
          count: "exact",
          head: true
        });


    if (error) {

      console.error(
        `Erro ao contar ${item.table}:`,
        error
      );

      continue;
    }


    const element =
      document.querySelector(
        `[data-count="${item.selector}"]`
      );


    if (element) {

      element.textContent =
        count ?? 0;
    }
  }
}


/* =========================================================
   12. USUÁRIOS DO ADMIN
   ========================================================= */

async function adminUsers() {

  const container =
    document.querySelector(
      "#adminUsuariosLista"
    );

  if (!container) return;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.USUARIO)
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


  if (!data?.length) {

    container.innerHTML =
      "<p>Nenhum usuário encontrado.</p>";

    return;
  }


  container.innerHTML =
    data
      .map((user) => {

        const type =
          normalizeType(
            user.tipo_usuario ||
            "cliente"
          );


        const isSolicitante =
          type ===
          "solicitante_admin";


        const userIsAdmin =
          ADMIN_TYPES.includes(type);


        let action = "";


        if (isSolicitante) {

          action = `

            <div class="admin-user-actions">

              <button
                class="btn-aprovar-admin"
                data-user-id="${esc(user.id)}"
                data-action="aprovar"
              >
                Aprovar administrador
              </button>

              <button
                class="btn-recusar-admin"
                data-user-id="${esc(user.id)}"
                data-action="recusar"
              >
                Recusar
              </button>

            </div>

          `;
        }


        return `

          <div class="admin-user-card">

            <div class="admin-user-info">

              <strong>
                ${esc(
                  user.nome ||
                  "Sem nome"
                )}
              </strong>

              <span>
                ${esc(
                  user.tipo_usuario ||
                  "cliente"
                )}
              </span>

            </div>


            ${
              userIsAdmin

                ? `
                  <span class="admin-badge">
                    Administrador
                  </span>
                `

                : action
            }

          </div>

        `;
      })
      .join("");


  bindUserActions();
}


/* =========================================================
   13. AÇÕES DOS USUÁRIOS
   ========================================================= */

function bindUserActions() {

  document
    .querySelectorAll(
      "[data-action]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const userId =
            button.dataset.userId;

          const action =
            button.dataset.action;


          if (!userId || !action) {
            return;
          }


          let newType =
            "cliente";


          if (action === "aprovar") {
            newType = "admin";
          }


          const {
            error
          } =
            await supabase
              .from(TABLES.USUARIO)
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
        }
      );
    });
}


/* =========================================================
   14. CONTA DO CLIENTE
   ========================================================= */

async function account() {

  const legacyContainer =
    document.querySelector("#accountContent");

  const accountPage =
    document.querySelector(".account-page") ||
    document.querySelector("[data-account-page]");

  if (!legacyContainer && !accountPage) return;


  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

    if (legacyContainer) {

      legacyContainer.innerHTML = `
        <p>Você precisa estar logado.</p>
      `;
    }

    return;
  }


  const type =
    normalizeType(
      profile.tipo_usuario ||
      "cliente"
    );


  let typeLabel =
    "Cliente";


  if (isAdmin(profile)) {

    typeLabel =
      "Administrador";

  } else if (
    type ===
    "solicitante_admin"
  ) {

    typeLabel =
      "Solicitação de administrador";
  }


  /*
   * A conta atual usa elementos já existentes
   * no HTML. Não substituímos o conteúdo da página,
   * para não apagar as solicitações e conversas.
   */

  const title =
    document.querySelector(
      "#contaNomeTitulo"
    );

  const name =
    document.querySelector(
      "#contaNome"
    );

  const email =
    document.querySelector(
      "#contaEmail"
    );

  const phone =
    document.querySelector(
      "#contaTelefone"
    );

  const typeElement =
    document.querySelector(
      "#contaTipo"
    );


  const displayName =
    profile.nome ||
    currentUser.email ||
    "Usuário";


  if (title) {
    title.textContent =
      displayName;
  }

  if (name) {
    name.textContent =
      displayName;
  }

  if (email) {
    email.textContent =
      currentUser.email ||
      "-";
  }

  if (phone) {

    phone.textContent =
      profile.telefone ||
      profile.whatsapp ||
      "-";
  }

  if (typeElement) {

    typeElement.textContent =
      typeLabel;
  }


  /* Compatibilidade com versões antigas da conta */

  if (legacyContainer) {

    legacyContainer.innerHTML = `
      <div class="account-card">

        <div class="account-header">

          <div>

            <span class="account-label">
              Minha conta
            </span>

            <h2>
              ${esc(displayName)}
            </h2>

          </div>

        </div>


        <div class="account-info">

          <p>
            <strong>E-mail</strong>
            ${esc(currentUser.email || "")}
          </p>

          <p>
            <strong>Tipo de conta</strong>
            ${esc(typeLabel)}
          </p>

        </div>


        <div class="account-actions">

          <a
            href="conversas.html"
            class="btn-primary"
          >
            Minhas conversas
          </a>

          <button
            id="logoutButton"
            class="btn-secondary"
            type="button"
          >
            Sair
          </button>

        </div>

      </div>
    `;
  }
}


/* =========================================================
   15. SOLICITAÇÃO DE ADMINISTRADOR
   ========================================================= */

async function requestAdminAccess() {

  const {
    data: { user },
    error
  } =
    await supabase.auth.getUser();


  if (error || !user) {

    alert(
      "Você precisa estar logado para solicitar acesso."
    );

    return;
  }


  const {
    error: updateError
  } =
    await supabase
      .from(TABLES.USUARIO)
      .update({
        tipo_usuario:
          "solicitante_admin"
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


/* =========================================================
   16. BOTÃO DE SOLICITAÇÃO
   ========================================================= */

function setupAdminRequestButton() {

  const button =
    qs(
      "#requestAdminButton",
      "#btnAdminRequest",
      "[data-request-admin]"
    );

  if (!button) return;

  if (button.dataset.bound === "true") return;

  button.dataset.bound = "true";

  button.addEventListener(
    "click",
    requestAdminAccess
  );
}


/* =========================================================
   17. CONVERSAS
   ========================================================= */

/*
  A privacidade das conversas não depende do JavaScript.
  O Supabase RLS deve permitir somente que participantes
  autorizados leiam cada conversa e suas mensagens.
*/

async function loadConversations() {

  const container =
    qs(
      "#conversasLista",
      "#conversationsList",
      "#conversationList"
    );

  if (!container) return;


  const profile =
    await ensureProfile();

  if (!profile || !currentUser) {

    container.innerHTML = `
      <div class="empty">
        Faça login para visualizar suas conversas.
      </div>
    `;

    return;
  }


  const {
    data,
    error
  } =
    await supabase
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
      .order(
        "atualizado_em",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar conversas:",
      error
    );

    container.innerHTML = `
      <div class="empty">
        Não foi possível carregar suas conversas.
      </div>
    `;

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Nenhuma conversa ainda
        </h3>

        <p>
          Quando você iniciar um atendimento,
          sua conversa aparecerá aqui.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (conversation) => `

          <a
            href="conversa.html?id=${encodeURIComponent(
              conversation.id
            )}"
            class="conversation-card"
          >

            <div class="conversation-card-content">

              <div>

                <h3>
                  ${esc(
                    conversation.assunto ||
                    "Atendimento Max Som"
                  )}
                </h3>

                <span>
                  ${esc(
                    conversation.status ||
                    "aberta"
                  )}
                </span>

              </div>


              <time>
                ${esc(
                  formatDateTime(
                    conversation.atualizado_em ||
                    conversation.criado_em
                  )
                )}
              </time>

            </div>

          </a>

        `
      )
      .join("");
}
/* =========================================================
   18. CONVERSA INDIVIDUAL
   ========================================================= */

async function loadConversation() {

  const container =
    qs(
      "#conversaContainer",
      "#conversationContainer",
      "#conversa"
    );

  if (!container) return;


  const params =
    new URLSearchParams(
      window.location.search
    );

  const conversationId =
    params.get("id");


  if (!conversationId) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Conversa não encontrada
        </h3>

        <p>
          Nenhuma conversa foi selecionada.
        </p>

      </div>
    `;

    return;
  }


  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Faça login
        </h3>

        <p>
          Você precisa estar logado para acessar esta conversa.
        </p>

      </div>
    `;

    return;
  }


  const {
    data: conversation,
    error
  } =
    await supabase
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
      .eq(
        "id",
        conversationId
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Erro ao buscar conversa:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Erro ao carregar conversa
        </h3>

      </div>
    `;

    return;
  }


  if (!conversation) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Conversa não encontrada
        </h3>

      </div>
    `;

    return;
  }


  const participant =
    conversation.cliente_id === currentUser.id ||
    conversation.funcionario_id === currentUser.id;


  if (!participant && !isAdmin(profile)) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Acesso não permitido
        </h3>

        <p>
          Você não participa desta conversa.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="conversation-header">

      <div>

        <a
          href="conversas.html"
          class="conversation-back"
        >
          ← Voltar
        </a>

        <h1>
          ${esc(
            conversation.assunto ||
            "Atendimento Max Som"
          )}
        </h1>

        <span class="conversation-status">
          ${esc(
            conversation.status ||
            "aberta"
          )}
        </span>

      </div>

    </div>


    <div
      id="mensagensLista"
      class="messages-list"
    ></div>


    <form
      id="mensagemForm"
      class="message-form"
    >

      <textarea
        id="mensagemConteudo"
        name="mensagem"
        rows="3"
        placeholder="Digite sua mensagem..."
        required
      ></textarea>


      <button
        type="submit"
        class="btn-primary"
      >
        Enviar mensagem
      </button>

    </form>

  `;


  await loadMessages(
    conversationId
  );


  setupMessageForm(
    conversationId
  );
}


/* =========================================================
   19. MENSAGENS
   ========================================================= */

async function loadMessages(
  conversationId
) {

  const container =
    qs(
      "#mensagensLista",
      "#messagesList",
      "#messagesContainer"
    );

  if (!container) return;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.MENSAGENS)
      .select(`
        id,
        conversa_id,
        remetente_id,
        conteudo,
        lida,
        criado_em
      `)
      .eq(
        "conversa_id",
        conversationId
      )
      .order(
        "criado_em",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar mensagens:",
      error
    );

    container.innerHTML = `
      <div class="empty">
        Não foi possível carregar as mensagens.
      </div>
    `;

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">

        <p>
          Nenhuma mensagem ainda.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (message) => {

          const own =
            message.remetente_id ===
            currentUser?.id;


          return `

            <div
              class="
                message
                ${own ? "message-own" : "message-other"}
              "
            >

              <div class="message-bubble">

                <p>
                  ${esc(
                    message.conteudo
                  )}
                </p>

                <time>
                  ${esc(
                    formatDateTime(
                      message.criado_em
                    )
                  )}
                </time>

              </div>

            </div>

          `;
        }
      )
      .join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   20. ENVIO DE MENSAGEM
   ========================================================= */

function setupMessageForm(
  conversationId
) {

  const form =
    qs(
      "#mensagemForm",
      "#messageForm"
    );

  if (!form) return;


  if (
    form.dataset.bound ===
    conversationId
  ) {
    return;
  }


  form.dataset.bound =
    conversationId;


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const input =
        qs(
          "#mensagemConteudo",
          "#messageContent"
        );


      const content =
        input?.value.trim();


      if (!content) {
        return;
      }


      if (!currentUser) {

        alert(
          "Você precisa estar logado."
        );

        return;
      }


      const button =
        form.querySelector(
          "button[type='submit']"
        );


      if (button) {
        button.disabled = true;
      }


      const {
        error
      } =
        await supabase
          .from(TABLES.MENSAGENS)
          .insert({

            conversa_id:
              conversationId,

            remetente_id:
              currentUser.id,

            conteudo:
              content,

            lida:
              false

          });


      if (error) {

        console.error(
          "Erro ao enviar mensagem:",
          error
        );

        alert(
          "Não foi possível enviar a mensagem."
        );

      } else {

        input.value = "";

        await loadMessages(
          conversationId
        );
      }


      if (button) {
        button.disabled = false;
      }
    }
  );
}


/* =========================================================
   21. CRIAR CONVERSA
   ========================================================= */

async function createConversation(
  assunto = "Atendimento Max Som"
) {

  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

    alert(
      "Você precisa estar logado para iniciar uma conversa."
    );

    return null;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.CONVERSAS)
      .insert({

        cliente_id:
          currentUser.id,

        assunto:
          assunto,

        status:
          "aberta"

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Erro ao criar conversa:",
      error
    );

    alert(
      "Não foi possível criar a conversa."
    );

    return null;
  }


  return data;
}


/* =========================================================
   22. ABRIR CONVERSA
   ========================================================= */

async function openConversation(
  assunto
) {

  const conversation =
    await createConversation(
      assunto
    );


  if (!conversation) {
    return;
  }


  window.location.href =
    `conversa.html?id=${encodeURIComponent(
      conversation.id
    )}`;
}


/* =========================================================
   23. TEMPO REAL DAS MENSAGENS
   ========================================================= */

function setupMessageRealtime() {

  if (!currentUser) return;


  if (
    window.maxSomMessageChannel
  ) {

    supabase.removeChannel(
      window.maxSomMessageChannel
    );
  }


  window.maxSomMessageChannel =
    supabase
      .channel(
        "maxsom-mensagens"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLES.MENSAGENS
        },
        async (payload) => {

          const params =
            new URLSearchParams(
              window.location.search
            );

          const conversationId =
            params.get("id");


          if (!conversationId) {
            return;
          }


          const changedConversation =
            payload.new?.conversa_id ||
            payload.old?.conversa_id;


          if (
            changedConversation !==
            conversationId
          ) {
            return;
          }


          await loadMessages(
            conversationId
          );
        }
      )
      .subscribe();
}


/* =========================================================
   24. TEMPO REAL DAS CONVERSAS
   ========================================================= */

function setupConversationRealtime() {

  if (!currentUser) return;


  if (
    window.maxSomConversationChannel
  ) {

    supabase.removeChannel(
      window.maxSomConversationChannel
    );
  }


  window.maxSomConversationChannel =
    supabase
      .channel(
        "maxsom-conversas"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLES.CONVERSAS
        },
        async () => {

          if (
            document.querySelector(
              "#conversasLista"
            ) ||
            document.querySelector(
              "#conversationsList"
            )
          ) {

            await loadConversations();
          }
        }
      )
      .subscribe();
}


/* =========================================================
   25. PRODUTOS PÚBLICOS
   ========================================================= */

async function loadPublicProducts() {

  const container =
    qs(
      "#produtosLista",
      "#productsList",
      "#produtosContainer"
    );

  if (!container) return;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.PRODUTOS)
      .select("*")
      .order(
        "nome",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar produtos:",
      error
    );

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Nenhum produto cadastrado
        </h3>

      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (product) => `

          <article class="product-card">

            ${
              product.imagem_url

                ? `
                  <img
                    src="${esc(
                      product.imagem_url
                    )}"
                    alt="${esc(
                      product.nome ||
                      "Produto Max Som"
                    )}"
                    loading="lazy"
                  >
                `

                : `
                  <div class="product-placeholder">
                    Max Som
                  </div>
                `
            }


            <div class="product-card-content">

              <h3>
                ${esc(
                  product.nome ||
                  "Produto"
                )}
              </h3>

              ${
                product.descricao

                  ? `
                    <p>
                      ${esc(
                        product.descricao
                      )}
                    </p>
                  `

                  : ""
              }

            </div>

          </article>

        `
      )
      .join("");
}


/* =========================================================
   26. SERVIÇOS PÚBLICOS
   ========================================================= */

async function loadPublicServices() {

  const container =
    qs(
      "#servicosLista",
      "#servicesList",
      "#servicosContainer"
    );

  if (!container) return;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.SERVICOS)
      .select("*")
      .order(
        "nome",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar serviços:",
      error
    );

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Nenhum serviço cadastrado
        </h3>

      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (service) => `

          <article class="service-card">

            ${
              service.imagem_url

                ? `
                  <img
                    src="${esc(
                      service.imagem_url
                    )}"
                    alt="${esc(
                      service.nome ||
                      "Serviço Max Som"
                    )}"
                    loading="lazy"
                  >
                `

                : ""
            }


            <div class="service-card-content">

              <h3>
                ${esc(
                  service.nome ||
                  "Serviço"
                )}
              </h3>

              ${
                service.descricao

                  ? `
                    <p>
                      ${esc(
                        service.descricao
                      )}
                    </p>
                  `

                  : ""
              }


              <button
                type="button"
                class="btn-primary"
                data-service-name="${esc(
                  service.nome ||
                  "Atendimento"
                )}"
              >
                Solicitar atendimento
              </button>

            </div>

          </article>

        `
      )
      .join("");


  container
    .querySelectorAll(
      "[data-service-name]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const serviceName =
            button.dataset.serviceName ||
            "Atendimento";

          window.location.href =
            `atendimento.html?servico=${encodeURIComponent(
              serviceName
            )}`;
        }
      );
    });
}


/* =========================================================
   27. PROJETOS PÚBLICOS
   ========================================================= */

async function loadPublicProjects() {

  const container =
    qs(
      "#projetosLista",
      "#projectsList",
      "#projetosContainer"
    );

  if (!container) return;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.PROJETOS)
      .select("*")
      .order(
        "criado_em",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar projetos:",
      error
    );

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Nenhum projeto cadastrado
        </h3>

      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (project) => `

          <article class="project-card">

            ${
              project.imagem_url

                ? `
                  <img
                    src="${esc(
                      project.imagem_url
                    )}"
                    alt="${esc(
                      project.nome ||
                      "Projeto Max Som"
                    )}"
                    loading="lazy"
                  >
                `

                : ""
            }


            <div class="project-card-content">

              <h3>
                ${esc(
                  project.nome ||
                  "Projeto"
                )}
              </h3>

              ${
                project.descricao

                  ? `
                    <p>
                      ${esc(
                        project.descricao
                      )}
                    </p>
                  `

                  : ""
              }

            </div>

          </article>

        `
      )
      .join("");
}
/* =========================================================
   28. PUBLICAÇÕES
   ========================================================= */

async function loadPublications() {

  const container =
    qs(
      "#publicacoesLista",
      "#publicationsList",
      "#publicacoesContainer"
    );

  if (!container) return;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.PUBLICACOES)
      .select("*")
      .order(
        "criado_em",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar publicações:",
      error
    );

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-state">

        <h3>
          Nenhuma publicação cadastrada
        </h3>

      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (publication) => `

          <article class="publication-card">

            ${
              publication.imagem_url

                ? `
                  <img
                    src="${esc(
                      publication.imagem_url
                    )}"
                    alt="${esc(
                      publication.titulo ||
                      "Publicação Max Som"
                    )}"
                    loading="lazy"
                  >
                `

                : ""
            }


            <div class="publication-card-content">

              <h3>
                ${esc(
                  publication.titulo ||
                  "Publicação"
                )}
              </h3>


              ${
                publication.resumo

                  ? `
                    <p>
                      ${esc(
                        publication.resumo
                      )}
                    </p>
                  `

                  : publication.conteudo

                    ? `
                      <p>
                        ${esc(
                          publication.conteudo
                        )}
                      </p>
                    `

                    : ""
              }


              ${
                publication.criado_em

                  ? `
                    <time>
                      ${esc(
                        formatDate(
                          publication.criado_em
                        )
                      )}
                    </time>
                  `

                  : ""
              }

            </div>

          </article>

        `
      )
      .join("");
}


/* =========================================================
   29. LINKS DE SERVIÇOS
   ========================================================= */

function setupServiceLinks() {

  document
    .querySelectorAll(
      "[data-service]"
    )
    .forEach((element) => {

      if (
        element.dataset.serviceBound ===
        "true"
      ) {
        return;
      }


      element.dataset.serviceBound =
        "true";


      element.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          const service =
            element.dataset.service ||
            element.textContent.trim();


          window.location.href =
            `atendimento.html?servico=${encodeURIComponent(
              service
            )}`;
        }
      );
    });
}


/* =========================================================
   30. WHATSAPP
   ========================================================= */

function setupWhatsApp() {

  const phone =
    "5565996262514";


  document
    .querySelectorAll(
      "[data-whatsapp]"
    )
    .forEach((element) => {

      if (
        element.dataset.whatsappBound ===
        "true"
      ) {
        return;
      }


      element.dataset.whatsappBound =
        "true";


      element.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          const message =
            element.dataset.whatsappMessage ||
            "Olá! Gostaria de falar com a Max Som.";


          const url =
            `https://wa.me/${phone}?text=${encodeURIComponent(
              message
            )}`;


          window.open(
            url,
            "_blank"
          );
        }
      );
    });
}


/* =========================================================
   31. FORMULÁRIO DE CONTATO
   ========================================================= */

function setupContactForm() {

  const form =
    qs(
      "#contactForm",
      "#formContato",
      "#contatoForm"
    );

  if (!form) return;


  if (
    form.dataset.bound ===
    "true"
  ) {
    return;
  }


  form.dataset.bound =
    "true";


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const nome =
        qs(
          "#contactNome",
          "#nomeContato",
          "#nome"
        )?.value.trim();


      const email =
        qs(
          "#contactEmail",
          "#emailContato",
          "#email"
        )?.value.trim();


      const telefone =
        qs(
          "#contactTelefone",
          "#telefoneContato",
          "#telefone"
        )?.value.trim();


      const mensagem =
        qs(
          "#contactMensagem",
          "#mensagemContato",
          "#mensagem"
        )?.value.trim();


      const feedback =
        qs(
          "#contactFeedback",
          "#mensagemContatoFeedback"
        );


      if (!mensagem) {

        if (feedback) {

          feedback.textContent =
            "Digite uma mensagem.";
        }

        return;
      }


      /*
       * O formulário de contato não envia
       * automaticamente para uma tabela que
       * não esteja confirmada no banco.
       *
       * Ele direciona o atendimento para
       * o WhatsApp oficial da empresa.
       */


      const text =
        [
          "Olá! Vim pelo site da Max Som.",
          nome
            ? `Nome: ${nome}`
            : "",
          email
            ? `E-mail: ${email}`
            : "",
          telefone
            ? `Telefone: ${telefone}`
            : "",
          `Mensagem: ${mensagem}`
        ]
          .filter(Boolean)
          .join("\n");


      const url =
        `https://wa.me/5565996262514?text=${encodeURIComponent(
          text
        )}`;


      window.open(
        url,
        "_blank"
      );


      if (feedback) {

        feedback.textContent =
          "Mensagem preparada para o WhatsApp.";
      }
    }
  );
}


/* =========================================================
   32. PÁGINA ATUAL
   ========================================================= */

function getCurrentPage() {

  const path =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();


  return path ||
    "index.html";
}


/* =========================================================
   33. BOTÕES CANCELAR
   ========================================================= */

function setupCancelButtons() {

  const buttons = [

    "#produtoCancelar",

    "#servicoCancelar",

    "#projetoCancelar",

    "#publicacaoCancelar",

    "#cancelarProduto",

    "#cancelarServico",

    "#cancelarProjeto",

    "#cancelarPublicacao"

  ];


  buttons.forEach(
    (selector) => {

      const button =
        document.querySelector(
          selector
        );


      if (!button) return;


      if (
        button.dataset.cancelBound ===
        "true"
      ) {
        return;
      }


      button.dataset.cancelBound =
        "true";


      button.addEventListener(
        "click",
        () => {

          const form =
            button.closest(
              "form"
            );


          if (form) {
            form.reset();
          }


          document
            .querySelectorAll(
              ".modal.open, .modal.active, .admin-modal.open"
            )
            .forEach(
              (modal) => {

                modal.classList.remove(
                  "open",
                  "active"
                );
              }
            );
        }
      );
    }
  );
}


/* =========================================================
   34. ADMIN
   ========================================================= */

async function adminMain() {

  const page =
    document.querySelector(
      ".admin-page"
    ) ||
    document.querySelector(
      "[data-admin-page]"
    );


  if (!page) return;


  const allowed =
    await requireAdmin();


  if (!allowed) {
    return;
  }


  await adminStats();

  await adminUsers();

  setupCancelButtons();
}


/* =========================================================
   35. VERIFICAÇÃO DE PÁGINAS LOGADAS
   ========================================================= */

async function checkLoggedPage() {

  const protectedPages = [

    "conta.html",

    "conversas.html",

    "conversa.html"

  ];


  const page =
    getCurrentPage();


  if (
    !protectedPages.includes(
      page
    )
  ) {
    return;
  }


  const {
    data: { user }
  } =
    await supabase.auth.getUser();


  if (!user) {

    window.location.href =
      "login.html";
  }
}


/* =========================================================
   36. REDIRECIONAMENTO ADMIN
   ========================================================= */

async function redirectAdmin() {

  const page =
    getCurrentPage();


  if (
    page !==
    "login.html"
  ) {
    return;
  }


  const {
    data: { user }
  } =
    await supabase.auth.getUser();


  if (!user) {
    return;
  }


  const profile =
    await ensureProfile();


  if (isAdmin(profile)) {

    window.location.href =
      "admin.html";
  }
}


/* =========================================================
   37. AUTENTICAÇÃO ATUAL
   ========================================================= */

async function initializeAuth() {

  const {
    data: {
      session
    },
    error
  } =
    await supabase.auth.getSession();


  if (error) {

    console.error(
      "Erro ao recuperar sessão:",
      error
    );

    return null;
  }


  if (!session) {

    currentUser = null;
    currentProfile = null;

    await updateNav();

    return null;
  }


  currentUser =
    session.user;


  await ensureProfile();

  await updateNav();


  return currentProfile;
}


/* =========================================================
   38. LISTENER DE AUTENTICAÇÃO
   ========================================================= */

function setupAuthListener() {

  supabase.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      currentUser =
        session?.user ||
        null;


      if (currentUser) {

        await ensureProfile();

      } else {

        currentProfile = null;
      }


      await updateNav();


      if (
        event ===
        "SIGNED_OUT"
      ) {

        const page =
          getCurrentPage();


        if (
          page ===
            "conta.html" ||
          page ===
            "conversas.html" ||
          page ===
            "conversa.html" ||
          page ===
            "admin.html"
        ) {

          window.location.href =
            "login.html";
        }
      }
    }
  );
}


/* =========================================================
   39. REALTIME DAS NOTIFICAÇÕES
   ========================================================= */

function setupNotificationRealtime() {

  if (!currentUser) return;


  if (
    window.maxSomNotificationChannel
  ) {

    supabase.removeChannel(
      window.maxSomNotificationChannel
    );
  }


  window.maxSomNotificationChannel =
    supabase
      .channel(
        "maxsom-notificacoes"
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.NOTIFICACOES,
          filter:
            `usuario_id=eq.${currentUser.id}`
        },
        async () => {

          await loadNotifications();
        }
      )
      .subscribe();
}


/* =========================================================
   40. ATALHOS DO TECLADO
   ========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {

        document
          .querySelectorAll(
            ".modal.open, .modal.active"
          )
          .forEach(
            (modal) => {

              modal.classList.remove(
                "open",
                "active"
              );
            }
          );
      }
    }
  );
}


/* =========================================================
   41. FORMULÁRIOS DO ADMIN
   ========================================================= */

function setupAdminForms() {

  /*
   * Os formulários do painel podem ser
   * controlados pelos atributos data-table
   * e data-action.
   */

  document
    .querySelectorAll(
      "form[data-table]"
    )
    .forEach((form) => {

      if (
        form.dataset.formBound ===
        "true"
      ) {
        return;
      }


      form.dataset.formBound =
        "true";


      form.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();


          const table =
            form.dataset.table;


          const action =
            form.dataset.action ||
            "insert";


          if (!table) {
            return;
          }


          const formData =
            new FormData(form);


          const values = {};


          formData.forEach(
            (
              value,
              key
            ) => {

              if (
                value !==
                ""
              ) {

                values[key] =
                  value;
              }
            }
          );


          let result;


          if (
            action ===
            "update"
          ) {

            const id =
              form.dataset.id;


            if (!id) {
              return;
            }


            result =
              await supabase
                .from(table)
                .update(values)
                .eq(
                  "id",
                  id
                );

          } else {

            result =
              await supabase
                .from(table)
                .insert(values);
          }


          if (result.error) {

            console.error(
              "Erro no formulário admin:",
              result.error
            );

            alert(
              "Não foi possível salvar os dados."
            );

            return;
          }


          alert(
            "Dados salvos com sucesso."
          );


          form.reset();


          await adminStats();
        }
      );
    });
}


/* =========================================================
   42. EXCLUSÃO DE REGISTROS
   ========================================================= */

function setupDeleteButtons() {

  document
    .querySelectorAll(
      "[data-delete-table]"
    )
    .forEach((button) => {

      if (
        button.dataset.deleteBound ===
        "true"
      ) {
        return;
      }


      button.dataset.deleteBound =
        "true";


      button.addEventListener(
        "click",
        async () => {

          const table =
            button.dataset.deleteTable;


          const id =
            button.dataset.deleteId;


          if (
            !table ||
            !id
          ) {
            return;
          }


          const confirmed =
            window.confirm(
              "Tem certeza que deseja excluir este registro?"
            );


          if (!confirmed) {
            return;
          }


          const {
            error
          } =
            await supabase
              .from(table)
              .delete()
              .eq(
                "id",
                id
              );


          if (error) {

            console.error(
              "Erro ao excluir:",
              error
            );

            alert(
              "Não foi possível excluir o registro."
            );

            return;
          }


          button
            .closest(
              "[data-admin-item]"
            )
            ?.remove();


          await adminStats();
        }
      );
    });
}


/* =========================================================
   43. LINKS DA CONTA
   ========================================================= */

function setupAccountLinks() {

  document
    .querySelectorAll(
      "[data-account-link]"
    )
    .forEach(
      (element) => {

        if (
          element.dataset.accountBound ===
          "true"
        ) {
          return;
        }


        element.dataset.accountBound =
          "true";


        element.addEventListener(
          "click",
          async (event) => {

            if (!currentUser) {

              event.preventDefault();

              window.location.href =
                "login.html";
            }
          }
        );
      }
    );
}


/* =========================================================
   44. LINKS ADMIN
   ========================================================= */

function setupAdminLinks() {

  document
    .querySelectorAll(
      "[data-admin-link]"
    )
    .forEach(
      (element) => {

        element.addEventListener(
          "click",
          async (event) => {

            const profile =
              await ensureProfile();


            if (
              !isAdmin(profile)
            ) {

              event.preventDefault();

              alert(
                "Você não possui acesso ao painel administrativo."
              );
            }
          }
        );
      }
    );
}


/* =========================================================
   45. INICIALIZAÇÃO
   ========================================================= */

async function initializePage() {

  await initializeAuth();

  await checkLoggedPage();

  await redirectAdmin();


  setupAuthListener();

  setupKeyboardShortcuts();

  setupServiceLinks();

  setupWhatsApp();

  setupContactForm();

  setupLogin();

  setupSignup();

  setupAdminRequestButton();

  setupAccountLinks();

  setupAdminLinks();

  setupCancelButtons();

  setupAdminForms();

  setupDeleteButtons();


  await account();

  await adminMain();

  await loadConversations();

  await loadConversation();

  await loadPublicProducts();

  await loadPublicServices();

  await loadPublicProjects();

  await loadPublications();


  setupMessageRealtime();

  setupConversationRealtime();

  setupNotificationRealtime();
}


/* =========================================================
   46. NOTIFICAÇÕES
   ========================================================= */

async function loadNotifications() {

  const container =
    qs(
      "#notificacoesLista",
      "#notificationsList",
      "#notificationsContainer"
    );

  if (!container) return;


  if (!currentUser) {

    container.innerHTML = "";

    return;
  }


  const {
    data,
    error
  } =
    await supabase
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
      .eq(
        "usuario_id",
        currentUser.id
      )
      .order(
        "criado_em",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar notificações:",
      error
    );

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty">
        Nenhuma notificação.
      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map(
        (notification) => `

          <article
            class="
              notification-item
              ${
                notification.lida
                  ? "is-read"
                  : "is-unread"
              }
            "
          >

            <div>

              <strong>
                ${esc(
                  notification.titulo ||
                  "Notificação"
                )}
              </strong>

              <p>
                ${esc(
                  notification.mensagem ||
                  ""
                )}
              </p>

            </div>


            ${
              notification.link

                ? `
                  <a
                    href="${esc(
                      notification.link
                    )}"
                  >
                    Abrir
                  </a>
                `

                : ""
            }

          </article>

        `
      )
      .join("");
}


/* =========================================================
   47. SOLICITAÇÃO DE SERVIÇO
   ========================================================= */

async function createServiceRequest(
  serviceName,
  description = ""
) {

  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

    window.location.href =
      "login.html";

    return null;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.SOLICITACOES)
      .insert({

        cliente_id:
          currentUser.id,

        servico:
          serviceName,

        descricao:
          description,

        status:
          "pendente"

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Erro ao criar solicitação:",
      error
    );

    alert(
      "Não foi possível registrar sua solicitação."
    );

    return null;
  }


  return data;
}


/* =========================================================
   48. SOLICITAÇÃO DE ADMIN
   ========================================================= */

async function setupAdminApproval() {

  const button =
    qs(
      "#aprovarAdmin",
      "#aprovarAdministrador"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    async () => {

      const userId =
        button.dataset.userId;


      if (!userId) {
        return;
      }


      const {
        error
      } =
        await supabase
          .from(TABLES.USUARIO)
          .update({
            tipo_usuario:
              "admin"
          })
          .eq(
            "id",
            userId
          );


      if (error) {

        console.error(
          "Erro ao aprovar administrador:",
          error
        );

        alert(
          "Não foi possível aprovar."
        );

        return;
      }


      alert(
        "Usuário aprovado como administrador."
      );


      await adminUsers();
    }
  );
}


/* =========================================================
   49. FUNÇÃO DE ACESSO ADMIN
   ========================================================= */

async function checkAdminAccess() {

  const profile =
    await ensureProfile();


  return isAdmin(
    profile
  );
}


/* =========================================================
   50. FINALIZAÇÃO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      await initializePage();

    } catch (error) {

      console.error(
        "Erro na inicialização do Max Som:",
        error
      );
    }
  }
);
