/*
 * MAX SOM — inicialização resiliente dos formulários de acesso.
 * Se main.js carregar, reutiliza setupLogin/setupSignup do código principal.
 * Se main.js não for carregado, oferece um manipulador de contingência para
 * que o formulário não tente fazer POST para login.html/cadastro.html.
 */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);

  function showMessage(selector, message, type = "error") {
    const element = $(selector);
    if (!element) return;
    element.textContent = message;
    element.classList.remove("hidden", "message-info", "message-success", "message-warning", "message-error");
    element.classList.add(`message-${type}`);
    element.setAttribute("role", "alert");
    element.setAttribute("aria-live", "polite");
  }

  function clearMessage(selector) {
    const element = $(selector);
    if (!element) return;
    element.textContent = "";
    element.classList.add("hidden");
    element.classList.remove("message-info", "message-success", "message-warning", "message-error");
  }

  function setLoading(button, loading, text) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.authBootstrapOriginalText) {
        button.dataset.authBootstrapOriginalText = button.textContent.trim();
      }
      button.disabled = true;
      button.textContent = text;
      return;
    }
    button.disabled = false;
    button.textContent = button.dataset.authBootstrapOriginalText || button.textContent;
  }

  function getClient() {
    const client = window.supabaseClient;
    if (!client || !client.auth) {
      throw new Error("O cliente do Supabase não foi carregado. Verifique os arquivos js/supabase.js e a conexão com o SDK.");
    }
    return client;
  }

  function cleanLoginTarget(profile) {
    const staffTypes = ["admin", "dono", "administrador", "funcionario", "funcionário", "funcionario tecnico", "funcionário técnico"];
    const type = String(profile?.tipo_usuario || "cliente").trim().toLowerCase();
    const defaultTarget = staffTypes.includes(type) ? "admin.html" : "conta.html";
    const requested = new URLSearchParams(window.location.search).get("redirect");
    const allowed = new Set([
      "index.html", "produtos.html", "servicos.html", "projetos.html",
      "publicacoes.html", "atendimento.html", "conta.html", "conversas.html",
      "conversa.html", "admin.html"
    ]);
    if (!requested || requested.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(requested)) return defaultTarget;
    const page = requested.trim().split("?")[0].split("#")[0];
    return allowed.has(page) ? requested.trim() : defaultTarget;
  }

  async function loadOrCreateProfile(client, user, values = {}) {
    const { data: existing, error: readError } = await client
      .from("usuario")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) {
      throw new Error(`A autenticação foi aceita, mas não foi possível consultar o perfil na tabela usuario: ${readError.message}`);
    }
    if (existing) return existing;

    const metadata = user.user_metadata || {};
    const profileData = {
      id: user.id,
      nome: String(values.nome || metadata.nome || user.email?.split("@")[0] || "Cliente").trim(),
      telefone: String(values.telefone || metadata.telefone || "").trim() || null,
      whatsapp: String(values.whatsapp || metadata.whatsapp || "").trim() || null,
      tipo_usuario: "cliente"
    };

    const { data: created, error: insertError } = await client
      .from("usuario")
      .insert(profileData)
      .select("*")
      .single();

    if (insertError) {
      throw new Error(`A conta foi autenticada, mas o perfil não foi salvo em usuario. Confira a política INSERT (RLS): ${insertError.message}`);
    }
    return created;
  }

  function bindLogin() {
    const form = $("#loginForm") || $("#formLogin");
    if (!form) return;

    // Preferir a implementação principal. Chamar diretamente aqui evita depender
    // de uma inicialização posterior via DOMContentLoaded.
    try {
      if (typeof window.MaxSom?.setupLogin === "function") window.MaxSom.setupLogin();
      else if (typeof window.setupLogin === "function") window.setupLogin();
    } catch (error) {
      console.error("Max Som: falha ao iniciar o login principal; será usada a contingência.", error);
    }
    if (form.dataset.loginBound === "true") return;

    form.dataset.loginBound = "true";
    form.dataset.loginFallbackBound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = $("#loginEmail", form)?.value.trim().toLowerCase() || "";
      const password = $("#loginPassword", form)?.value || "";
      const button = $("button[type='submit']", form);
      clearMessage("#loginError");

      if (!email || !password) {
        showMessage("#loginError", "Preencha o e-mail e a senha.");
        return;
      }
      let client;
      try {
        client = getClient();
      } catch (error) {
        showMessage("#loginError", error.message);
        console.error(error);
        return;
      }

      setLoading(button, true, "Entrando...");
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error("O Supabase não retornou um usuário autenticado.");

        const profile = await loadOrCreateProfile(client, data.user);
        window.location.replace(cleanLoginTarget(profile));
      } catch (error) {
        console.error("Max Som — erro ao entrar:", error);
        const code = String(error?.code || "").toLowerCase();
        const detail = String(error?.message || "");
        const invalid = ["invalid_credentials", "invalid_grant"].includes(code) || /invalid login credentials|invalid email or password/i.test(detail);
        showMessage("#loginError", invalid
          ? "E-mail ou senha incorretos. Confira os dados e tente novamente."
          : (detail || "Não foi possível concluir o login. Confira a conexão e as permissões do Supabase."));
      } finally {
        setLoading(button, false);
      }
    });
    console.warn("Max Som: login conectado pelo inicializador de contingência. Verifique se js/main.js foi publicado corretamente.");
  }

  function bindSignup() {
    const form = $("#signupForm") || $("#formCadastro");
    if (!form) return;

    try {
      if (typeof window.MaxSom?.setupSignup === "function") window.MaxSom.setupSignup();
      else if (typeof window.setupSignup === "function") window.setupSignup();
    } catch (error) {
      console.error("Max Som: falha ao iniciar o cadastro principal; será usada a contingência.", error);
    }
    if (form.dataset.signupBound === "true") return;

    form.dataset.signupBound = "true";
    form.dataset.signupFallbackBound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nome = $("#signupNome", form)?.value.trim() || "";
      const telefone = $("#signupTelefone", form)?.value.trim() || "";
      const whatsapp = $("#signupWhatsapp", form)?.value.trim() || "";
      const email = $("#signupEmail", form)?.value.trim().toLowerCase() || "";
      const password = $("#signupPassword", form)?.value || "";
      const button = $("button[type='submit']", form);
      clearMessage("#signupError");
      if (!nome || !email || !password) {
        showMessage("#signupError", "Preencha seu nome, e-mail e senha.");
        return;
      }

      let client;
      try {
        client = getClient();
      } catch (error) {
        showMessage("#signupError", error.message);
        console.error(error);
        return;
      }

      setLoading(button, true, "Criando conta...");
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { nome, telefone, whatsapp } }
        });
        if (error) throw error;
        if (!data?.user) throw new Error("O Supabase não retornou o usuário criado.");

        if (data.session) {
          await loadOrCreateProfile(client, data.user, { nome, telefone, whatsapp });
          window.location.replace("conta.html");
          return;
        }

        showMessage("#signupError", "Conta criada. Confirme seu e-mail e depois entre na sua conta.", "success");
        form.reset();
      } catch (error) {
        console.error("Max Som — erro ao criar conta:", error);
        showMessage("#signupError", error?.message || "Não foi possível criar a conta. Verifique a conexão e as configurações do Supabase.");
      } finally {
        setLoading(button, false);
      }
    });
    console.warn("Max Som: cadastro conectado pelo inicializador de contingência. Verifique se js/main.js foi publicado corretamente.");
  }

  function boot() {
    bindLogin();
    bindSignup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
