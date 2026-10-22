/* MAX SOM — menu compartilhado em todas as páginas HTML.
   A marcação é criada em um só lugar; o comportamento fica coordenado com main.js. */
(() => {
  "use strict";
  const PAGE_LINKS = [
    { href: "index.html", label: "Início", icon: "⌂" },
    { href: "produtos.html", label: "Produtos", icon: "▣" },
    { href: "servicos.html", label: "Serviços", icon: "⚙" },
    { href: "projetos.html", label: "Projetos", icon: "▧" },
    { href: "publicacoes.html", label: "Publicações", icon: "▤" },
    { href: "atendimento.html", label: "Atendimento", icon: "☏" }
  ];
  const currentPage = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function link(item, current, attributes = "") {
    const active = item.href.toLowerCase() === current;
    return `<a class="nav-link${active ? " active" : ""}" href="${item.href}" ${active ? 'aria-current="page"' : ""} ${attributes}>
      <span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${esc(item.label)}</span></a>`;
  }
  function render() {
    if (document.getElementById("sidebar")) return;
    const current = currentPage();
    const sidebar = document.createElement("aside");
    sidebar.id = "sidebar";
    sidebar.className = "sidebar";
    sidebar.setAttribute("aria-label", "Navegação da Max Som");
    sidebar.innerHTML = `
      <a href="index.html" class="brand" aria-label="Max Som — Início">
        <img src="../assets/logo-maxsom-white.png" alt="Max Som" class="brand-logo">
        <span class="brand-collapsed-mark" aria-hidden="true">MS</span>
      </a>
      <button class="menu-toggle" id="menuToggle" type="button" aria-controls="sidebar" aria-expanded="true" aria-label="Recolher ou expandir menu">
        <span aria-hidden="true">☰</span><span class="toggle-label">Recolher menu</span>
      </button>
      <nav class="side-nav" aria-label="Menu principal">
        ${PAGE_LINKS.map(item => link(item, current)).join("")}
        ${link({href:"conversas.html", label:"Minhas conversas", icon:"▤"}, current, 'data-logged-only data-conversations-link')}
        ${link({href:"admin.html", label:"Painel administrativo", icon:"⚙"}, current, 'data-admin-only')}
      </nav>
      <div class="sidebar-bottom">
        ${link({href:"atendimento.html", label:"Ajuda", icon:"?"}, current)}
        ${link({href:"conta.html", label:"Minha conta", icon:"♙"}, current, 'data-logged-only')}
        ${link({href:"login.html", label:"Entrar", icon:"⇥"}, current, 'data-guest-only data-account-link')}
        ${link({href:"cadastro.html", label:"Criar conta", icon:"＋"}, current, 'data-guest-only')}
        <button class="nav-link" type="button" data-logout data-logged-only style="display:none">
          <span class="nav-icon" aria-hidden="true">↪</span><span class="nav-label">Sair</span>
        </button>
        <a class="nav-link sidebar-whatsapp" href="https://wa.me/5565996262514" target="_blank" rel="noopener noreferrer">
          <span class="nav-icon" aria-hidden="true">☏</span><span class="nav-label">Falar com a Max Som</span>
        </a>
      </div>`;
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.prepend(overlay);
    document.body.prepend(sidebar);
    const topbar = document.querySelector(".topbar");
    if (topbar && !document.getElementById("mobileMenu")) {
      const button = document.createElement("button");
      button.id = "mobileMenu";
      button.type = "button";
      button.className = "mobile-menu-button";
      button.setAttribute("aria-label", "Abrir menu");
      button.setAttribute("aria-controls", "sidebar");
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = '<span aria-hidden="true">☰</span>';
      topbar.prepend(button);
    }
    document.dispatchEvent(new CustomEvent("maxsom:menu-ready"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once:true });
  else render();
})();
