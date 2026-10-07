/* =========================================================
   MAX SOM
   MAIN.JS — PARTE 1
   Base, Supabase, configurações e funções auxiliares
   ========================================================= */


/* =========================================================
   1. SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://diabhunpflawknocixit.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_GrFU5c86UZESBh3qs1znQw__ZMNVAnC";


if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {

  console.error(
    "Supabase JS não foi carregado."
  );

}


var supabase =
  window.supabase?.createClient
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

  USUARIO:
    "usuario",

  PRODUTOS:
    "produtos",

  SERVICOS:
    "servicos",

  SOLICITACOES:
    "solicitações_servico",

  CONVERSAS:
    "conversas",

  MENSAGENS:
    "mensagem",

  ARQUIVOS:
    "arquivos",

  NOTIFICACOES:
    "notificacao",

  PROJETOS:
    "projetos",

  PUBLICACOES:
    "publicacoes"

};



/* =========================================================
   3. ESTADO ATUAL
   ========================================================= */

let currentUser =
  null;

let currentProfile =
  null;



/* =========================================================
   4. FUNÇÕES AUXILIARES
   ========================================================= */


/*
 * Procura o primeiro elemento existente
 * entre os seletores informados.
 */

function qs(
  ...selectors
) {

  return (

    selectors

      .map(
        (selector) =>
          document.querySelector(
            selector
          )
      )

      .find(Boolean)

      || null

  );

}



/*
 * Protege textos antes de colocar
 * valores do banco dentro do HTML.
 */

function esc(
  value
) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}



/*
 * Padroniza o tipo do usuário.
 */

function normalizeType(
  type
) {

  return String(
    type || ""
  )

    .trim()

    .toLowerCase();

}



/*
 * Verifica se o perfil possui
 * um tipo administrativo.
 */

function isAdmin(
  profile = currentProfile
) {

  const type =
    normalizeType(
      profile?.tipo_usuario
    );

  return ADMIN_TYPES.includes(
    type
  );

}



/*
 * Verifica se existe usuário logado.
 */

function isLoggedIn() {

  return !!currentUser;

}



/*
 * Formata somente a data.
 */

function formatDate(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleDateString(
    "pt-BR",
    {

      day: "2-digit",

      month: "2-digit",

      year: "numeric"

    }
  );

}



/*
 * Formata data e hora.
 */

function formatDateTime(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleString(
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



/*
 * Descobre qual página está aberta.
 */

function getCurrentPage() {

  const path =
    window.location.pathname

      .split("/")

      .pop()

      .toLowerCase();


  return (
    path ||
    "index.html"
  );

}



/*
 * Exibe uma mensagem dentro
 * de um elemento do HTML.
 */

function showMessage(
  element,
  text,
  type = "info"
) {

  if (!element) {
    return;
  }


  element.textContent =
    text || "";


  element.classList.remove(

    "hidden",

    "message-info",

    "message-success",

    "message-error"

  );


  element.classList.add(
    `message-${type}`
  );

}



/*
 * Limpa uma mensagem.
 */

function clearMessage(
  element
) {

  if (!element) {
    return;
  }


  element.textContent =
    "";


  element.classList.add(
    "hidden"
  );


  element.classList.remove(

    "message-info",

    "message-success",

    "message-error"

  );

}



/*
 * Coloca um botão em estado
 * de carregamento.
 */

function setButtonLoading(
  button,
  loading,
  normalText
) {

  if (!button) {
    return;
  }


  button.disabled =
    loading;


  if (loading) {

    button.dataset.originalText =
      button.textContent.trim();

    button.textContent =
      "Aguarde...";

    return;
  }


  button.textContent =

    normalText ||

    button.dataset.originalText ||

    button.textContent;

}



/*
 * Mostra um erro do Supabase
 * de maneira mais útil.
 */

function dbError(
  error,
  fallback =
    "Ocorreu um erro."
) {

  console.error(
    error
  );


  return (

    error?.message ||

    error?.details ||

    error?.hint ||

    fallback

  );

}



/* =========================================================
   5. USUÁRIO / PERFIL
   ========================================================= */

async function ensureProfile() {

  if (!supabase) {
    return null;
  }


  const {

    data: {
      user
    },

    error: userError

  } =

    await supabase.auth.getUser();


  if (
    userError ||
    !user
  ) {

    currentUser =
      null;

    currentProfile =
      null;

    return null;

  }


  currentUser =
    user;


  const {

    data,

    error

  } =

    await supabase

      .from(
        TABLES.USUARIO
      )

      .select("*")

      .eq(
        "id",
        user.id
      )

      .maybeSingle();


  if (error) {

    console.error(
      "Erro ao buscar perfil:",
      error
    );

    currentProfile =
      null;

    return null;

  }


  currentProfile =
    data || null;


  return currentProfile;

}



/*
 * Retorna somente o usuário
 * autenticado no Supabase Auth.
 */

async function getAuthenticatedUser() {

  if (!supabase) {
    return null;
  }


  const {

    data: {
      user
    },

    error

  } =

    await supabase.auth.getUser();


  if (
    error ||
    !user
  ) {

    return null;

  }


  currentUser =
    user;


  return user;

}



/* =========================================================
   FIM DA PARTE 1
   ========================================================= */
/* =========================================================
   6. NAVEGAÇÃO
   ========================================================= */


/*
 * Atualiza todos os elementos do menu conforme
 * o estado atual do usuário.
 */

async function updateNav() {

  if (!supabase) {
    return;
  }


  const profile =
    await ensureProfile();


  const logged =
    !!currentUser;


  const admin =
    isAdmin(profile);



  /* =====================================================
     ELEMENTOS DE VISITANTE
     ===================================================== */

  document
    .querySelectorAll(
      "[data-guest-only]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? "none"
            : "";

      }
    );



  /* =====================================================
     ELEMENTOS DE USUÁRIO LOGADO
     ===================================================== */

  document
    .querySelectorAll(
      "[data-logged-only]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? ""
            : "none";

      }
    );



  /* =====================================================
     ELEMENTOS EXCLUSIVOS DO ADMIN
     ===================================================== */

  document
    .querySelectorAll(
      "[data-admin-only]"
    )
    .forEach(
      (element) => {

        element.style.display =
          admin
            ? ""
            : "none";

      }
    );



  /* =====================================================
     LINKS DE CONVERSAS
     ===================================================== */

  document
    .querySelectorAll(
      "[data-conversations-link]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? ""
            : "none";

      }
    );



  /* =====================================================
     SAIR
     ===================================================== */

  document
    .querySelectorAll(
      "[data-logout]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? ""
            : "none";


        if (
          element.dataset.logoutBound ===
          "true"
        ) {

          return;

        }


        element.dataset.logoutBound =
          "true";


        element.addEventListener(
          "click",
          async (event) => {

            event.preventDefault();

            await logout();

          }
        );

      }
    );



  /* =====================================================
     ATUALIZA LINK ADMIN ESPECÍFICO
     ===================================================== */

  const adminLink =
    qs(
      "#adminLink"
    );


  if (adminLink) {

    adminLink.style.display =
      admin
        ? ""
        : "none";

  }



  /* =====================================================
     ATUALIZA LINK DA CONTA
     ===================================================== */

  const accountLink =
    qs(
      "#accountLink"
    );


  if (accountLink) {

    accountLink.style.display =
      logged
        ? ""
        : "none";

  }



  /* =====================================================
     ATUALIZA LINK LOGIN
     ===================================================== */

  const loginLink =
    qs(
      "#loginLink"
    );


  if (loginLink) {

    loginLink.style.display =
      logged
        ? "none"
        : "";

  }



  /* =====================================================
     ATUALIZA LINK CADASTRO
     ===================================================== */

  const signupLink =
    qs(
      "#signupLink"
    );


  if (signupLink) {

    signupLink.style.display =
      logged
        ? "none"
        : "";

  }

}



/* =========================================================
   7. SINCRONIZAÇÃO DO PERFIL
   ========================================================= */


/*
 * Garante que os dados informados no cadastro
 * sejam gravados na tabela usuario.
 */

async function syncProfileData(
  user,
  values = {}
) {

  if (
    !user ||
    !supabase
  ) {

    return null;

  }


  const nome =
    String(
      values.nome ||
      user.user_metadata?.nome ||
      user.email?.split("@")[0] ||
      "Cliente"
    )
      .trim();


  const telefone =
    String(
      values.telefone ||
      user.user_metadata?.telefone ||
      ""
    )
      .trim();


  const whatsapp =
    String(
      values.whatsapp ||
      user.user_metadata?.whatsapp ||
      ""
    )
      .trim();



  /*
   * Primeiro tenta localizar
   * o perfil existente.
   */

  const {
    data: existing,
    error: readError
  } =

    await supabase

      .from(
        TABLES.USUARIO
      )

      .select("*")

      .eq(
        "id",
        user.id
      )

      .maybeSingle();



  if (readError) {

    console.error(
      "Erro ao consultar perfil:",
      readError
    );

    return null;

  }



  /* =====================================================
     PERFIL JÁ EXISTE
     ===================================================== */

  if (existing) {

    const updateData = {};


    if (
      nome &&
      !existing.nome
    ) {

      updateData.nome =
        nome;

    }


    if (
      telefone &&
      !existing.telefone
    ) {

      updateData.telefone =
        telefone;

    }


    if (
      whatsapp &&
      !existing.whatsapp
    ) {

      updateData.whatsapp =
        whatsapp;

    }


    if (
      Object.keys(
        updateData
      ).length
    ) {

      const {
        data,
        error
      } =

        await supabase

          .from(
            TABLES.USUARIO
          )

          .update(
            updateData
          )

          .eq(
            "id",
            user.id
          )

          .select("*")

          .single();


      if (error) {

        console.error(
          "Erro ao atualizar perfil:",
          error
        );

        return existing;

      }


      currentProfile =
        data || existing;


      currentUser =
        user;


      return currentProfile;

    }


    currentProfile =
      existing;


    currentUser =
      user;


    return existing;

  }



  /* =====================================================
     PERFIL AINDA NÃO EXISTE
     ===================================================== */

  const newProfile = {

    id:
      user.id,

    nome:
      nome,

    telefone:
      telefone || null,

    whatsapp:
      whatsapp || null,

    tipo_usuario:
      "cliente"

  };



  const {
    data,
    error
  } =

    await supabase

      .from(
        TABLES.USUARIO
      )

      .insert(
        newProfile
      )

      .select("*")

      .single();



  if (error) {

    console.error(
      "Erro ao criar perfil:",
      error
    );

    return null;

  }



  currentUser =
    user;


  currentProfile =
    data || null;


  return currentProfile;

}



/* =========================================================
   8. CADASTRO
   ========================================================= */

async function setupSignup() {

  const form =
    qs(
      "#signupForm",
      "#formCadastro"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.signupBound ===
    "true"
  ) {

    return;

  }


  form.dataset.signupBound =
    "true";



  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();



      const nome =
        qs(
          "#signupNome",
          "#nome"
        )
          ?.value
          .trim();


      const telefone =
        qs(
          "#signupTelefone",
          "#telefone"
        )
          ?.value
          .trim();


      const whatsapp =
        qs(
          "#signupWhatsapp",
          "#whatsapp"
        )
          ?.value
          .trim();


      const email =
        qs(
          "#signupEmail",
          "#email"
        )
          ?.value
          .trim()
          .toLowerCase();


      const password =
        qs(
          "#signupPassword",
          "#senha"
        )
          ?.value;



      const message =
        qs(
          "#signupError",
          "#mensagemCadastro"
        );


      const button =
        form.querySelector(
          "button[type='submit']"
        );



      clearMessage(
        message
      );


      if (
        !nome ||
        !email ||
        !password
      ) {

        showMessage(
          message,
          "Preencha seu nome, e-mail e senha.",
          "error"
        );

        return;

      }



      setButtonLoading(
        button,
        true,
        "Criar conta"
      );



      try {

        const profileValues = {

          nome:
            nome,

          telefone:
            telefone,

          whatsapp:
            whatsapp

        };



        const {
          data,
          error
        } =

          await supabase.auth.signUp({

            email:
              email,

            password:
              password,

            options: {

              data: {

                nome:
                  nome,

                telefone:
                  telefone,

                whatsapp:
                  whatsapp

              }

            }

          });



        if (error) {

          throw error;

        }



        const user =
          data?.user;



        if (!user) {

          throw new Error(
            "Não foi possível criar o usuário."
          );

        }



        /*
         * Se o Supabase criou uma sessão imediatamente,
         * podemos criar/atualizar o perfil agora.
         */

        if (
          data?.session
        ) {

          await syncProfileData(
            user,
            profileValues
          );


          showMessage(
            message,
            "Conta criada com sucesso. Entrando...",
            "success"
          );


          setTimeout(
            () => {

              window.location.href =
                "conta.html";

            },
            500
          );


          return;

        }



        /*
         * Quando a confirmação de e-mail está ativa,
         * o usuário ainda não terá sessão.
         */

        showMessage(
          message,
          "Conta criada. Confirme seu e-mail e depois faça login para acessar sua conta.",
          "success"
        );


        form.reset();



      } catch (error) {

        console.error(
          "Erro no cadastro:",
          error
        );


        showMessage(
          message,
          dbError(
            error,
            "Não foi possível criar a conta."
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

    }
  );

}



/* =========================================================
   9. LOGIN
   ========================================================= */

async function setupLogin() {

  const form =
    qs(
      "#loginForm",
      "#formLogin"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.loginBound ===
    "true"
  ) {

    return;

  }


  form.dataset.loginBound =
    "true";



  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();



      const email =
        qs(
          "#loginEmail",
          "#email"
        )
          ?.value
          .trim()
          .toLowerCase();


      const password =
        qs(
          "#loginPassword",
          "#senha"
        )
          ?.value;



      const message =
        qs(
          "#loginError",
          "#mensagemLogin"
        );


      const button =
        form.querySelector(
          "button[type='submit']"
        );



      clearMessage(
        message
      );


      if (
        !email ||
        !password
      ) {

        showMessage(
          message,
          "Preencha o e-mail e a senha.",
          "error"
        );

        return;

      }



      setButtonLoading(
        button,
        true,
        "Entrar"
      );



      try {

        const {
          data,
          error
        } =

          await supabase.auth.signInWithPassword({

            email:
              email,

            password:
              password

          });



        if (error) {

          throw error;

        }



        if (
          !data?.user
        ) {

          throw new Error(
            "A sessão não foi criada."
          );

        }



        /*
         * Recupera os dados do perfil.
         */

        const profile =
          await syncProfileData(
            data.user
          );



        showMessage(
          message,
          "Login realizado com sucesso. Entrando...",
          "success"
        );



        /*
         * Redirecionamento correto:
         *
         * administrador → admin.html
         * cliente → conta.html
         */

        if (
          isAdmin(
            profile
          )
        ) {

          window.location.href =
            "admin.html";

        } else {

          window.location.href =
            "conta.html";

        }



      } catch (error) {

        console.error(
          "Erro no login:",
          error
        );


        showMessage(
          message,
          "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
          "error"
        );


      } finally {

        setButtonLoading(
          button,
          false,
          "Entrar"
        );

      }

    }
  );

}



/* =========================================================
   10. LOGOUT
   ========================================================= */

async function logout() {

  if (!supabase) {
    return;
  }


  const {
    error
  } =
    await supabase.auth.signOut();



  if (error) {

    console.error(
      "Erro ao sair:",
      error
    );


    alert(
      "Não foi possível sair da conta."
    );


    return;

  }



  currentUser =
    null;


  currentProfile =
    null;


  window.location.href =
    "index.html";

}



/* =========================================================
   11. LISTENER DE AUTENTICAÇÃO
   ========================================================= */


/*
 * Mantém o menu sincronizado quando:
 *
 * login
 * logout
 * atualização de sessão
 * recuperação de sessão
 */

function setupAuthListener() {

  if (!supabase) {
    return;
  }


  if (
    window.maxSomAuthListener
  ) {

    return;

  }


  window.maxSomAuthListener =
    true;



  supabase.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      currentUser =
        session?.user ||
        null;


      if (currentUser) {

        await syncProfileData(
          currentUser
        );

      } else {

        currentProfile =
          null;

      }


      await updateNav();


      /*
       * Páginas protegidas.
       */

      const page =
        getCurrentPage();



      if (
        event ===
        "SIGNED_OUT"
      ) {

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
   12. PROTEÇÃO DO PAINEL ADMINISTRATIVO
   ========================================================= */

async function requireAdmin() {

  const profile =
    await ensureProfile();



  if (
    !profile ||
    !isAdmin(
      profile
    )
  ) {

    /*
     * Se não estiver logado,
     * manda para login.
     */

    if (!currentUser) {

      window.location.href =
        "login.html";

      return false;

    }



    /*
     * Se estiver logado mas não for admin,
     * volta para a Home.
     */

    window.location.href =
      "index.html";

    return false;

  }


  return true;

}



/* =========================================================
   13. REDIRECIONAMENTO APÓS LOGIN
   ========================================================= */


/*
 * Impede que um administrador já logado
 * fique parado na tela de login.
 */

async function redirectAuthenticatedUser() {

  const page =
    getCurrentPage();


  if (
    page !==
    "login.html"
  ) {

    return;

  }


  if (!currentUser) {

    return;

  }

await ensureProfile();

window.location.href =
  "conta.html";
}
/* =========================================================
   14. PROTEÇÃO DAS PÁGINAS DE CONTA
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


  if (
    !currentUser
  ) {

    window.location.href =
      "login.html";

    return;

  }


  await ensureProfile();

}



/* =========================================================
   15. PROTEÇÃO DA PÁGINA ADMIN
   ========================================================= */

async function checkAdminPage() {

  const page =
    getCurrentPage();


  if (
    page !==
    "admin.html"
  ) {

    return true;

  }


  return await requireAdmin();

}



/* =========================================================
   FIM DA PARTE 2
   ========================================================= */
/* =========================================================
   6. NAVEGAÇÃO
   ========================================================= */


/*
 * Atualiza todos os elementos do menu conforme
 * o estado atual do usuário.
 */

async function updateNav() {

  if (!supabase) {
    return;
  }


  const profile =
    await ensureProfile();


  const logged =
    !!currentUser;


  const admin =
    isAdmin(profile);



  /* =====================================================
     ELEMENTOS DE VISITANTE
     ===================================================== */

  document
    .querySelectorAll(
      "[data-guest-only]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? "none"
            : "";

      }
    );



  /* =====================================================
     ELEMENTOS DE USUÁRIO LOGADO
     ===================================================== */

  document
    .querySelectorAll(
      "[data-logged-only]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? ""
            : "none";

      }
    );



  /* =====================================================
     ELEMENTOS EXCLUSIVOS DO ADMIN
     ===================================================== */

  document
    .querySelectorAll(
      "[data-admin-only]"
    )
    .forEach(
      (element) => {

        element.style.display =
          admin
            ? ""
            : "none";

      }
    );



  /* =====================================================
     LINKS DE CONVERSAS
     ===================================================== */

  document
    .querySelectorAll(
      "[data-conversations-link]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? ""
            : "none";

      }
    );



  /* =====================================================
     SAIR
     ===================================================== */

  document
    .querySelectorAll(
      "[data-logout]"
    )
    .forEach(
      (element) => {

        element.style.display =
          logged
            ? ""
            : "none";


        if (
          element.dataset.logoutBound ===
          "true"
        ) {

          return;

        }


        element.dataset.logoutBound =
          "true";


        element.addEventListener(
          "click",
          async (event) => {

            event.preventDefault();

            await logout();

          }
        );

      }
    );



  /* =====================================================
     ATUALIZA LINK ADMIN ESPECÍFICO
     ===================================================== */

  const adminLink =
    qs(
      "#adminLink"
    );


  if (adminLink) {

    adminLink.style.display =
      admin
        ? ""
        : "none";

  }



  /* =====================================================
     ATUALIZA LINK DA CONTA
     ===================================================== */

  const accountLink =
    qs(
      "#accountLink"
    );


  if (accountLink) {

    accountLink.style.display =
      logged
        ? ""
        : "none";

  }



  /* =====================================================
     ATUALIZA LINK LOGIN
     ===================================================== */

  const loginLink =
    qs(
      "#loginLink"
    );


  if (loginLink) {

    loginLink.style.display =
      logged
        ? "none"
        : "";

  }



  /* =====================================================
     ATUALIZA LINK CADASTRO
     ===================================================== */

  const signupLink =
    qs(
      "#signupLink"
    );


  if (signupLink) {

    signupLink.style.display =
      logged
        ? "none"
        : "";

  }

}



/* =========================================================
   7. SINCRONIZAÇÃO DO PERFIL
   ========================================================= */


/*
 * Garante que os dados informados no cadastro
 * sejam gravados na tabela usuario.
 */

async function syncProfileData(
  user,
  values = {}
) {

  if (
    !user ||
    !supabase
  ) {

    return null;

  }


  const nome =
    String(
      values.nome ||
      user.user_metadata?.nome ||
      user.email?.split("@")[0] ||
      "Cliente"
    )
      .trim();


  const telefone =
    String(
      values.telefone ||
      user.user_metadata?.telefone ||
      ""
    )
      .trim();


  const whatsapp =
    String(
      values.whatsapp ||
      user.user_metadata?.whatsapp ||
      ""
    )
      .trim();



  /*
   * Primeiro tenta localizar
   * o perfil existente.
   */

  const {
    data: existing,
    error: readError
  } =

    await supabase

      .from(
        TABLES.USUARIO
      )

      .select("*")

      .eq(
        "id",
        user.id
      )

      .maybeSingle();



  if (readError) {

    console.error(
      "Erro ao consultar perfil:",
      readError
    );

    return null;

  }



  /* =====================================================
     PERFIL JÁ EXISTE
     ===================================================== */

  if (existing) {

    const updateData = {};


    if (
      nome &&
      !existing.nome
    ) {

      updateData.nome =
        nome;

    }


    if (
      telefone &&
      !existing.telefone
    ) {

      updateData.telefone =
        telefone;

    }


    if (
      whatsapp &&
      !existing.whatsapp
    ) {

      updateData.whatsapp =
        whatsapp;

    }


    if (
      Object.keys(
        updateData
      ).length
    ) {

      const {
        data,
        error
      } =

        await supabase

          .from(
            TABLES.USUARIO
          )

          .update(
            updateData
          )

          .eq(
            "id",
            user.id
          )

          .select("*")

          .single();


      if (error) {

        console.error(
          "Erro ao atualizar perfil:",
          error
        );

        return existing;

      }


      currentProfile =
        data || existing;


      currentUser =
        user;


      return currentProfile;

    }


    currentProfile =
      existing;


    currentUser =
      user;


    return existing;

  }



  /* =====================================================
     PERFIL AINDA NÃO EXISTE
     ===================================================== */

  const newProfile = {

    id:
      user.id,

    nome:
      nome,

    telefone:
      telefone || null,

    whatsapp:
      whatsapp || null,

    tipo_usuario:
      "cliente"

  };



  const {
    data,
    error
  } =

    await supabase

      .from(
        TABLES.USUARIO
      )

      .insert(
        newProfile
      )

      .select("*")

      .single();



  if (error) {

    console.error(
      "Erro ao criar perfil:",
      error
    );

    return null;

  }



  currentUser =
    user;


  currentProfile =
    data || null;


  return currentProfile;

}



/* =========================================================
   8. CADASTRO
   ========================================================= */

async function setupSignup() {

  const form =
    qs(
      "#signupForm",
      "#formCadastro"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.signupBound ===
    "true"
  ) {

    return;

  }


  form.dataset.signupBound =
    "true";



  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();



      const nome =
        qs(
          "#signupNome",
          "#nome"
        )
          ?.value
          .trim();


      const telefone =
        qs(
          "#signupTelefone",
          "#telefone"
        )
          ?.value
          .trim();


      const whatsapp =
        qs(
          "#signupWhatsapp",
          "#whatsapp"
        )
          ?.value
          .trim();


      const email =
        qs(
          "#signupEmail",
          "#email"
        )
          ?.value
          .trim()
          .toLowerCase();


      const password =
        qs(
          "#signupPassword",
          "#senha"
        )
          ?.value;



      const message =
        qs(
          "#signupError",
          "#mensagemCadastro"
        );


      const button =
        form.querySelector(
          "button[type='submit']"
        );



      clearMessage(
        message
      );


      if (
        !nome ||
        !email ||
        !password
      ) {

        showMessage(
          message,
          "Preencha seu nome, e-mail e senha.",
          "error"
        );

        return;

      }



      setButtonLoading(
        button,
        true,
        "Criar conta"
      );



      try {

        const profileValues = {

          nome:
            nome,

          telefone:
            telefone,

          whatsapp:
            whatsapp

        };



        const {
          data,
          error
        } =

          await supabase.auth.signUp({

            email:
              email,

            password:
              password,

            options: {

              data: {

                nome:
                  nome,

                telefone:
                  telefone,

                whatsapp:
                  whatsapp

              }

            }

          });



        if (error) {

          throw error;

        }



        const user =
          data?.user;



        if (!user) {

          throw new Error(
            "Não foi possível criar o usuário."
          );

        }



        /*
         * Se o Supabase criou uma sessão imediatamente,
         * podemos criar/atualizar o perfil agora.
         */

        if (
          data?.session
        ) {

          await syncProfileData(
            user,
            profileValues
          );


          showMessage(
            message,
            "Conta criada com sucesso. Entrando...",
            "success"
          );


          setTimeout(
            () => {

              window.location.href =
                "conta.html";

            },
            500
          );


          return;

        }



        /*
         * Quando a confirmação de e-mail está ativa,
         * o usuário ainda não terá sessão.
         */

        showMessage(
          message,
          "Conta criada. Confirme seu e-mail e depois faça login para acessar sua conta.",
          "success"
        );


        form.reset();



      } catch (error) {

        console.error(
          "Erro no cadastro:",
          error
        );


        showMessage(
          message,
          dbError(
            error,
            "Não foi possível criar a conta."
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

    }
  );

}



/* =========================================================
   9. LOGIN
   ========================================================= */

async function setupLogin() {

  const form =
    qs(
      "#loginForm",
      "#formLogin"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.loginBound ===
    "true"
  ) {

    return;

  }


  form.dataset.loginBound =
    "true";



  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();



      const email =
        qs(
          "#loginEmail",
          "#email"
        )
          ?.value
          .trim()
          .toLowerCase();


      const password =
        qs(
          "#loginPassword",
          "#senha"
        )
          ?.value;



      const message =
        qs(
          "#loginError",
          "#mensagemLogin"
        );


      const button =
        form.querySelector(
          "button[type='submit']"
        );



      clearMessage(
        message
      );


      if (
        !email ||
        !password
      ) {

        showMessage(
          message,
          "Preencha o e-mail e a senha.",
          "error"
        );

        return;

      }



      setButtonLoading(
        button,
        true,
        "Entrar"
      );



      try {

        const {
          data,
          error
        } =

          await supabase.auth.signInWithPassword({

            email:
              email,

            password:
              password

          });



        if (error) {

          throw error;

        }



        if (
          !data?.user
        ) {

          throw new Error(
            "A sessão não foi criada."
          );

        }



        /*
         * Recupera os dados do perfil.
         */

        const profile =
          await syncProfileData(
            data.user
          );



        showMessage(
          message,
          "Login realizado com sucesso. Entrando...",
          "success"
        );



        /*
         * Redirecionamento correto:
         *
         * administrador → admin.html
         * cliente → conta.html
         */

        if (
          isAdmin(
            profile
          )
        ) {

          window.location.href =
            "admin.html";

        } else {

          window.location.href =
            "conta.html";

        }



      } catch (error) {

        console.error(
          "Erro no login:",
          error
        );


        showMessage(
          message,
          "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
          "error"
        );


      } finally {

        setButtonLoading(
          button,
          false,
          "Entrar"
        );

      }

    }
  );

}



/* =========================================================
   10. LOGOUT
   ========================================================= */

async function logout() {

  if (!supabase) {
    return;
  }


  const {
    error
  } =
    await supabase.auth.signOut();



  if (error) {

    console.error(
      "Erro ao sair:",
      error
    );


    alert(
      "Não foi possível sair da conta."
    );


    return;

  }



  currentUser =
    null;


  currentProfile =
    null;


  window.location.href =
    "index.html";

}



/* =========================================================
   11. LISTENER DE AUTENTICAÇÃO
   ========================================================= */


/*
 * Mantém o menu sincronizado quando:
 *
 * login
 * logout
 * atualização de sessão
 * recuperação de sessão
 */

function setupAuthListener() {

  if (!supabase) {
    return;
  }


  if (
    window.maxSomAuthListener
  ) {

    return;

  }


  window.maxSomAuthListener =
    true;



  supabase.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      currentUser =
        session?.user ||
        null;


      if (currentUser) {

        await syncProfileData(
          currentUser
        );

      } else {

        currentProfile =
          null;

      }


      await updateNav();


      /*
       * Páginas protegidas.
       */

      const page =
        getCurrentPage();



      if (
        event ===
        "SIGNED_OUT"
      ) {

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
   12. PROTEÇÃO DO PAINEL ADMINISTRATIVO
   ========================================================= */

async function requireAdmin() {

  const profile =
    await ensureProfile();



  if (
    !profile ||
    !isAdmin(
      profile
    )
  ) {

    /*
     * Se não estiver logado,
     * manda para login.
     */

    if (!currentUser) {

      window.location.href =
        "login.html";

      return false;

    }



    /*
     * Se estiver logado mas não for admin,
     * volta para a Home.
     */

    window.location.href =
      "index.html";

    return false;

  }


  return true;

}



/* =========================================================
   13. REDIRECIONAMENTO APÓS LOGIN
   ========================================================= */


/*
 * Impede que um administrador já logado
 * fique parado na tela de login.
 */

async function redirectAuthenticatedUser() {

  const page =
    getCurrentPage();


  if (
    page !==
    "login.html"
  ) {

    return;

  }


  if (!currentUser) {

    return;

  }


  const profile =
    await ensureProfile();


  if (
    isAdmin(
      profile
    )
  ) {

    window.location.href =
      "admin.html";

  } else {

    window.location.href =
      "conta.html";

  }

}



/* =========================================================
   14. PROTEÇÃO DAS PÁGINAS DE CONTA
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


  if (
    !currentUser
  ) {

    window.location.href =
      "login.html";

    return;

  }


  await ensureProfile();

}



/* =========================================================
   15. PROTEÇÃO DA PÁGINA ADMIN
   ========================================================= */

async function checkAdminPage() {

  const page =
    getCurrentPage();


  if (
    page !==
    "admin.html"
  ) {

    return true;

  }


  return await requireAdmin();

}



/* =========================================================
   FIM DA PARTE 2
   ========================================================= */
/* =========================================================
   38. PRODUTOS PÚBLICOS
   ========================================================= */

async function loadPublicProducts() {

  const container =
    qs(
      "#productsGrid",
      "#produtosLista",
      "#productsList",
      "#produtosContainer"
    );


  if (
    !container ||
    !supabase
  ) {

    return;

  }



  const page =
    getCurrentPage();


  let query =
    supabase

      .from(
        TABLES.PRODUTOS
      )

      .select(
        `
          id,
          categoria_id,
          marca_id,
          nome,
          modelo,
          descricao,
          especificacoes,
          imagem_capa,
          disponivel,
          destaque
        `
      )

      .eq(
        "disponivel",
        true
      );



  /*
   * Na Home:
   * mostra somente produtos marcados
   * como destaque.
   */

  if (
    page ===
    "index.html"
  ) {

    query =
      query
        .eq(
          "destaque",
          true
        )
        .limit(
          6
        );

  }



  const {
    data,
    error
  } =
    await query

      .order(
        "destaque",
        {
          ascending:
            false
        }
      )

      .order(
        "criado_em",
        {
          ascending:
            false
        }
      );



  if (error) {

    console.error(
      "Erro ao carregar produtos:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        Não foi possível carregar os produtos.

      </div>

    `;

    return;

  }



  if (
    !data ||
    !data.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Nenhum produto disponível
        </h3>

        <p>
          Nenhum produto foi cadastrado ou publicado ainda.
        </p>

      </div>

    `;

    return;

  }



  container.innerHTML =

    data

      .map(
        (product) => `

          <article
            class="product-card"
          >

            ${
              product.imagem_capa

                ? `

                  <img
                    src="${esc(
                      product.imagem_capa
                    )}"
                    alt="${esc(
                      product.nome ||
                      "Produto Max Som"
                    )}"
                    loading="lazy"
                  >

                `

                : `

                  <div class="product-image">
                    Max Som
                  </div>

                `
            }


            <div
              class="product-info"
            >

              <span>
                Equipamento
              </span>


              <h3>
                ${esc(
                  product.nome ||
                  "Produto"
                )}
              </h3>


              ${
                product.modelo

                  ? `

                    <p>
                      <strong>
                        Modelo:
                      </strong>

                      ${esc(
                        product.modelo
                      )}
                    </p>

                  `

                  : ""
              }


              ${
                product.descricao

                  ? `

                    <p>
                      ${esc(
                        product.descricao
                      )}
                    </p>

                  `

                  : `

                    <p>
                      Consulte a Max Som
                      para mais informações.
                    </p>

                  `
              }


              ${
                product.especificacoes

                  ? `

                    <details>

                      <summary>
                        Especificações
                      </summary>

                      <p>
                        ${esc(
                          product.especificacoes
                        )}
                      </p>

                    </details>

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
   39. SERVIÇOS PÚBLICOS
   ========================================================= */

async function loadPublicServices() {

  const container =
    qs(
      "#servicesGrid",
      "#servicosLista",
      "#servicesList",
      "#servicosContainer"
    );


  if (
    !container ||
    !supabase
  ) {

    return;

  }



  const page =
    getCurrentPage();



  let query =
    supabase

      .from(
        TABLES.SERVICOS
      )

      .select(
        `
          id,
          nome,
          descricao,
          imagem_capa,
          ativo
        `
      )

      .eq(
        "ativo",
        true
      );



  /*
   * A Home recebe uma quantidade reduzida
   * para funcionar como destaque.
   */

  if (
    page ===
    "index.html"
  ) {

    query =
      query.limit(
        6
      );

  }



  const {
    data,
    error
  } =
    await query

      .order(
        "criado_em",
        {
          ascending:
            false
        }
      );



  if (error) {

    console.error(
      "Erro ao carregar serviços:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        Não foi possível carregar os serviços.

      </div>

    `;

    return;

  }



  if (
    !data ||
    !data.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Nenhum serviço disponível
        </h3>

        <p>
          Nenhum serviço foi cadastrado ainda.
        </p>

      </div>

    `;

    return;

  }



  container.innerHTML =

    data

      .map(
        (service) => `

          <article
            class="service-card"
          >

            ${
              service.imagem_capa

                ? `

                  <img
                    src="${esc(
                      service.imagem_capa
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


            <div
              class="service-info"
            >

              <h3>
                ${esc(
                  service.nome ||
                  "Serviço"
                )}
              </h3>


              <p>
                ${esc(
                  service.descricao ||
                  "Consulte a Max Som para conhecer este serviço."
                )}
              </p>


              <span
                class="service-price"
              >
                Sob orçamento
              </span>


              <a
                href="atendimento.html?servico=${encodeURIComponent(
                  service.nome ||
                  "Atendimento"
                )}"
                class="btn btn-primary"
              >
                Solicitar atendimento
              </a>

            </div>

          </article>

        `
      )

      .join("");

}



/* =========================================================
   40. PROJETOS PÚBLICOS
   ========================================================= */

async function loadPublicProjects() {

  const container =
    qs(
      "#projectsGrid",
      "#projetosLista",
      "#projectsList",
      "#projetosContainer"
    );


  if (
    !container ||
    !supabase
  ) {

    return;

  }



  const page =
    getCurrentPage();



  let query =
    supabase

      .from(
        TABLES.PROJETOS
      )

      .select(
        `
          id,
          titulo,
          descricao,
          categoria,
          imagem_capa,
          publicado
        `
      )

      .eq(
        "publicado",
        true
      );



  if (
    page ===
    "index.html"
  ) {

    query =
      query.limit(
        6
      );

  }



  const {
    data,
    error
  } =
    await query

      .order(
        "criado_em",
        {
          ascending:
            false
        }
      );



  if (error) {

    console.error(
      "Erro ao carregar projetos:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        Não foi possível carregar os projetos.

      </div>

    `;

    return;

  }



  if (
    !data ||
    !data.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Nenhum projeto publicado
        </h3>

        <p>
          Os projetos publicados pela Max Som aparecerão aqui.
        </p>

      </div>

    `;

    return;

  }



  container.innerHTML =

    data

      .map(
        (project) => `

          <article
            class="project-card"
          >

            ${
              project.imagem_capa

                ? `

                  <img
                    src="${esc(
                      project.imagem_capa
                    )}"
                    alt="${esc(
                      project.titulo ||
                      "Projeto Max Som"
                    )}"
                    loading="lazy"
                  >

                `

                : `

                  <img
                    src="projeto-01.png"
                    alt="${esc(
                      project.titulo ||
                      "Projeto Max Som"
                    )}"
                    loading="lazy"
                  >

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
                ${esc(
                  project.titulo ||
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


              <a
                href="atendimento.html"
              >
                Conhecer soluções →
              </a>

            </div>

          </article>

        `
      )

      .join("");

}



/* =========================================================
   41. PUBLICAÇÕES PÚBLICAS
   ========================================================= */

async function loadPublications() {

  const container =
    qs(
      "#postsGrid",
      "#publicacoesLista",
      "#publicationsList",
      "#publicacoesContainer"
    );


  if (
    !container ||
    !supabase
  ) {

    return;

  }



  const page =
    getCurrentPage();



  let query =
    supabase

      .from(
        TABLES.PUBLICACOES
      )

      .select(
        `
          id,
          categoria_id,
          autor_id,
          titulo,
          resumo,
          conteudo,
          imagem_capa,
          publicado,
          data_publicacao
        `
      )

      .eq(
        "publicado",
        true
      );



  if (
    page ===
    "index.html"
  ) {

    query =
      query.limit(
        6
      );

  }



  const {
    data,
    error
  } =
    await query

      .order(
        "data_publicacao",
        {
          ascending:
            false
        }
      );



  if (error) {

    console.error(
      "Erro ao carregar publicações:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        Não foi possível carregar as publicações.

      </div>

    `;

    return;

  }



  if (
    !data ||
    !data.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Nenhuma publicação disponível
        </h3>

        <p>
          As novidades da Max Som aparecerão aqui.
        </p>

      </div>

    `;

    return;

  }



  container.innerHTML =

    data

      .map(
        (publication) => `

          <article
            class="post-card"
          >

            ${
              publication.imagem_capa

                ? `

                  <img
                    src="${esc(
                      publication.imagem_capa
                    )}"
                    alt="${esc(
                      publication.titulo ||
                      "Publicação Max Som"
                    )}"
                    loading="lazy"
                  >

                `

                : `

                  <div class="post-image">
                    Max Som
                  </div>

                `
            }


            <div
              class="post-info"
            >

              <span>
                Publicação
              </span>


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
                publication.data_publicacao

                  ? `

                    <small class="muted">

                      ${esc(
                        formatDate(
                          publication.data_publicacao
                        )
                      )}

                    </small>

                  `

                  : ""
              }


              ${
                publication.conteudo

                  ? `

                    <details>

                      <summary>
                        Ler publicação
                      </summary>

                      <p>
                        ${esc(
                          publication.conteudo
                        )}
                      </p>

                    </details>

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
   42. LINKS DE SERVIÇOS
   ========================================================= */

function setupServiceLinks() {

  document
    .querySelectorAll(
      "[data-service]"
    )
    .forEach(
      (element) => {

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
              element.textContent.trim() ||
              "Atendimento";


            window.location.href =
              `atendimento.html?servico=${encodeURIComponent(
                service
              )}`;

          }
        );

      }
    );

}



/* =========================================================
   43. WHATSAPP
   ========================================================= */

function setupWhatsApp() {

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
              "noopener,noreferrer"
            );

          }
        );

      }
    );

}



/* =========================================================
   44. DESTAQUES DA HOME
   ========================================================= */

function setupHomeLinks() {

  const page =
    getCurrentPage();


  if (
    page !==
    "index.html"
  ) {

    return;

  }



  /*
   * Garante que os links principais
   * continuem levando às páginas próprias.
   */

  document
    .querySelectorAll(
      'a[href="produtos.html"]'
    )
    .forEach(
      (link) => {

        link.dataset.homeLink =
          "produtos";

      }
    );



  document
    .querySelectorAll(
      'a[href="servicos.html"]'
    )
    .forEach(
      (link) => {

        link.dataset.homeLink =
          "servicos";

      }
    );



  document
    .querySelectorAll(
      'a[href="projetos.html"]'
    )
    .forEach(
      (link) => {

        link.dataset.homeLink =
          "projetos";

      }
    );



  document
    .querySelectorAll(
      'a[href="publicacoes.html"]'
    )
    .forEach(
      (link) => {

        link.dataset.homeLink =
          "publicacoes";

      }
    );

}



/* =========================================================
   45. ANIMAÇÃO E PÁGINA ATIVA
   ========================================================= */

function enhancePublicInterface() {

  const currentPage =
    getCurrentPage();



  /*
   * Menu ativo.
   */

  document
    .querySelectorAll(
      "nav a[href]"
    )
    .forEach(
      (link) => {

        const href =
          link
            .getAttribute(
              "href"
            )
            ?.split("?")[0];


        if (
          href ===
          currentPage
        ) {

          link.classList.add(
            "nav-current"
          );

          link.classList.add(
            "active"
          );

        }

      }
    );



  /*
   * Pequena animação escalonada
   * para os cards existentes.
   */

  document
    .querySelectorAll(
      `
        .product-card,
        .service-card,
        .project-card,
        .post-card,
        .publication-card,
        .benefit-card
      `
    )

    .forEach(
      (card, index) => {

        card.style.animationDelay =
          `${Math.min(
            index * 45,
            250
          )}ms`;

      }
    );

}



/* =========================================================
   46. FIM DA PARTE 4
   ========================================================= */
/* =========================================================
   47. CARREGAR SERVIÇOS NO ATENDIMENTO
   ========================================================= */

async function loadAttendanceServices() {

  const select =
    qs(
      "#servico",
      "#requestServico",
      "#servicoId"
    );


  if (
    !select ||
    !supabase
  ) {

    return;

  }



  const {
    data,
    error
  } =
    await supabase

      .from(
        TABLES.SERVICOS
      )

      .select(
        `
          id,
          nome,
          ativo
        `
      )

      .eq(
        "ativo",
        true
      )

      .order(
        "nome",
        {
          ascending:
            true
        }
      );



  if (error) {

    console.error(
      "Erro ao carregar serviços do atendimento:",
      error
    );


    select.innerHTML = `

      <option value="">
        Não foi possível carregar os serviços
      </option>

    `;

    return;

  }



  select.innerHTML = `

    <option value="">
      Selecione um serviço
    </option>

  `;



  (data || [])
    .forEach(
      (service) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          service.id;


        option.textContent =
          service.nome;


        option.dataset.nome =
          service.nome;


        select.appendChild(
          option
        );

      }
    );



  /*
   * Lê o serviço vindo da URL.
   *
   * Exemplo:
   * atendimento.html?servico=Instalação
   */

  const params =
    new URLSearchParams(
      window.location.search
    );


  const serviceFromUrl =
    params.get(
      "servico"
    ) ||
    params.get(
      "service"
    );



  if (
    serviceFromUrl
  ) {

    const options =
      Array.from(
        select.options
      );



    const match =
      options.find(
        (option) => {

          const byId =
            option.value ===
            serviceFromUrl;


          const byName =
            (
              option.dataset.nome ||
              option.textContent ||
              ""
            )
              .trim()
              .toLowerCase() ===
            serviceFromUrl
              .trim()
              .toLowerCase();


          return (
            byId ||
            byName
          );

        }
      );



    if (match) {

      select.value =
        match.value;

    }

  }

}



/* =========================================================
   48. PREENCHER DADOS DO USUÁRIO
   ========================================================= */

async function fillAttendanceUserData() {

  const nameInput =
    qs(
      "#nomeContato",
      "#requestNome",
      "#nomeSolicitante"
    );


  const phoneInput =
    qs(
      "#telefoneContato",
      "#requestTelefone",
      "#telefone"
    );


  if (
    !nameInput &&
    !phoneInput
  ) {

    return;

  }



  if (
    !currentUser
  ) {

    return;

  }



  const profile =
    await ensureProfile();



  if (!profile) {

    return;

  }



  if (
    nameInput &&
    !nameInput.value &&
    profile.nome
  ) {

    nameInput.value =
      profile.nome;

  }



  if (
    phoneInput &&
    !phoneInput.value
  ) {

    const phone =
      profile.whatsapp ||
      profile.telefone ||
      "";


    if (phone) {

      phoneInput.value =
        phone;

    }

  }

}



/* =========================================================
   49. CRIAR SOLICITAÇÃO NO BANCO — CORRIGIDA
   ========================================================= */

async function saveAttendanceRequest({
  serviceId = null,
  nome = "",
  telefone = "",
  equipamento = "",
  descricao = ""
} = {}) {

  /*
   * Só registra no banco quando existe
   * um usuário autenticado.
   */

  if (
    !currentUser
  ) {

    return {
      saved: false,
      error: null
    };

  }



  /*
   * A tabela de solicitações utiliza:
   *
   * cliente_id
   * servico_id
   * equipamento_id
   * descricao_problema
   * status
   * observacoes
   *
   * Como o formulário público não possui
   * um cadastro de equipamento vinculado,
   * o texto do equipamento fica junto
   * da descrição/observação.
   */

  const descricaoProblema =
    [
      equipamento
        ? `Produto/equipamento: ${equipamento}`
        : "",

      descricao
    ]
      .filter(Boolean)
      .join("\n\n");



  const observacoes =
    [
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

    cliente_id:
      currentUser.id,

    servico_id:
      serviceId ||
      null,

    equipamento_id:
      null,

    descricao_problema:
      descricaoProblema ||
      null,

    status:
      "solicitado",

    observacoes:
      observacoes ||
      null

  };



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
      "Erro ao salvar solicitação:",
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

/* =========================================================
   50. MONTAR MENSAGEM DO WHATSAPP
   ========================================================= */

function buildAttendanceWhatsAppMessage({
  nome = "",
  telefone = "",
  servico = "",
  equipamento = "",
  descricao = ""
} = {}) {

  const lines = [

    "Olá! Quero falar com a Max Som.",

    nome
      ? `Nome: ${nome}`
      : "",

    telefone
      ? `Telefone/WhatsApp: ${telefone}`
      : "",

    servico
      ? `Serviço: ${servico}`
      : "",

    equipamento
      ? `Produto/equipamento: ${equipamento}`
      : "",

    descricao
      ? `Mensagem: ${descricao}`
      : ""

  ];



  return lines

    .filter(
      Boolean
    )

    .join(
      "\n"
    );

}



/* =========================================================
   51. FORMULÁRIO DE ATENDIMENTO
   ========================================================= */

function setupAttendanceForm() {

  const form =
    qs(
      "#formAtendimento",
      "#serviceRequestForm",
      "#formSolicitacao",
      "#requestForm"
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



  const button =
    form.querySelector(
      'button[type="submit"]'
    );



  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();



      /*
       * Lê os campos do HTML atual.
       */

      const nameInput =
        qs(
          "#nomeContato",
          "#requestNome",
          "#nomeSolicitante"
        );


      const phoneInput =
        qs(
          "#telefoneContato",
          "#requestTelefone",
          "#telefone"
        );


      const serviceSelect =
        qs(
          "#servico",
          "#requestServico",
          "#servicoId"
        );


      const equipmentInput =
        qs(
          "#equipamento",
          "#requestEquipamento"
        );


      const descriptionInput =
        qs(
          "#descricao",
          "#requestDescricao",
          "#mensagem"
        );



      const nome =
        nameInput
          ?.value
          ?.trim() ||
        "";


      const telefone =
        phoneInput
          ?.value
          ?.trim() ||
        "";


      const equipamento =
        equipmentInput
          ?.value
          ?.trim() ||
        "";


      const descricao =
        descriptionInput
          ?.value
          ?.trim() ||
        "";



      const serviceOption =
        serviceSelect
          ?.selectedOptions
          ?.[0];


      const serviceId =
        serviceSelect
          ?.value ||
        null;


      const serviceName =
        serviceOption
          ?.dataset
          ?.nome ||
        serviceOption
          ?.textContent
          ?.trim() ||
        "";



      /*
       * O nome é obrigatório no HTML,
       * mas fazemos a verificação aqui
       * também.
       */

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
          "Explique o que você precisa.",
          "error"
        );

        descriptionInput?.focus();

        return;

      }



      setButtonLoading(
        button,
        true,
        "Enviando..."
      );



      clearMessage(
        "#mensagemAtendimento"
      );



      /*
       * Salva a solicitação no banco
       * para usuários autenticados.
       */

      const saveResult =
        await saveAttendanceRequest({

          serviceId,

          nome,

          telefone,

          equipamento,

          descricao

        });



      /*
       * Mesmo que o visitante esteja
       * sem login, o contato continua
       * funcionando pelo WhatsApp.
       */

      const whatsappMessage =
        buildAttendanceWhatsAppMessage({

          nome,

          telefone,

          servico:
            serviceName,

          equipamento,

          descricao

        });



      const whatsappUrl =
        `https://wa.me/5565996262514?text=${encodeURIComponent(
          whatsappMessage
        )}`;



      if (
        saveResult.error
      ) {

        showMessage(
          "#mensagemAtendimento",
          "O WhatsApp será aberto. Não foi possível registrar a solicitação na conta.",
          "warning"
        );

      }



      /*
       * Abre o contato da Max Som.
       */

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );



      /*
       * Limpa somente os dados
       * que foram digitados.
       */

      form.reset();



      /*
       * Depois do reset, tenta colocar
       * novamente o serviço escolhido pela URL.
       */

      await loadAttendanceServices();



      if (
        saveResult.saved
      ) {

        showMessage(
          "#mensagemAtendimento",
          "Solicitação registrada. O WhatsApp foi aberto para continuar o atendimento.",
          "success"
        );

      }
      else {

        showMessage(
          "#mensagemAtendimento",
          "O WhatsApp foi aberto com sua mensagem pronta.",
          "success"
        );

      }



      setButtonLoading(
        button,
        false
      );

    }
  );

}



/* =========================================================
   52. INICIALIZAÇÃO DO ATENDIMENTO
   ========================================================= */

async function setupAttendancePage() {

  if (
    getCurrentPage() !==
    "atendimento.html"
  ) {

    return;

  }



  await loadAttendanceServices();

  await fillAttendanceUserData();

  setupAttendanceForm();

}



/* =========================================================
   53. BOTÕES DE ATENDIMENTO
   ========================================================= */

function setupAttendanceButtons() {

  document
    .querySelectorAll(
      `
        a[href^="atendimento.html"],
        [data-service]
      `
    )
    .forEach(
      (element) => {

        if (
          element.dataset.attendanceBound ===
          "true"
        ) {

          return;

        }


        element.dataset.attendanceBound =
          "true";



        /*
         * Links que já possuem
         * atendimento.html?servico=
         * não precisam de alteração.
         */

        if (
          element.matches(
            'a[href^="atendimento.html"]'
          )
        ) {

          return;

        }



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

      }
    );

}



/* =========================================================
   54. FIM DA PARTE 5
   ========================================================= */
/* =========================================================
   55. LISTAR CONVERSAS
   ========================================================= */

async function loadConversations() {

  const container =
    qs(
      "#conversasLista",
      "#conversationsList",
      "#conversationList",
      "#conversasConta"
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

      .from(
        TABLES.CONVERSAS
      )

      .select(
        `
          id,
          cliente_id,
          funcionario_id,
          assunto,
          status,
          criado_em,
          atualizado_em
        `
      )

      .order(
        "atualizado_em",
        {
          ascending:
            false
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



  if (
    !data ||
    !data.length
  ) {

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
        (conversation) => {

          const title =
            conversation.assunto ||
            "Atendimento Max Som";


          const status =
            conversation.status ||
            "aberta";


          const date =
            conversation.atualizado_em ||
            conversation.criado_em;



          return `

            <a
              href="conversa.html?id=${encodeURIComponent(
                conversation.id
              )}"
              class="conversation-card"
            >

              <div
                class="conversation-card-content"
              >

                <div>

                  <h3>
                    ${esc(
                      title
                    )}
                  </h3>

                  <span>
                    ${esc(
                      status
                    )}
                  </span>

                </div>


                <time>
                  ${esc(
                    formatDateTime(
                      date
                    )
                  )}
                </time>

              </div>

            </a>

          `;

        }
      )

      .join("");

}



/* =========================================================
   56. CRIAR CONVERSA
   ========================================================= */

async function createConversation(
  assunto = "Atendimento Max Som"
) {

  if (
    !currentUser
  ) {

    showMessage(
      "#mensagemConversa",
      "Faça login para iniciar uma conversa.",
      "error"
    );

    window.location.href =
      "login.html";

    return null;

  }



  const profile =
    await ensureProfile();



  if (!profile) {

    return null;

  }



  const {
    data,
    error
  } =
    await supabase

      .from(
        TABLES.CONVERSAS
      )

      .insert({

        cliente_id:
          currentUser.id,

        assunto:
          assunto ||

          "Atendimento Max Som",

        status:
          "aberta"

      })

      .select(
        `
          id,
          cliente_id,
          funcionario_id,
          assunto,
          status,
          criado_em,
          atualizado_em
        `
      )

      .single();



  if (error) {

    console.error(
      "Erro ao criar conversa:",
      error
    );


    showMessage(
      "#mensagemConversa",
      "Não foi possível iniciar a conversa.",
      "error"
    );


    return null;

  }



  return data;

}



/* =========================================================
   57. BOTÃO PARA ABRIR NOVA CONVERSA
   ========================================================= */

async function openConversation(
  assunto = "Atendimento geral"
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
   58. CONFIGURAR BOTÕES DE NOVA CONVERSA
   ========================================================= */

function setupConversationButtons() {

  document

    .querySelectorAll(
      "[data-open-conversation]"
    )

    .forEach(
      (button) => {

        if (
          button.dataset.conversationBound ===
          "true"
        ) {

          return;

        }


        button.dataset.conversationBound =
          "true";


        button.addEventListener(
          "click",
          async (event) => {

            event.preventDefault();


            const assunto =
              button.dataset.openConversation ||
              button.dataset.assunto ||
              button.textContent.trim() ||
              "Atendimento geral";


            await openConversation(
              assunto
            );

          }
        );

      }
    );

}



/* =========================================================
   59. CARREGAR UMA CONVERSA
   ========================================================= */

async function loadConversation() {

  const container =
    qs(
      "#conversaContainer",
      "#chatMessages"
    );


  if (!container) {

    return;

  }



  const params =
    new URLSearchParams(
      window.location.search
    );



  const conversationId =
    params.get(
      "id"
    );



  if (
    !conversationId
  ) {

    container.innerHTML = `

      <div class="empty">

        Conversa não encontrada.

      </div>

    `;

    return;

  }



  if (
    !currentUser
  ) {

    container.innerHTML = `

      <div class="empty">

        Você precisa estar logado para abrir esta conversa.

      </div>

    `;

    return;

  }



  const {
    data: conversation,
    error
  } =
    await supabase

      .from(
        TABLES.CONVERSAS
      )

      .select(
        `
          id,
          cliente_id,
          funcionario_id,
          assunto,
          status,
          criado_em,
          atualizado_em
        `
      )

      .eq(
        "id",
        conversationId
      )

      .maybeSingle();



  if (
    error ||
    !conversation
  ) {

    console.error(
      "Erro ao carregar conversa:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        Esta conversa não está disponível.

      </div>

    `;

    return;

  }



  /*
   * A segurança real é feita pelo RLS
   * do Supabase.
   *
   * O JavaScript não tenta abrir
   * conversas que o banco não autorizar.
   */



  const title =
    qs(
      "#conversaTitulo",
      "#chatTitle"
    );


  const status =
    qs(
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



  await loadMessages(
    conversationId
  );



  await markConversationMessagesRead(
    conversationId
  );



  setupMessageForm(
    conversationId
  );



  setupConversationRealtime(
    conversationId
  );

}



/* =========================================================
   60. CARREGAR MENSAGENS
   ========================================================= */

async function loadMessages(
  conversationId
) {

  const container =
    qs(
      "#mensagensLista",
      "#chatMessages"
    );


  if (
    !container ||
    !conversationId
  ) {

    return;

  }



  const {
    data,
    error
  } =
    await supabase

      .from(
        TABLES.MENSAGENS
      )

      .select(
        `
          id,
          conversa_id,
          remetente_id,
          conteudo,
          lida,
          criado_em
        `
      )

      .eq(
        "conversa_id",
        conversationId
      )

      .order(
        "criado_em",
        {
          ascending:
            true
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



  if (
    !data ||
    !data.length
  ) {

    container.innerHTML = `

      <div class="empty-messages">

        Nenhuma mensagem ainda.

      </div>

    `;

    return;

  }



  container.innerHTML =

    data

      .map(
        (message) => {

          const mine =
            message.remetente_id ===
            currentUser?.id;



          return `

            <div
              class="message ${
                mine
                  ? "message-own"
                  : "message-other"
              }"
            >

              <div
                class="message-content"
              >

                <p>
                  ${esc(
                    message.conteudo ||
                    ""
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
   61. MARCAR MENSAGENS COMO LIDAS
   ========================================================= */

async function markConversationMessagesRead(
  conversationId
) {

  if (
    !currentUser ||
    !conversationId
  ) {

    return;

  }



  const {
    error
  } =
    await supabase

      .from(
        TABLES.MENSAGENS
      )

      .update({
        lida:
          true
      })

      .eq(
        "conversa_id",
        conversationId
      )

      .neq(
        "remetente_id",
        currentUser.id
      )

      .eq(
        "lida",
        false
      );



  if (error) {

    console.warn(
      "Não foi possível marcar mensagens como lidas:",
      error
    );

  }

}



/* =========================================================
   62. FORMULÁRIO DE MENSAGEM
   ========================================================= */

function setupMessageForm(
  conversationId
) {

  const form =
    qs(
      "#mensagemForm",
      "#chatForm",
      "#messageForm"
    );


  if (!form) {

    return;

  }



  if (
    form.dataset.messageBound ===
    "true"
  ) {

    return;

  }



  form.dataset.messageBound =
    "true";



  const input =
    qs(
      "#mensagemInput",
      "#chatMessage",
      "#messageInput",
      "#mensagem",
      "#textoMensagem"
    );


  const button =
    qs(
      "#mensagemEnviar",
      "#chatSend",
      "#messageSend"
    );



  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();



      if (
        !currentUser
      ) {

        showMessage(
          "#mensagemConversa",
          "Faça login para enviar mensagens.",
          "error"
        );

        return;

      }



      const content =
        input
          ?.value
          ?.trim() ||
        "";



      if (
        !content
      ) {

        input?.focus();

        return;

      }



      if (button) {

        button.disabled =
          true;

      }



      const {
        error
      } =
        await supabase

          .from(
            TABLES.MENSAGENS
          )

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


        showMessage(
          "#mensagemConversa",
          "Não foi possível enviar a mensagem.",
          "error"
        );


        if (button) {

          button.disabled =
            false;

        }

        return;

      }



      if (input) {

        input.value =
          "";

      }



      await loadMessages(
        conversationId
      );



      await markConversationMessagesRead(
        conversationId
      );



      if (button) {

        button.disabled =
          false;

      }

    }
  );

}



/* =========================================================
   63. TEMPO REAL DA CONVERSA
   ========================================================= */

function setupConversationRealtime(
  conversationId
) {

  if (
    !supabase ||
    !conversationId
  ) {

    return;

  }



  if (
    window.maxSomCurrentConversationChannel
  ) {

    supabase.removeChannel(
      window.maxSomCurrentConversationChannel
    );

  }



  const channelName =
    `maxsom-conversa-${conversationId}`;



  window.maxSomCurrentConversationChannel =
    supabase

      .channel(
        channelName
      )

      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            TABLES.MENSAGENS,

          filter:
            `conversa_id=eq.${conversationId}`

        },

        async () => {

          await loadMessages(
            conversationId
          );

          await markConversationMessagesRead(
            conversationId
          );

        }

      )

      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            TABLES.CONVERSAS,

          filter:
            `id=eq.${conversationId}`

        },

        async () => {

          await loadConversation();

        }

      )

      .subscribe();

}



/* =========================================================
   64. TEMPO REAL DA LISTA DE CONVERSAS
   ========================================================= */

function setupConversationsRealtime() {

  if (
    !supabase ||
    !currentUser
  ) {

    return;

  }



  if (
    window.maxSomConversationsChannel
  ) {

    supabase.removeChannel(
      window.maxSomConversationsChannel
    );

  }



  window.maxSomConversationsChannel =
    supabase

      .channel(
        "maxsom-conversas-lista"
      )

      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            TABLES.CONVERSAS

        },

        async () => {

          await loadConversations();

        }

      )

      .subscribe();

}



/* =========================================================
   65. NOTIFICAÇÕES
   ========================================================= */

async function loadNotifications() {

  const container =
    qs(
      "#notificacoesLista",
      "#notificationsList",
      "#notificationList"
    );


  if (
    !container ||
    !currentUser
  ) {

    return;

  }



  const {
    data,
    error
  } =
    await supabase

      .from(
        TABLES.NOTIFICACOES
      )

      .select(
        `
          id,
          usuario_id,
          titulo,
          mensagem,
          lida,
          link,
          criado_em
        `
      )

      .eq(
        "usuario_id",
        currentUser.id
      )

      .order(
        "criado_em",
        {
          ascending:
            false
        }
      )

      .limit(
        20
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



  if (
    !data ||
    !data.length
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          Nenhuma notificação
        </h3>

        <p>
          Você não possui novas notificações.
        </p>

      </div>

    `;

    return;

  }



  container.innerHTML =

    data

      .map(
        (notification) => {

          const cardClass =
            notification.lida
              ? "notification-card read"
              : "notification-card unread";



          const title =
            notification.titulo ||
            "Notificação";


          const message =
            notification.mensagem ||
            "";


          const date =
            notification.criado_em;



          return `

            <article
              class="${cardClass}"
            >

              <div>

                <strong>
                  ${esc(
                    title
                  )}
                </strong>


                ${
                  message

                    ? `

                      <p>
                        ${esc(
                          message
                        )}
                      </p>

                    `

                    : ""
                }


                ${
                  date

                    ? `

                      <small>
                        ${esc(
                          formatDateTime(
                            date
                          )
                        )}
                      </small>

                    `

                    : ""
                }

              </div>


              <div
                class="notification-actions"
              >

                ${
                  notification.link

                    ? `

                      <a
                        href="${esc(
                          notification.link
                        )}"
                        class="btn btn-secondary"
                      >
                        Abrir
                      </a>

                    `

                    : ""
                }


                ${
                  !notification.lida

                    ? `

                      <button
                        type="button"
                        class="btn btn-outline"
                        data-mark-notification
                        data-notification-id="${esc(
                          notification.id
                        )}"
                      >
                        Marcar como lida
                      </button>

                    `

                    : ""
                }

              </div>

            </article>

          `;

        }
      )

      .join("");



  setupNotificationActions();

}



/* =========================================================
   66. MARCAR NOTIFICAÇÃO COMO LIDA
   ========================================================= */

async function markNotificationAsRead(
  notificationId
) {

  if (
    !currentUser ||
    !notificationId
  ) {

    return;

  }



  const {
    error
  } =
    await supabase

      .from(
        TABLES.NOTIFICACOES
      )

      .update({
        lida:
          true
      })

      .eq(
        "id",
        notificationId
      )

      .eq(
        "usuario_id",
        currentUser.id
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
   67. BOTÕES DE NOTIFICAÇÃO
   ========================================================= */

function setupNotificationActions() {

  document

    .querySelectorAll(
      "[data-mark-notification]"
    )

    .forEach(
      (button) => {

        if (
          button.dataset.notificationBound ===
          "true"
        ) {

          return;

        }



        button.dataset.notificationBound =
          "true";



        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.notificationId;


            button.disabled =
              true;


            await markNotificationAsRead(
              id
            );

          }
        );

      }
    );

}



/* =========================================================
   68. TEMPO REAL DAS NOTIFICAÇÕES
   ========================================================= */

function setupNotificationRealtime() {

  if (
    !supabase ||
    !currentUser
  ) {

    return;

  }



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
        `maxsom-notificacoes-${currentUser.id}`
      )

      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            TABLES.NOTIFICACOES,

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
   69. PÁGINA DE CONVERSAS
   ========================================================= */

async function setupConversationsPage() {

  if (
    getCurrentPage() !==
    "conversas.html"
  ) {

    return;

  }



  if (
    !currentUser
  ) {

    return;

  }



  await loadConversations();

  setupConversationButtons();

  setupConversationsRealtime();

}



/* =========================================================
   70. PÁGINA DE UMA CONVERSA
   ========================================================= */

async function setupConversationPage() {

  if (
    getCurrentPage() !==
    "conversa.html"
  ) {

    return;

  }



  if (
    !currentUser
  ) {

    return;

  }



  await loadConversation();

}



/* =========================================================
   71. NOTIFICAÇÕES DA CONTA
   ========================================================= */

async function setupNotificationsPage() {

  if (
    !currentUser
  ) {

    return;

  }



  await loadNotifications();

  setupNotificationRealtime();

}



/* =========================================================
   72. FIM DA PARTE 6
   ========================================================= */
/* =========================================================
   73. LIMPEZA DE CANAIS REALTIME
   ========================================================= */

function cleanupRealtimeChannels() {

  const channels = [

    "maxSomCurrentConversationChannel",

    "maxSomConversationsChannel",

    "maxSomNotificationChannel"

  ];



  channels.forEach(
    (name) => {

      const channel =
        window[name];


      if (
        channel &&
        supabase
      ) {

        supabase.removeChannel(
          channel
        );

        window[name] =
          null;

      }

    }
  );

}



/* =========================================================
   74. CONFIGURAÇÃO DOS BOTÕES DE LOGOUT
   ========================================================= */

function setupLogoutButtons() {

  document

    .querySelectorAll(
      "#logoutButton, #logoutLink, [data-logout]"
    )

    .forEach(
      (button) => {

        if (
          button.dataset.logoutBound ===
          "true"
        ) {

          return;

        }



        button.dataset.logoutBound =
          "true";



        button.addEventListener(
          "click",
          async (event) => {

            event.preventDefault();


            await logout();

          }
        );

      }
    );

}



/* =========================================================
   75. PÁGINAS PROTEGIDAS
   ========================================================= */

async function enforcePageAccess() {

  const page =
    getCurrentPage();



  /*
   * Conta, conversas e conversa
   * precisam de autenticação.
   */

  const protectedPages = [

    "conta.html",

    "conversas.html",

    "conversa.html"

  ];



  if (
    protectedPages.includes(
      page
    )
  ) {

    if (
      !currentUser
    ) {

      window.location.href =
        "login.html";

      return false;

    }

  }



  /*
   * Admin possui verificação própria
   * na função checkAdminPage().
   */

  if (
    page ===
    "admin.html"
  ) {

    const allowed =
      await checkAdminPage();


    if (!allowed) {

      return false;

    }

  }



  return true;

}



/* =========================================================
   76. CARREGAMENTO DAS PÁGINAS PÚBLICAS
   ========================================================= */

async function loadPublicPageData() {

  await Promise.allSettled([

    loadPublicProducts(),

    loadPublicServices(),

    loadPublicProjects(),

    loadPublications()

  ]);

}



/* =========================================================
   77. CARREGAMENTO DA ÁREA DO USUÁRIO
   ========================================================= */

async function loadUserArea() {

  const page =
    getCurrentPage();



  if (
    !currentUser
  ) {

    return;

  }



  /*
   * Minha conta
   */

  if (
    page ===
    "conta.html"
  ) {

    await account();

  }



  /*
   * Lista de conversas
   */

  if (
    page ===
    "conversas.html"
  ) {

    await setupConversationsPage();

  }



  /*
   * Conversa individual
   */

  if (
    page ===
    "conversa.html"
  ) {

    await setupConversationPage();

  }



  /*
   * Notificações
   */

  await setupNotificationsPage();

}



/* =========================================================
   78. CARREGAMENTO DA ÁREA ADMINISTRATIVA
   ========================================================= */

async function loadAdminArea() {

  if (
    getCurrentPage() !==
    "admin.html"
  ) {

    return;

  }



  const allowed =
    await requireAdmin();



  if (
    !allowed
  ) {

    return;

  }



  await adminMain();

}



/* =========================================================
   79. ATALHOS GERAIS DE NAVEGAÇÃO
   ========================================================= */

function setupGeneralNavigation() {

  /*
   * Links de conta.
   */

  document

    .querySelectorAll(
      "a[href='conta.html']"
    )

    .forEach(
      (link) => {

        if (
          link.dataset.navigationBound ===
          "true"
        ) {

          return;

        }



        link.dataset.navigationBound =
          "true";



        link.addEventListener(
          "click",
          (event) => {

            if (
              !currentUser
            ) {

              event.preventDefault();


              window.location.href =
                "login.html";

            }

          }
        );

      }
    );



  /*
   * Links de conversas.
   */

  document

    .querySelectorAll(
      `
        a[href='conversas.html'],
        a[href='conversa.html']
      `
    )

    .forEach(
      (link) => {

        if (
          link.dataset.navigationBound ===
          "true"
        ) {

          return;

        }



        link.dataset.navigationBound =
          "true";



        link.addEventListener(
          "click",
          (event) => {

            if (
              !currentUser
            ) {

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
   80. ATUALIZAR ESTADO DA NAVEGAÇÃO
   ========================================================= */

async function refreshApplicationState() {

  await updateNav();

  setupLogoutButtons();

  setupGeneralNavigation();

  enhancePublicInterface();

}



/* =========================================================
   81. INICIALIZAÇÃO PRINCIPAL
   ========================================================= */

async function initializeMaxSom() {

  try {

    /*
     * Primeiro recuperamos a sessão.
     */

    await initializeAuth();



    /*
     * Atualiza navegação.
     */

    await refreshApplicationState();



    /*
     * Proteção de páginas.
     */

    const allowed =
      await enforcePageAccess();



    if (
      !allowed
    ) {

      return;

    }



    /*
     * Formulários de autenticação.
     */

    setupLogin();

    setupSignup();



    /*
     * Atendimento.
     */

    setupAttendancePage();



    /*
     * Links e botões.
     */

    setupServiceLinks();

    setupAttendanceButtons();

    setupServiceLinks();

    setupWhatsApp();

    setupConversationButtons();

    setupAdminRequestButton();



    /*
     * Administração.
     */

    setupAdminMenu();

    setupAdminForms();

    bindAdminActions();

    setupAdminRequestButton();



    /*
     * Conteúdo público.
     */

    await loadPublicPageData();



    /*
     * Área do usuário.
     */

    await loadUserArea();



    /*
     * Área administrativa.
     */

    await loadAdminArea();



    /*
     * Canais realtime.
     */

    if (
      currentUser
    ) {

      setupConversationsRealtime();

      setupNotificationRealtime();

    }



    /*
     * Conversa individual possui
     * seu próprio canal.
     */

    if (
      getCurrentPage() ===
      "conversa.html" &&
      currentUser
    ) {

      const params =
        new URLSearchParams(
          window.location.search
        );


      const conversationId =
        params.get(
          "id"
        );


      if (
        conversationId
      ) {

        setupConversationRealtime(
          conversationId
        );

      }

    }



    /*
     * Teclas e pequenos recursos
     * gerais do sistema.
     */

    if (
      typeof setupKeyboardShortcuts ===
      "function"
    ) {

      setupKeyboardShortcuts();

    }



  }
  catch (
    error
  ) {

    console.error(
      "Erro na inicialização do Max Som:",
      error
    );

  }

}



/* =========================================================
   82. LISTENER DE AUTENTICAÇÃO
   ========================================================= */

function setupGlobalAuthListener() {

  if (
    window.maxSomAuthListenerBound
  ) {

    return;

  }



  window.maxSomAuthListenerBound =
    true;



  supabase.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      currentUser =
        session?.user ||
        null;



      if (
        currentUser
      ) {

        await ensureProfile();

      }
      else {

        currentProfile =
          null;

      }



      /*
       * Atualiza apenas a navegação
       * imediatamente.
       */

      await updateNav();



      /*
       * Após login/logout,
       * atualiza a página somente
       * quando realmente necessário.
       */

      const page =
        getCurrentPage();



      if (
        event ===
        "SIGNED_OUT"
      ) {

        cleanupRealtimeChannels();



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



      if (
        event ===
        "SIGNED_IN"
      ) {

        await refreshApplicationState();

      }

    }
  );

}



/* =========================================================
   83. EXECUÇÃO FINAL
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    async () => {

      setupGlobalAuthListener();

      await initializeMaxSom();

    }
  );

}
else {

  setupGlobalAuthListener();

  initializeMaxSom();

}



/* =========================================================
   84. FIM DO MAIN.JS
   ========================================================= */
