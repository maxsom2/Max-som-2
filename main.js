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

const supabase =
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
  NOTIFICACOES: "notificacoes"
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

  currentProfile = data;

  return data;
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
    element.style.display = profile ? "" : "none";

    if (!element.dataset.logoutBound) {
      element.dataset.logoutBound = "true";

      element.addEventListener("click", (event) => {
        event.preventDefault();
        logout();
      });
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
      }


      if (!email || !password) {

        if (errorBox) {

          errorBox.textContent =
            "Preencha o e-mail e a senha.";
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

        console.error(error);

        if (errorBox) {

          errorBox.textContent =
            error.message ||
            "Não foi possível entrar.";
        }

        return;
      }


      const profile =
        await ensureProfile();


      if (isAdmin(profile)) {

        window.location.href =
          "admin.html";

      } else {

        window.location.href =
          "index.html";
      }
    }
  );
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

  const container =
    document.querySelector(
      "#accountContent"
    );

  if (!container) return;


  const {
    data: { user },
    error
  } =
    await supabase.auth.getUser();


  if (error || !user) {

    container.innerHTML = `
      <p>Você precisa estar logado.</p>
    `;

    return;
  }


  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from(TABLES.USUARIO)
      .select("*")
      .eq("id", user.id)
      .maybeSingle();


  if (profileError) {

    console.error(
      "Erro ao carregar conta:",
      profileError
    );
  }


  currentUser = user;
  currentProfile = profile;


  const type =
    normalizeType(
      profile?.tipo_usuario ||
      "cliente"
    );


  let typeLabel =
    "Cliente";


  if (isAdmin(profile)) {

    typeLabel =
      "Administrador";

  } else if (
    type === "solicitante_admin"
  ) {

    typeLabel =
      "Solicitação de administrador";
  }


  container.innerHTML = `

    <div class="account-card">

      <div class="account-header">

        <div>

          <span class="account-label">
            Minha conta
          </span>

          <h2>
            ${esc(
              profile?.nome ||
              "Usuário"
            )}
          </h2>

        </div>

      </div>


      <div class="account-info">

        <p>
          <strong>E-mail</strong>
          ${esc(user.email || "")}
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
        >
          Sair
        </button>

      </div>

    </div>

  `;


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
    document.querySelector(
      "#requestAdminButton"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    requestAdminAccess
  );
}
/* =========================================================
   17. CONVERSAS
   ========================================================= */

async function loadConversations() {

  const container =
    document.querySelector(
      "#conversationList"
    );

  if (!container) return;


  const {
    data: { user },
    error: userError
  } =
    await supabase.auth.getUser();


  if (userError || !user) {

    container.innerHTML = `
      <div class="empty">
        Você precisa estar logado para visualizar suas conversas.
      </div>
    `;

    return;
  }


  currentUser = user;


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.CONVERSAS)
      .select("*")
      .or(
        `cliente_id.eq.${user.id},funcionario_id.eq.${user.id}`
      )
      .order(
        "created_at",
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
      <div class="empty">
        Você ainda não possui conversas.
      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map((conversation) => {

        const title =
          conversation.titulo ||
          conversation.assunto ||
          "Atendimento";


        const status =
          conversation.status ||
          "aberta";


        return `

          <a
            class="conversation-card"
            href="atendimento.html?conversa=${encodeURIComponent(
              conversation.id
            )}"
          >

            <div>

              <strong>
                ${esc(title)}
              </strong>

              <p>
                ${esc(status)}
              </p>

            </div>


            <span>
              ${formatDate(
                conversation.created_at
              )}
            </span>

          </a>

        `;
      })
      .join("");
}


/* =========================================================
   18. CARREGAR UMA CONVERSA
   ========================================================= */

async function loadConversation() {

  const container =
    document.querySelector(
      "#chatMessages"
    );

  if (!container) return;


  const params =
    new URLSearchParams(
      window.location.search
    );


  const conversationId =
    params.get("conversa") ||
    params.get("conversation");


  if (!conversationId) {

    container.innerHTML = `
      <div class="empty">
        Nenhuma conversa selecionada.
      </div>
    `;

    return;
  }


  const {
    data: { user },
    error: userError
  } =
    await supabase.auth.getUser();


  if (userError || !user) {

    container.innerHTML = `
      <div class="empty">
        Você precisa estar logado.
      </div>
    `;

    return;
  }


  currentUser = user;


  const {
    data: conversation,
    error: conversationError
  } =
    await supabase
      .from(TABLES.CONVERSAS)
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();


  if (conversationError) {

    console.error(
      "Erro ao carregar conversa:",
      conversationError
    );

    container.innerHTML = `
      <div class="empty">
        Não foi possível carregar a conversa.
      </div>
    `;

    return;
  }


  if (!conversation) {

    container.innerHTML = `
      <div class="empty">
        Conversa não encontrada ou sem permissão de acesso.
      </div>
    `;

    return;
  }


  const allowed =
    conversation.cliente_id === user.id ||
    conversation.funcionario_id === user.id ||
    isAdmin(currentProfile);


  if (!allowed) {

    container.innerHTML = `
      <div class="empty">
        Você não possui acesso a esta conversa.
      </div>
    `;

    return;
  }


  const title =
    document.querySelector(
      "#conversationTitle"
    );


  if (title) {

    title.textContent =
      conversation.titulo ||
      conversation.assunto ||
      "Atendimento";
  }


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
    document.querySelector(
      "#chatMessages"
    );

  if (!container) return;


  const {
    data: { user },
    error: userError
  } =
    await supabase.auth.getUser();


  if (userError || !user) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.MENSAGENS)
      .select("*")
      .eq(
        "conversa_id",
        conversationId
      )
      .order(
        "created_at",
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
      <div class="empty">
        Nenhuma mensagem ainda.
      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map((message) => {

        const mine =
          message.usuario_id === user.id ||
          message.autor_id === user.id;


        const text =
          message.mensagem ||
          message.conteudo ||
          message.texto ||
          "";


        return `

          <div
            class="chat-message ${
              mine ? "mine" : ""
            }"
          >

            <div>
              ${esc(text)}
            </div>

            <small>
              ${formatDateTime(
                message.created_at
              )}
            </small>

          </div>

        `;
      })
      .join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   20. FORMULÁRIO DE MENSAGEM
   ========================================================= */

function setupMessageForm(
  conversationId
) {

  const form =
    qs(
      "#messageForm",
      "#formMensagem"
    );

  if (!form) return;


  if (
    form.dataset.bound === "true"
  ) {
    return;
  }


  form.dataset.bound = "true";


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const input =
        qs(
          "#messageInput",
          "#mensagem",
          "#textoMensagem"
        );


      if (!input) return;


      const text =
        input.value.trim();


      if (!text) return;


      const {
        data: { user },
        error: userError
      } =
        await supabase.auth.getUser();


      if (userError || !user) {

        alert(
          "Você precisa estar logado."
        );

        return;
      }


      const messageData = {

        conversa_id:
          conversationId,

        usuario_id:
          user.id,

        mensagem:
          text

      };


      const {
        error
      } =
        await supabase
          .from(TABLES.MENSAGENS)
          .insert(
            messageData
          );


      if (error) {

        console.error(
          "Erro ao enviar mensagem:",
          error
        );

        alert(
          "Não foi possível enviar a mensagem."
        );

        return;
      }


      input.value = "";


      await loadMessages(
        conversationId
      );
    }
  );
}


/* =========================================================
   21. NOTIFICAÇÕES
   ========================================================= */

async function loadNotifications() {

  const container =
    document.querySelector(
      "#notificationsList"
    );

  if (!container) return;


  const {
    data: { user },
    error: userError
  } =
    await supabase.auth.getUser();


  if (userError || !user) {

    container.innerHTML = "";

    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.NOTIFICACOES)
      .select("*")
      .eq(
        "usuario_id",
        user.id
      )
      .order(
        "created_at",
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
      .map((notification) => {

        const title =
          notification.titulo ||
          "Notificação";


        const message =
          notification.mensagem ||
          notification.conteudo ||
          "";


        const read =
          notification.lida === true;


        return `

          <div
            class="notification-card ${
              read ? "read" : "unread"
            }"
          >

            <div>

              <strong>
                ${esc(title)}
              </strong>

              <p>
                ${esc(message)}
              </p>

            </div>

            <small>
              ${formatDateTime(
                notification.created_at
              )}
            </small>

          </div>

        `;
      })
      .join("");
}


/* =========================================================
   22. MARCAR NOTIFICAÇÃO COMO LIDA
   ========================================================= */

async function markNotificationAsRead(
  notificationId
) {

  if (!notificationId) return;


  const {
    data: { user },
    error: userError
  } =
    await supabase.auth.getUser();


  if (userError || !user) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from(TABLES.NOTIFICACOES)
      .update({
        lida: true
      })
      .eq(
        "id",
        notificationId
      )
      .eq(
        "usuario_id",
        user.id
      );


  if (error) {

    console.error(
      "Erro ao marcar notificação:",
      error
    );

    return;
  }


  await loadNotifications();
}


/* =========================================================
   23. SOLICITAÇÃO DE SERVIÇO
   ========================================================= */

async function createServiceRequest(
  serviceId = null
) {

  const form =
    qs(
      "#serviceRequestForm",
      "#formSolicitacao",
      "#requestForm"
    );


  if (!form) return;


  const {
    data: { user },
    error: userError
  } =
    await supabase.auth.getUser();


  if (userError || !user) {

    alert(
      "Você precisa estar logado para solicitar atendimento."
    );

    window.location.href =
      "login.html";

    return;
  }


  const nome =
    qs(
      "#requestNome",
      "#nomeSolicitante"
    )?.value?.trim() || "";


  const telefone =
    qs(
      "#requestTelefone",
      "#telefone"
    )?.value?.trim() || "";


  const descricao =
    qs(
      "#requestDescricao",
      "#descricao",
      "#mensagem"
    )?.value?.trim() || "";


  const dataSolicitada =
    qs(
      "#requestData",
      "#dataSolicitada"
    )?.value || null;


  const observacoes =
    qs(
      "#requestObservacoes",
      "#observacoes"
    )?.value?.trim() || "";


  const serviceSelect =
    qs(
      "#requestServico",
      "#servico",
      "#servicoId"
    );


  const selectedService =
    serviceId ||
    serviceSelect?.value ||
    null;


  const payload = {

    usuario_id:
      user.id,

    servico_id:
      selectedService,

    nome:
      nome || null,

    telefone:
      telefone || null,

    descricao:
      descricao || null,

    data_solicitada:
      dataSolicitada,

    observacoes:
      observacoes || null,

    status:
      "pendente"

  };


  const {
    error
  } =
    await supabase
      .from(TABLES.SOLICITACOES)
      .insert(
        payload
      );


  if (error) {

    console.error(
      "Erro ao criar solicitação:",
      error
    );

    alert(
      "Não foi possível enviar a solicitação."
    );

    return;
  }


  alert(
    "Solicitação enviada com sucesso!"
  );


  form.reset();
}


/* =========================================================
   24. CONFIGURAÇÃO DO FORMULÁRIO
   ========================================================= */

function setupServiceRequestForm() {

  const form =
    qs(
      "#serviceRequestForm",
      "#formSolicitacao",
      "#requestForm"
    );


  if (!form) return;


  if (
    form.dataset.bound === "true"
  ) {
    return;
  }


  form.dataset.bound = "true";


  const params =
    new URLSearchParams(
      window.location.search
    );


  const serviceFromUrl =
    params.get("servico") ||
    params.get("service");


  if (serviceFromUrl) {

    const select =
      qs(
        "#requestServico",
        "#servico",
        "#servicoId"
      );


    if (select) {

      select.value =
        serviceFromUrl;
    }
  }


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      await createServiceRequest(
        serviceFromUrl
      );
    }
  );
}


/* =========================================================
   25. PRODUTOS PÚBLICOS
   ========================================================= */

async function loadProducts() {

  const containers =
    document.querySelectorAll(
      "#productsGrid, #produtosGrid"
    );


  if (!containers.length) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.PRODUTOS)
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar produtos:",
      error
    );

    containers.forEach(
      (container) => {

        container.innerHTML = `
          <div class="empty">
            Não foi possível carregar os produtos.
          </div>
        `;
      }
    );

    return;
  }


  const products =
    data || [];


  containers.forEach(
    (container) => {

      if (!products.length) {

        container.innerHTML = `
          <div class="empty">
            Nenhum produto disponível no momento.
          </div>
        `;

        return;
      }


      container.innerHTML =
        products
          .map(
            (product) => {

              const image =
                product.imagem_url ||
                product.imagem ||
                product.foto_url ||
                "";


              const name =
                product.nome ||
                product.name ||
                "Produto";


              const description =
                product.descricao ||
                product.description ||
                "Confira as informações deste produto.";


              return `

                <article
                  class="product-card"
                >

                  ${
                    image

                      ? `
                        <img
                          src="${esc(image)}"
                          alt="${esc(name)}"
                        >
                      `

                      : `
                        <div
                          class="product-image"
                        >
                          Max Som
                        </div>
                      `
                  }


                  <div
                    class="product-info"
                  >

                    ${
                      product.marca

                        ? `
                          <span>
                            ${esc(product.marca)}
                          </span>
                        `

                        : ""
                    }


                    <h3>
                      ${esc(name)}
                    </h3>


                    <p>
                      ${esc(description)}
                    </p>


                  </div>

                </article>

              `;
            }
          )
          .join("");
    }
  );
}


/* =========================================================
   26. SERVIÇOS PÚBLICOS
   ========================================================= */

async function loadServices() {

  const containers =
    document.querySelectorAll(
      "#servicesGrid, #servicosGrid"
    );


  if (!containers.length) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.SERVICOS)
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar serviços:",
      error
    );

    containers.forEach(
      (container) => {

        container.innerHTML = `
          <div class="empty">
            Não foi possível carregar os serviços.
          </div>
        `;
      }
    );

    return;
  }


  const services =
    data || [];


  containers.forEach(
    (container) => {

      if (!services.length) {

        container.innerHTML = `
          <div class="empty">
            Nenhum serviço disponível no momento.
          </div>
        `;

        return;
      }


      container.innerHTML =
        services
          .map(
            (service) => {

              const image =
                service.imagem_url ||
                service.imagem ||
                service.foto_url ||
                "";


              const name =
                service.nome ||
                service.name ||
                "Serviço";


              const description =
                service.descricao ||
                service.description ||
                "Conheça este serviço da Max Som.";


              const id =
                service.id || "";


              return `

                <article
                  class="service-card"
                >

                  ${
                    image

                      ? `
                        <img
                          src="${esc(image)}"
                          alt="${esc(name)}"
                        >
                      `

                      : ""
                  }


                  <div>

                    <h3>
                      ${esc(name)}
                    </h3>


                    <p>
                      ${esc(description)}
                    </p>


                    <a
                      href="atendimento.html?servico=${encodeURIComponent(
                        id
                      )}"
                    >
                      Solicitar atendimento →
                    </a>

                  </div>

                </article>

              `;
            }
          )
          .join("");
    }
  );
}
/* =========================================================
   27. PROJETOS PÚBLICOS
   ========================================================= */

async function loadProjects() {

  const containers =
    document.querySelectorAll(
      "#projectsGrid, #projetosGrid"
    );


  if (!containers.length) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from("projetos")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar projetos:",
      error
    );

    containers.forEach(
      (container) => {

        container.innerHTML = `
          <div class="empty">
            Não foi possível carregar os projetos.
          </div>
        `;
      }
    );

    return;
  }


  const projects =
    data || [];


  containers.forEach(
    (container) => {

      if (!projects.length) {

        container.innerHTML = `
          <div class="empty">
            Nenhum projeto disponível no momento.
          </div>
        `;

        return;
      }


      container.innerHTML =
        projects
          .map(
            (project) => {

              const image =
                project.imagem_url ||
                project.imagem ||
                project.foto_url ||
                "";


              const name =
                project.nome ||
                project.titulo ||
                project.name ||
                "Projeto";


              const description =
                project.descricao ||
                project.description ||
                "";


              return `

                <article
                  class="project-card"
                >

                  ${
                    image

                      ? `
                        <img
                          src="${esc(image)}"
                          alt="${esc(name)}"
                        >
                      `

                      : `
                        <div
                          class="project-image"
                        >
                          Max Som
                        </div>
                      `
                  }


                  <div
                    class="project-info"
                  >

                    ${
                      project.categoria

                        ? `
                          <span>
                            ${esc(
                              project.categoria
                            )}
                          </span>
                        `

                        : ""
                    }


                    <h3>
                      ${esc(name)}
                    </h3>


                    ${
                      description

                        ? `
                          <p>
                            ${esc(
                              description
                            )}
                          </p>
                        `

                        : ""
                    }

                  </div>

                </article>

              `;
            }
          )
          .join("");
    }
  );
}


/* =========================================================
   28. PUBLICAÇÕES
   ========================================================= */

async function loadPosts() {

  const containers =
    document.querySelectorAll(
      "#postsGrid, #publicacoesGrid"
    );


  if (!containers.length) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from("publicacoes")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar publicações:",
      error
    );

    containers.forEach(
      (container) => {

        container.innerHTML = `
          <div class="empty">
            Não foi possível carregar as publicações.
          </div>
        `;
      }
    );

    return;
  }


  const posts =
    data || [];


  containers.forEach(
    (container) => {

      if (!posts.length) {

        container.innerHTML = `
          <div class="empty">
            Nenhuma publicação disponível no momento.
          </div>
        `;

        return;
      }


      container.innerHTML =
        posts
          .map(
            (post) => {

              const image =
                post.imagem_url ||
                post.imagem ||
                post.foto_url ||
                "";


              const title =
                post.titulo ||
                post.nome ||
                "Publicação";


              const description =
                post.resumo ||
                post.descricao ||
                post.conteudo ||
                "";


              return `

                <article
                  class="post-card"
                >

                  ${
                    image

                      ? `
                        <img
                          src="${esc(image)}"
                          alt="${esc(title)}"
                        >
                      `

                      : `
                        <div
                          class="post-image"
                        >
                          Max Som
                        </div>
                      `
                  }


                  <div
                    class="post-info"
                  >

                    ${
                      post.categoria

                        ? `
                          <span>
                            ${esc(
                              post.categoria
                            )}
                          </span>
                        `

                        : ""
                    }


                    <h3>
                      ${esc(title)}
                    </h3>


                    ${
                      description

                        ? `
                          <p>
                            ${esc(
                              description
                            )}
                          </p>
                        `

                        : ""
                    }


                    ${
                      post.url

                        ? `
                          <a
                            href="${esc(
                              post.url
                            )}"
                            target="_blank"
                            rel="noopener"
                          >
                            Ver publicação →
                          </a>
                        `

                        : ""
                    }

                  </div>

                </article>

              `;
            }
          )
          .join("");
    }
  );
}


/* =========================================================
   29. LINKS DE SERVIÇOS
   ========================================================= */

function setupServiceLinks() {

  document
    .querySelectorAll(
      "[data-service-id]"
    )
    .forEach(
      (element) => {

        const serviceId =
          element.dataset.serviceId;


        if (!serviceId) {
          return;
        }


        element.addEventListener(
          "click",
          () => {

            const url =
              `atendimento.html?servico=${encodeURIComponent(
                serviceId
              )}`;


            if (
              element.tagName === "A"
            ) {

              element.href =
                url;

            } else {

              window.location.href =
                url;
            }
          }
        );
      }
    );
}


/* =========================================================
   30. WHATSAPP
   ========================================================= */

function setupWhatsAppLinks() {

  const phone =
    "5565996262514";


  document
    .querySelectorAll(
      "[data-whatsapp]"
    )
    .forEach(
      (element) => {

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
              "_blank",
              "noopener"
            );
          }
        );
      }
    );
}


/* =========================================================
   31. FORMULÁRIO DE CONTATO
   ========================================================= */

function setupContactForm() {

  const form =
    qs(
      "#contactForm",
      "#formContato"
    );


  if (!form) {
    return;
  }


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
          "#nome"
        )?.value?.trim() || "";


      const email =
        qs(
          "#contactEmail",
          "#email"
        )?.value?.trim() || "";


      const telefone =
        qs(
          "#contactTelefone",
          "#telefone"
        )?.value?.trim() || "";


      const mensagem =
        qs(
          "#contactMensagem",
          "#mensagem"
        )?.value?.trim() || "";


      if (
        !nome ||
        !email ||
        !mensagem
      ) {

        alert(
          "Preencha nome, e-mail e mensagem."
        );

        return;
      }


      const {
        data: { user }
      } =
        await supabase.auth.getUser();


      /*
       * O formulário público não cria uma
       * solicitação automaticamente caso
       * não exista usuário autenticado.
       *
       * Nesse caso, o contato continua sendo
       * encaminhado pelo WhatsApp.
       */


      const whatsappMessage =
        [
          `Olá! Meu nome é ${nome}.`,
          `E-mail: ${email}.`,
          telefone
            ? `Telefone: ${telefone}.`
            : "",
          `Mensagem: ${mensagem}`
        ]
          .filter(Boolean)
          .join("\n");


      const url =
        `https://wa.me/5565996262514?text=${encodeURIComponent(
          whatsappMessage
        )}`;


      window.open(
        url,
        "_blank",
        "noopener"
      );


      form.reset();
    }
  );
}


/* =========================================================
   32. MENU / PÁGINA ATUAL
   ========================================================= */

function markCurrentPage() {

  const current =
    window.location.pathname
      .split("/")
      .pop() ||
    "index.html";


  document
    .querySelectorAll(
      "nav a[href]"
    )
    .forEach(
      (link) => {

        const href =
          link.getAttribute(
            "href"
          );


        if (!href) {
          return;
        }


        const cleanHref =
          href
            .split("?")[0]
            .split("#")[0];


        if (
          cleanHref === current
        ) {

          link.classList.add(
            "nav-current"
          );
        }
      }
    );
}


/* =========================================================
   33. BOTÕES DE CANCELAR FORMULÁRIOS
   ========================================================= */

function setupCancelButtons() {

  document
    .querySelectorAll(
      "[id$='Cancelar'], [data-cancel]"
    )
    .forEach(
      (button) => {

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
          (event) => {

            event.preventDefault();


            const form =
              button.closest(
                "form"
              );


            if (form) {

              form.reset();
            }


            /*
             * Remove possíveis estados
             * de edição.
             */

            delete button.dataset.editing;


            document
              .querySelectorAll(
                "[data-editing]"
              )
              .forEach(
                (element) => {

                  delete element.dataset.editing;
                }
              );
          }
        );
      }
    );
}


/* =========================================================
   34. ADMIN — CARREGAMENTO PRINCIPAL
   ========================================================= */

async function loadAdminPage() {

  const adminContainer =
    document.querySelector(
      "#adminUsuariosLista"
    );


  if (!adminContainer) {
    return;
  }


  const allowed =
    await requireAdmin();


  if (!allowed) {
    return;
  }


  await adminStats();

  await adminUsers();
}


/* =========================================================
   35. VERIFICAÇÃO DE ACESSO
   ========================================================= */

async function checkLoggedPage() {

  const loggedElements =
    document.querySelectorAll(
      "[data-requires-login]"
    );


  if (!loggedElements.length) {
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
   36. REDIRECIONAMENTO DE ADMIN
   ========================================================= */

async function redirectAdminIfNeeded() {

  const adminPage =
    window.location.pathname
      .endsWith(
        "/admin.html"
      );


  if (!adminPage) {
    return;
  }


  const profile =
    await ensureProfile();


  if (
    !profile ||
    !isAdmin(profile)
  ) {

    window.location.href =
      "index.html";
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
      "Erro ao verificar sessão:",
      error
    );

    return;
  }


  if (session?.user) {

    currentUser =
      session.user;

    await ensureProfile();

  } else {

    currentUser = null;
    currentProfile = null;
  }
}


/* =========================================================
   38. EVENTOS DE AUTENTICAÇÃO
   ========================================================= */

function setupAuthListener() {

  supabase.auth.onAuthStateChange(
    () => {

      setTimeout(
        () => {

          updateNav();

        },
        0
      );
    }
  );
}


/* =========================================================
   39. REALTIME DAS MENSAGENS
   ========================================================= */

function setupMessageRealtime() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const conversationId =
    params.get("conversa") ||
    params.get("conversation");


  if (!conversationId) {
    return;
  }


  const container =
    document.querySelector(
      "#chatMessages"
    );


  if (!container) {
    return;
  }


  supabase
    .channel(
      `mensagens-${conversationId}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: TABLES.MENSAGENS,
        filter:
          `conversa_id=eq.${conversationId}`
      },
      async () => {

        await loadMessages(
          conversationId
        );
      }
    )
    .subscribe();
}


/* =========================================================
   40. REALTIME DAS NOTIFICAÇÕES
   ========================================================= */

function setupNotificationRealtime() {

  if (!currentUser) {
    return;
  }


  const container =
    document.querySelector(
      "#notificationsList"
    );


  if (!container) {
    return;
  }


  supabase
    .channel(
      `notificacoes-${currentUser.id}`
    )
    .on(
      "postgres_changes",
      {
        event: "*",
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
   41. ATALHOS DE TECLADO
   ========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    (event) => {

      /*
       * ESC fecha elementos que
       * utilizarem data-close.
       */

      if (
        event.key === "Escape"
      ) {

        document
          .querySelectorAll(
            "[data-close]"
          )
          .forEach(
            (element) => {

              element.click();
            }
          );
      }
    }
  );
}


/* =========================================================
   42. FORMULÁRIOS ADMIN
   ========================================================= */

function setupAdminForms() {

  const forms =
    document.querySelectorAll(
      "[data-admin-form]"
    );


  if (!forms.length) {
    return;
  }


  forms.forEach(
    (form) => {

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


          const table =
            form.dataset.adminForm;


          if (!table) {
            return;
          }


          const formData =
            new FormData(form);


          const payload = {};


          formData.forEach(
            (value, key) => {

              payload[key] =
                value;
            }
          );


          const id =
            form.dataset.id;


          let query;


          if (id) {

            query =
              supabase
                .from(table)
                .update(payload)
                .eq(
                  "id",
                  id
                );

          } else {

            query =
              supabase
                .from(table)
                .insert(
                  payload
                );
          }


          const {
            error
          } =
            await query;


          if (error) {

            console.error(
              "Erro ao salvar:",
              error
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

          delete form.dataset.id;


          /*
           * Atualiza a página
           * correspondente quando
           * houver uma função pública.
           */

          await loadProducts();
          await loadServices();
          await loadProjects();
          await loadPosts();
        }
      );
    }
  );
}


/* =========================================================
   43. EXCLUSÃO ADMIN
   ========================================================= */

function setupDeleteButtons() {

  document
    .querySelectorAll(
      "[data-delete-table]"
    )
    .forEach(
      (button) => {

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


            if (!table || !id) {
              return;
            }


            const confirmed =
              window.confirm(
                "Tem certeza que deseja excluir este item?"
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
                "Não foi possível excluir o item."
              );

              return;
            }


            button
              .closest(
                "[data-row], tr, article, .admin-item"
              )
              ?.remove();
          }
        );
      }
    );
}


/* =========================================================
   44. ATUALIZAÇÃO DE LINKS DE CONTA
   ========================================================= */

function setupAccountLinks() {

  document
    .querySelectorAll(
      "[data-account-link]"
    )
    .forEach(
      (link) => {

        link.addEventListener(
          "click",
          async (event) => {

            const {
              data: { user }
            } =
              await supabase.auth.getUser();


            if (!user) {

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
   45. ATUALIZAÇÃO DE LINKS DE ADMIN
   ========================================================= */

function setupAdminLinks() {

  document
    .querySelectorAll(
      "[data-admin-only]"
    )
    .forEach(
      (link) => {

        link.addEventListener(
          "click",
          async (event) => {

            const profile =
              await ensureProfile();


            if (
              !profile ||
              !isAdmin(profile)
            ) {

              event.preventDefault();

              window.location.href =
                "index.html";
            }
          }
        );
      }
    );
}


/* =========================================================
   46. INICIALIZAÇÃO DOS COMPONENTES
   ========================================================= */

async function initializeComponents() {

  await initializeAuth();

  await updateNav();

  markCurrentPage();

  setupAuthListener();

  setupLogin();

  setupSignup();

  setupAdminRequestButton();

  setupServiceRequestForm();

  setupServiceLinks();

  setupWhatsAppLinks();

  setupContactForm();

  setupCancelButtons();

  setupAdminForms();

  setupDeleteButtons();

  setupAccountLinks();

  setupAdminLinks();

  setupKeyboardShortcuts();

  await checkLoggedPage();

  await redirectAdminIfNeeded();

  await account();

  await loadConversations();

  await loadConversation();

  await loadNotifications();

  await loadProducts();

  await loadServices();

  await loadProjects();

  await loadPosts();

  await loadAdminPage();

  setupMessageRealtime();

  setupNotificationRealtime();
}


/* =========================================================
   47. INICIALIZAÇÃO FINAL
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeComponents
  );

} else {

  initializeComponents();
}
/* =========================================================
   48. CONTA DO USUÁRIO
   ========================================================= */

async function account() {

  const accountPage =
    document.querySelector(
      "[data-account-page]"
    );


  if (!accountPage) {
    return;
  }


  const profile =
    await ensureProfile();


  if (!profile) {
    return;
  }


  const nome =
    document.querySelector(
      "[data-account-name]"
    );


  const tipo =
    document.querySelector(
      "[data-account-type]"
    );


  const email =
    document.querySelector(
      "[data-account-email]"
    );


  if (nome) {
    nome.textContent =
      profile.nome ||
      currentUser?.email ||
      "Usuário";
  }


  if (tipo) {
    tipo.textContent =
      profile.tipo_usuario ||
      "cliente";
  }


  if (email) {
    email.textContent =
      currentUser?.email ||
      "";
  }
}


/* =========================================================
   49. CONVERSAS
   ========================================================= */

async function loadConversations() {

  const container =
    document.querySelector(
      "#conversationsList"
    );


  if (!container) {
    return;
  }


  if (!currentUser) {

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
      .select("*")
      .order(
        "created_at",
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


  const conversations =
    data || [];


  if (!conversations.length) {

    container.innerHTML = `
      <div class="empty">
        Você ainda não possui conversas.
      </div>
    `;

    return;
  }


  container.innerHTML =
    conversations
      .map(
        (conversation) => {

          const title =
            conversation.titulo ||
            conversation.assunto ||
            "Atendimento";


          return `

            <article
              class="conversation-card"
            >

              <h3>
                ${esc(title)}
              </h3>

              ${
                conversation.status
                  ? `
                    <p class="muted">
                      Status:
                      ${esc(
                        conversation.status
                      )}
                    </p>
                  `
                  : ""
              }

              <div class="actions">

                <a
                  class="btn btn-primary"
                  href="atendimento.html?conversa=${encodeURIComponent(
                    conversation.id
                  )}"
                >
                  Abrir conversa
                </a>

              </div>

            </article>

          `;
        }
      )
      .join("");
}


/* =========================================================
   50. CONVERSA INDIVIDUAL
   ========================================================= */

async function loadConversation() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const conversationId =
    params.get("conversa") ||
    params.get("conversation");


  const container =
    document.querySelector(
      "#chatMessages"
    );


  if (
    !conversationId ||
    !container
  ) {
    return;
  }


  if (!currentUser) {

    container.innerHTML = `
      <div class="empty">
        Faça login para acessar esta conversa.
      </div>
    `;

    return;
  }


  await loadMessages(
    conversationId
  );


  const form =
    document.querySelector(
      "#chatForm"
    );


  if (
    !form ||
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


      const input =
        document.querySelector(
          "#chatMessage"
        );


      const message =
        input?.value?.trim();


      if (!message) {
        return;
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

            mensagem:
              message
          });


      if (error) {

        console.error(
          "Erro ao enviar mensagem:",
          error
        );

        alert(
          "Não foi possível enviar a mensagem."
        );

        return;
      }


      input.value = "";


      await loadMessages(
        conversationId
      );
    }
  );
}


/* =========================================================
   51. MENSAGENS
   ========================================================= */

async function loadMessages(
  conversationId
) {

  const container =
    document.querySelector(
      "#chatMessages"
    );


  if (!container) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.MENSAGENS)
      .select("*")
      .eq(
        "conversa_id",
        conversationId
      )
      .order(
        "created_at",
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


  const messages =
    data || [];


  if (!messages.length) {

    container.innerHTML = `
      <div class="empty">
        Nenhuma mensagem ainda.
      </div>
    `;

    return;
  }


  container.innerHTML =
    messages
      .map(
        (message) => {

          const mine =
            message.remetente_id ===
            currentUser?.id;


          const text =
            message.mensagem ||
            message.conteudo ||
            "";


          const date =
            message.created_at
              ? new Date(
                  message.created_at
                ).toLocaleString(
                  "pt-BR"
                )
              : "";


          return `

            <div
              class="chat-message ${
                mine
                  ? "mine"
                  : ""
              }"
            >

              <div>
                ${esc(text)}
              </div>

              ${
                date
                  ? `
                    <small>
                      ${esc(date)}
                    </small>
                  `
                  : ""
              }

            </div>

          `;
        }
      )
      .join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   52. NOTIFICAÇÕES
   ========================================================= */

async function loadNotifications() {

  const container =
    document.querySelector(
      "#notificationsList"
    );


  if (!container) {
    return;
  }


  if (!currentUser) {

    container.innerHTML = `
      <div class="empty">
        Faça login para visualizar suas notificações.
      </div>
    `;

    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.NOTIFICACOES)
      .select("*")
      .eq(
        "usuario_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar notificações:",
      error
    );

    container.innerHTML = `
      <div class="empty">
        Não foi possível carregar as notificações.
      </div>
    `;

    return;
  }


  const notifications =
    data || [];


  if (!notifications.length) {

    container.innerHTML = `
      <div class="empty">
        Nenhuma notificação.
      </div>
    `;

    return;
  }


  container.innerHTML =
    notifications
      .map(
        (notification) => {

          const title =
            notification.titulo ||
            "Notificação";


          const message =
            notification.mensagem ||
            notification.conteudo ||
            "";


          const date =
            notification.created_at
              ? new Date(
                  notification.created_at
                ).toLocaleString(
                  "pt-BR"
                )
              : "";


          return `

            <article
              class="account-card"
            >

              <strong>
                ${esc(title)}
              </strong>

              ${
                message
                  ? `
                    <p class="muted">
                      ${esc(message)}
                    </p>
                  `
                  : ""
              }

              ${
                date
                  ? `
                    <small class="muted">
                      ${esc(date)}
                    </small>
                  `
                  : ""
              }

            </article>

          `;
        }
      )
      .join("");
}


/* =========================================================
   53. SOLICITAÇÃO DE SERVIÇO
   ========================================================= */

function setupServiceRequestForm() {

  const form =
    document.querySelector(
      "#serviceRequestForm"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.bound ===
    "true"
  ) {
    return;
  }


  form.dataset.bound =
    "true";


  const params =
    new URLSearchParams(
      window.location.search
    );


  const service =
    params.get("servico");


  if (service) {

    const select =
      form.querySelector(
        "[name='servico_id'], [name='servico']"
      );


    if (select) {

      select.value =
        service;
    }
  }


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (!currentUser) {

        alert(
          "Faça login para solicitar um atendimento."
        );

        window.location.href =
          "login.html";

        return;
      }


      const formData =
        new FormData(form);


      const servicoId =
        formData.get(
          "servico_id"
        ) ||
        formData.get(
          "servico"
        );


      const descricao =
        formData.get(
          "descricao"
        ) ||
        formData.get(
          "mensagem"
        ) ||
        "";


      const dataSolicitada =
        formData.get(
          "data_solicitada"
        ) ||
        null;


      const horario =
        formData.get(
          "horario"
        ) ||
        null;


      const payload = {

        usuario_id:
          currentUser.id,

        servico_id:
          servicoId ||
          null,

        descricao:
          descricao,

        data_solicitada:
          dataSolicitada,

        horario:
          horario,

        status:
          "pendente"
      };


      /*
       * A tabela real do projeto possui
       * acento:
       *
       * solicitações_servico
       */

      const {
        error
      } =
        await supabase
          .from(
            TABLES.SOLICITACOES
          )
          .insert(
            payload
          );


      if (error) {

        console.error(
          "Erro ao criar solicitação:",
          error
        );

        alert(
          "Não foi possível enviar sua solicitação."
        );

        return;
      }


      const whatsappMessage =
        [
          "Olá! Quero solicitar um serviço.",
          `Descrição: ${descricao}`,
          dataSolicitada
            ? `Data: ${dataSolicitada}`
            : "",
          horario
            ? `Horário: ${horario}`
            : ""
        ]
          .filter(Boolean)
          .join("\n");


      const whatsapp =
        `https://wa.me/5565996262514?text=${encodeURIComponent(
          whatsappMessage
        )}`;


      alert(
        "Solicitação enviada com sucesso!"
      );


      form.reset();


      window.open(
        whatsapp,
        "_blank",
        "noopener"
      );
    }
  );
}


/* =========================================================
   54. SOLICITAÇÃO DE ADMIN
   ========================================================= */

function setupAdminRequestButton() {

  const button =
    document.querySelector(
      "[data-request-admin]"
    );


  if (!button) {
    return;
  }


  if (
    button.dataset.bound ===
    "true"
  ) {
    return;
  }


  button.dataset.bound =
    "true";


  button.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        window.location.href =
          "login.html";

        return;
      }


      const profile =
        await ensureProfile();


      if (!profile) {
        return;
      }


      if (
        isAdmin(profile)
      ) {

        alert(
          "Sua conta já possui acesso de administrador."
        );

        return;
      }


      if (
        profile.tipo_usuario ===
        "solicitante_admin"
      ) {

        alert(
          "Sua solicitação de administrador já foi enviada."
        );

        return;
      }


      const {
        error
      } =
        await supabase
          .from(TABLES.USUARIO)
          .update({
            tipo_usuario:
              "solicitante_admin"
          })
          .eq(
            "id",
            currentUser.id
          );


      if (error) {

        console.error(
          "Erro ao solicitar administrador:",
          error
        );

        alert(
          "Não foi possível enviar a solicitação."
        );

        return;
      }


      currentProfile =
        {
          ...profile,
          tipo_usuario:
            "solicitante_admin"
        };


      alert(
        "Solicitação enviada para análise."
      );


      updateNav();
    }
  );
}


/* =========================================================
   55. ADMIN — ESTATÍSTICAS
   ========================================================= */

async function adminStats() {

  const counters =
    document.querySelectorAll(
      "[data-admin-count]"
    );


  if (!counters.length) {
    return;
  }


  const tables = {

    usuarios:
      TABLES.USUARIO,

    produtos:
      TABLES.PRODUTOS,

    servicos:
      TABLES.SERVICOS,

    projetos:
      TABLES.PROJETOS
  };


  for (
    const [key, table]
    of Object.entries(tables)
  ) {

    const element =
      document.querySelector(
        `[data-admin-count="${key}"]`
      );


    if (!element) {
      continue;
    }


    const {
      count,
      error
    } =
      await supabase
        .from(table)
        .select(
          "*",
          {
            count:
              "exact",
            head:
              true
          }
        );


    if (error) {

      console.error(
        `Erro ao contar ${key}:`,
        error
      );

      element.textContent =
        "—";

      continue;
    }


    element.textContent =
      count ??
      0;
  }
}


/* =========================================================
   56. ADMIN — USUÁRIOS
   ========================================================= */

async function adminUsers() {

  const container =
    document.querySelector(
      "#adminUsuariosLista"
    );


  if (!container) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase
      .from(
        TABLES.USUARIO
      )
      .select(
        "id,nome,tipo_usuario"
      )
      .order(
        "nome",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar usuários:",
      error
    );

    container.innerHTML = `
      <div class="empty">
        Não foi possível carregar os usuários.
      </div>
    `;

    return;
  }


  const users =
    data || [];


  if (!users.length) {

    container.innerHTML = `
      <div class="empty">
        Nenhum usuário encontrado.
      </div>
    `;

    return;
  }


  container.innerHTML =
    users
      .map(
        (user) => {

          const admin =
            user.tipo_usuario ===
            "admin";


          const request =
            user.tipo_usuario ===
            "solicitante_admin";


          return `

            <div
              class="admin-request"
            >

              <div>

                <strong>
                  ${esc(
                    user.nome ||
                    "Usuário"
                  )}
                </strong>

                <small>
                  ${esc(
                    user.tipo_usuario ||
                    "cliente"
                  )}
                </small>

              </div>


              <div
                class="admin-actions"
              >

                ${
                  request
                    ? `
                      <button
                        type="button"
                        class="btn btn-green"
                        data-approve-admin
                        data-user-id="${esc(
                          user.id
                        )}"
                      >
                        Aprovar administrador
                      </button>

                      <button
                        type="button"
                        class="btn btn-danger"
                        data-reject-admin
                        data-user-id="${esc(
                          user.id
                        )}"
                      >
                        Recusar
                      </button>
                    `
                    : ""
                }


                ${
                  admin
                    ? `
                      <span
                        class="muted"
                      >
                        Administrador
                      </span>
                    `
                    : ""
                }

              </div>

            </div>

          `;
        }
      )
      .join("");


  setupAdminUserActions();
}


/* =========================================================
   57. ADMIN — APROVAR / RECUSAR
   ========================================================= */

function setupAdminUserActions() {

  document
    .querySelectorAll(
      "[data-approve-admin]"
    )
    .forEach(
      (button) => {

        if (
          button.dataset.bound ===
          "true"
        ) {
          return;
        }


        button.dataset.bound =
          "true";


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
                .from(
                  TABLES.USUARIO
                )
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
                "Não foi possível aprovar o usuário."
              );

              return;
            }


            await adminUsers();

            await adminStats();
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-reject-admin]"
    )
    .forEach(
      (button) => {

        if (
          button.dataset.bound ===
          "true"
        ) {
          return;
        }


        button.dataset.bound =
          "true";


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
                .from(
                  TABLES.USUARIO
                )
                .update({
                  tipo_usuario:
                    "cliente"
                })
                .eq(
                  "id",
                  userId
                );


            if (error) {

              console.error(
                "Erro ao recusar solicitação:",
                error
              );

              alert(
                "Não foi possível recusar a solicitação."
              );

              return;
            }


            await adminUsers();
          }
        );
      }
    );
}


/* =========================================================
   58. ADMIN — PROTEÇÃO FINAL
   ========================================================= */

async function requireAdmin() {

  if (!currentUser) {

    window.location.href =
      "login.html";

    return false;
  }


  const profile =
    await ensureProfile();


  if (
    !profile ||
    !isAdmin(profile)
  ) {

    window.location.href =
      "index.html";

    return false;
  }


  return true;
}


/* =========================================================
   59. FINALIZAÇÃO
   ========================================================= */

window.MaxSom = {

  reload: initializeComponents,

  loadProducts,

  loadServices,

  loadProjects,

  loadPosts,

  loadConversations,

  loadMessages,

  loadNotifications,

  ensureProfile,

  requireAdmin

};
