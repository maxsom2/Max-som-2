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
    document.querySelector("#adminLink");

  const accountLink =
    document.querySelector("#accountLink");

  const loginLink =
    document.querySelector("#loginLink");

  const conversationsLink =
    document.querySelector(
      "#conversationsLink"
    );


  /* ADMIN */

  if (adminLink) {

    adminLink.style.display =
      isAdmin(profile)
        ? ""
        : "none";
  }


  /* LOGIN / CONTA */

  if (profile) {

    if (loginLink) {
      loginLink.style.display = "none";
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

    if (accountLink) {
      accountLink.style.display = "none";
    }

    if (conversationsLink) {
      conversationsLink.style.display = "none";
    }
  }
}


/* =========================================================
   7. LOGIN
   ========================================================= */

async function setupLogin() {

  const form =
    document.querySelector("#loginForm");

  if (!form) return;

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document
          .querySelector("#loginEmail")
          ?.value
          .trim();

      const password =
        document
          .querySelector("#loginPassword")
          ?.value;

      const errorBox =
        document.querySelector("#loginError");


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
    document.querySelector("#signupForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const nome =
        document
          .querySelector("#signupNome")
          ?.value
          .trim();

      const email =
        document
          .querySelector("#signupEmail")
          ?.value
          .trim();

      const password =
        document
          .querySelector("#signupPassword")
          ?.value;

      const errorBox =
        document.querySelector(
          "#signupError"
        );


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


/*
   IMPORTANTE:

   A privacidade das conversas NÃO depende
   somente dessas funções.

   O Supabase RLS precisa impedir:

   CLIENTE A
   ↓
   acessar conversa do CLIENTE B

   CLIENTE A
   ↓
   acessar mensagens do CLIENTE B

   CLIENTE A
   ↓
   acessar arquivos do CLIENTE B

   O JavaScript apenas trabalha com os
   dados que o Supabase permitir.
*/


async function loadConversations() {

  const container =
    document.querySelector(
      "#conversasLista"
    );

  if (!container) return;


  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

    container.innerHTML = `
      <p>
        Você precisa estar logado para ver suas conversas.
      </p>
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
      <p>
        Não foi possível carregar suas conversas.
      </p>
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
      .map((conversation) => {

        return `

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
                ${formatDateTime(
                  conversation.atualizado_em ||
                  conversation.criado_em
                )}
              </time>

            </div>

          </a>

        `;
      })
      .join("");
}


/* =========================================================
   18. CRIAR CONVERSA
   ========================================================= */

async function createConversation({
  assunto = "Atendimento Max Som"
} = {}) {

  const {
    data: { user },
    error: authError
  } =
    await supabase.auth.getUser();


  if (authError || !user) {

    throw new Error(
      "Você precisa estar logado."
    );
  }


  const {
    data,
    error
  } =
    await supabase
      .from(TABLES.CONVERSAS)
      .insert({

        cliente_id: user.id,

        assunto: assunto,

        status: "aberta"

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Erro ao criar conversa:",
      error
    );

    throw error;
  }


  return data;
}


/* =========================================================
   19. CARREGAR UMA CONVERSA
   ========================================================= */

async function loadConversation() {

  const container =
    document.querySelector(
      "#conversaContainer"
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
      <p>
        Conversa não encontrada.
      </p>
    `;

    return;
  }


  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

    container.innerHTML = `
      <p>
        Você precisa estar logado.
      </p>
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
      .eq("id", conversationId)
      .maybeSingle();


  if (error || !conversation) {

    console.error(
      "Erro ao carregar conversa:",
      error
    );

    container.innerHTML = `
      <p>
        Esta conversa não está disponível.
      </p>
    `;

    return;
  }


  /*
    Não fazemos uma "autorização" falsa aqui.

    O RLS do Supabase deve impedir
    que alguém consiga obter uma conversa
    que não pertence a ele.
  */


  const messagesContainer =
    document.querySelector(
      "#mensagensLista"
    );


  if (!messagesContainer) return;


  const title =
    document.querySelector(
      "#conversaTitulo"
    );


  const status =
    document.querySelector(
      "#conversaStatus"
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


  await loadMessages(
    conversationId
  );


  setupMessageForm(
    conversationId
  );
}


/* =========================================================
   20. CARREGAR MENSAGENS
   ========================================================= */

async function loadMessages(
  conversationId
) {

  const container =
    document.querySelector(
      "#mensagensLista"
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
      <p>
        Não foi possível carregar as mensagens.
      </p>
    `;

    return;
  }


  if (!data?.length) {

    container.innerHTML = `
      <div class="empty-messages">
        Nenhuma mensagem ainda.
      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map((message) => {

        const mine =
          message.remetente_id ===
          currentUser?.id;


        return `

          <div
            class="
              message
              ${mine
                ? "message-own"
                : "message-other"}
            "
          >

            <div class="message-content">

              <p>
                ${esc(
                  message.conteudo
                )}
              </p>

              <time>
                ${formatDateTime(
                  message.criado_em
                )}
              </time>

            </div>

          </div>

        `;
      })
      .join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   21. ENVIAR MENSAGEM
   ========================================================= */

function setupMessageForm(
  conversationId
) {

  const form =
    document.querySelector(
      "#mensagemForm"
    );

  if (!form) return;


  if (
    form.dataset.ready === "true"
  ) {
    return;
  }


  form.dataset.ready = "true";


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const input =
        document.querySelector(
          "#mensagemInput"
        );


      const button =
        document.querySelector(
          "#mensagemEnviar"
        );


      const content =
        input?.value.trim();


      if (!content) return;


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
              content

          });


      if (error) {

        console.error(
          "Erro ao enviar mensagem:",
          error
        );

        alert(
          "Não foi possível enviar a mensagem."
        );

        if (button) {
          button.disabled = false;
        }

        return;
      }


      if (input) {
        input.value = "";
      }


      await loadMessages(
        conversationId
      );


      if (button) {
        button.disabled = false;
      }
    }
  );
}


/* =========================================================
   22. NOTIFICAÇÕES
   ========================================================= */

async function loadNotifications() {

  const container =
    document.querySelector(
      "#notificacoesLista"
    );

  if (!container) return;


  const profile =
    await ensureProfile();


  if (!profile || !currentUser) {

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
      <div class="empty-state">
        Nenhuma notificação.
      </div>
    `;

    return;
  }


  container.innerHTML =
    data
      .map((notification) => {

        return `

          <a
            href="${
              notification.link
                ? esc(notification.link)
                : "#"
            }"
            class="
              notification-card
              ${notification.lida
                ? "is-read"
                : "is-unread"}
            "
            data-notification-id="${esc(
              notification.id
            )}"
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

            <time>
              ${formatDateTime(
                notification.criado_em
              )}
            </time>

          </a>

        `;
      })
      .join("");


  bindNotificationActions();
}


/* =========================================================
   23. MARCAR NOTIFICAÇÃO COMO LIDA
   ========================================================= */

function bindNotificationActions() {

  document
    .querySelectorAll(
      "[data-notification-id]"
    )
    .forEach((element) => {

      element.addEventListener(
        "click",
        async () => {

          const id =
            element.dataset
              .notificationId;


          if (!id) return;


          await supabase
            .from(TABLES.NOTIFICACOES)
            .update({
              lida: true
            })
            .eq(
              "id",
              id
            );
        }
      );
    });
}


/* =========================================================
   24. PÁGINA ADMIN
   ========================================================= */

async function loadAdminPage() {

  const allowed =
    await requireAdmin();


  if (!allowed) return;


  await adminStats();

  await adminUsers();

  /*
    Futuramente:

    await adminProducts();
    await adminServices();
    await adminProjects();
    await adminPosts();
    await adminRequests();
    await adminConversations();
  */
}


/* =========================================================
   25. INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await updateNav();

    await setupLogin();

    await setupSignup();

    setupAdminRequestButton();

    await account();

    await loadConversations();

    await loadConversation();

    await loadNotifications();


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


    if (
      logoutButton &&
      !logoutButton.dataset.bound
    ) {

      logoutButton.dataset.bound =
        "true";


      logoutButton.addEventListener(
        "click",
        logout
      );
    }

  }
);


/* =========================================================
   26. MUDANÇA DE AUTENTICAÇÃO
   ========================================================= */

supabase.auth.onAuthStateChange(
  async () => {

    await updateNav();

  }
);
