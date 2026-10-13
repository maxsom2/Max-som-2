```javascript
// js/login.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const message = document.getElementById("loginMessage");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passwordInput || !message) {
    console.error("Não foi possível encontrar os campos do login.");
    return;
  }

  if (
    typeof supabase === "undefined" ||
    typeof SUPABASE_URL === "undefined" ||
    typeof SUPABASE_ANON_KEY === "undefined" ||
    SUPABASE_URL.includes("COLE_AQUI") ||
    SUPABASE_ANON_KEY.includes("COLE_AQUI")
  ) {
    message.textContent =
      "O sistema de login ainda não está configurado.";
    return;
  }

  const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    message.textContent = "";

    if (!email || !password) {
      message.textContent = "Informe seu e-mail e sua senha.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Verificando...";
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        message.textContent =
          "Não foi possível entrar. Confira seu e-mail e sua senha.";
        return;
      }

      if (!data.session || !data.user) {
        message.textContent =
          "Não foi possível confirmar sua sessão. Tente novamente.";
        return;
      }

      // Guarda a sessão por meio do cliente oficial do Supabase.
      // A página de destino poderá consultar a sessão autenticada.
      window.location.href = "index.html";

    } catch (error) {
      console.error("Erro ao realizar login:", error);
      message.textContent =
        "Ocorreu um erro de conexão. Tente novamente.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Entrar na minha conta →";
      }
    }
  });
});
```
