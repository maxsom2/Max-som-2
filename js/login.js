
document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("loginemail");
  const passwordInput = document.getElementById("loginpassword");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passwordInput || !message) {
    console.error("Não foi possível encontrar os campos do login.");
    return;
  }

  const client = window.supabaseClient;

  if (!client) {
    message.textContent =
      "Não foi possível conectar ao sistema. Atualize a página e tente novamente.";
    console.error(
      "Cliente Supabase não encontrado. Confira a ordem dos scripts no HTML."
    );
    return;
  }

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
        console.error("Erro de login:", error.message);
        message.textContent =
          "Não foi possível entrar. Confira seu e-mail e sua senha.";
        return;
      }

      if (!data.session || !data.user) {
        message.textContent =
          "Não foi possível confirmar sua sessão. Tente novamente.";
        return;
      }

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
