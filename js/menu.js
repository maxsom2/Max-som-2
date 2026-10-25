/* MAX SOM — menu lateral compartilhado.
   A estrutura visual segue o modelo de menu vertical fornecido como referência,
   mantendo o projeto em HTML/CSS/JavaScript e reaproveitando a autenticação existente. */
(() => {
  "use strict";

  const PAGE_LINKS = [
    { href: "index.html", label: "Início", icon: "fa-solid fa-house" },
    { href: "produtos.html", label: "Produtos", icon: "fa-solid fa-box-open" },
    { href: "servicos.html", label: "Serviços", icon: "fa-solid fa-screwdriver-wrench" },
    { href: "projetos.html", label: "Projetos", icon: "fa-solid fa-images" },
    { href: "publicacoes.html", label: "Publicações", icon: "fa-solid fa-newspaper" },
    { href: "atendimento.html", label: "Atendimento", icon: "fa-solid fa-headset" }
  ];

  const ACCOUNT_LINKS = [
    { href: "conversas.html", label: "Minhas conversas", icon: "fa-solid fa-comments", attributes: "data-logged-only data-conversations-link" },
    { href: "admin.html", label: "Painel administrativo", icon: "fa-solid fa-user-shield", attributes: "data-admin-only" }
  ];

  const BOTTOM_LINKS = [
    { href: "ajuda.html", label: "Ajuda", icon: "fa-solid fa-circle-question" },
    { href: "conta.html", label: "Minha conta", icon: "fa-solid fa-circle-user", attributes: "data-logged-only" },
    { href: "login.html", label: "Entrar", icon: "fa-solid fa-right-to-bracket", attributes: "data-guest-only data-account-link" },
    { href: "cadastro.html", label: "Criar conta", icon: "fa-solid fa-user-plus", attributes: "data-guest-only" }
  ];

  let lastAuthState = null;

  function setAuthElementVisibility(element, visible) {
    element.hidden = !visible;
    const inSidebar = Boolean(element.closest("#sidebar"));
    element.style.display = visible ? (inSidebar ? "flex" : "") : "none";
    element.setAttribute("aria-hidden", String(!visible));
  }

  function applyAuthState(state = lastAuthState) {
    if (!state) return;
    lastAuthState = state;
    document.querySelectorAll("[data-guest-only]").forEach((element) => setAuthElementVisibility(element, !state.authenticated));
    document.querySelectorAll("[data-logged-only]").forEach((element) => setAuthElementVisibility(element, state.authenticated));
    document.querySelectorAll("[data-admin-only]").forEach((element) => setAuthElementVisibility(element, state.isStaff));
    document.querySelectorAll("[data-owner-only]").forEach((element) => setAuthElementVisibility(element, state.isOwner));
  }

  // Lembra o estado mesmo se main.js avisar antes ou depois da injeção do menu.
  document.addEventListener("maxsom:auth-state-updated", (event) => {
    if (event.detail) applyAuthState(event.detail);
  });

  const currentPage = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  function link(item, current) {
    const active = item.href.toLowerCase() === current;
    const attributes = item.attributes ? ` ${item.attributes}` : "";
    return `<a class="nav-link${active ? " active" : ""}" href="${esc(item.href)}"${active ? ' aria-current="page"' : ""} title="${esc(item.label)}"${attributes}>
      <i class="${esc(item.icon)} nav-icon" aria-hidden="true"></i><span class="nav-label">${esc(item.label)}</span></a>`;
  }

  function loadIconStylesheet() {
    if (document.querySelector('link[data-maxsom-icons="fontawesome"], link[href*="cdnjs.cloudflare.com/ajax/libs/font-awesome/"]')) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css";
    stylesheet.crossOrigin = "anonymous";
    stylesheet.referrerPolicy = "no-referrer";
    stylesheet.dataset.maxsomIcons = "fontawesome";
    document.head.appendChild(stylesheet);
  }

  function render() {
    if (document.getElementById("sidebar")) return;
    loadIconStylesheet();

    const current = currentPage();
    const sidebar = document.createElement("aside");
    sidebar.id = "sidebar";
    sidebar.className = "sidebar";
    sidebar.setAttribute("aria-label", "Navegação da Max Som");
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <a href="index.html" class="brand" aria-label="Max Som — Início">
          <img src="../assets/logo-maxsom-white.png" alt="Max Som" class="brand-logo">
        </a>
        <button class="sidebar-close-btn" id="closeSidebar" type="button" aria-label="Fechar menu">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <button class="menu-toggle" id="menuToggle" type="button" aria-controls="sidebar" aria-expanded="true" aria-label="Recolher menu">
        <i class="fa-solid fa-bars-staggered" aria-hidden="true"></i><span class="toggle-label">Recolher menu</span>
      </button>

      <div class="sidebar-section-label">Navegação</div>
      <nav class="side-nav" aria-label="Menu principal">
        ${PAGE_LINKS.map(item => link(item, current)).join("")}
      </nav>

      <div class="menu-divider" role="separator" aria-hidden="true"></div>
      <div class="sidebar-section-label">Área de atendimento</div>
      <nav class="side-nav side-nav-secondary" aria-label="Área do cliente e equipe">
        ${ACCOUNT_LINKS.map(item => link(item, current)).join("")}
      </nav>

      <div class="sidebar-bottom">
        <div class="menu-divider sidebar-bottom-divider" role="separator" aria-hidden="true"></div>
        <div class="sidebar-section-label">Suporte e conta</div>
        ${BOTTOM_LINKS.map(item => link(item, current)).join("")}
        <button class="nav-link logout-link" type="button" data-logout data-logged-only title="Sair" style="display:none">
          <i class="fa-solid fa-right-from-bracket nav-icon" aria-hidden="true"></i><span class="nav-label">Sair</span>
        </button>
        <a class="nav-link sidebar-whatsapp" href="https://wa.me/5565996262514" target="_blank" rel="noopener noreferrer" title="Falar no WhatsApp com a Max Som">
          <i class="fa-brands fa-whatsapp nav-icon" aria-hidden="true"></i><span class="nav-label">Falar com a Max Som</span>
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
      button.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      topbar.prepend(button);
    }

    const mobileMenuButton = document.getElementById("mobileMenu");

    function isMobileSidebarOpen() {
      return document.body.classList.contains("mobile-sidebar-open") ||
        document.body.classList.contains("sidebar-open") ||
        sidebar.classList.contains("active") ||
        sidebar.classList.contains("open");
    }

    function setMobileSidebarOpen(open) {
      document.body.classList.toggle("mobile-sidebar-open", open);
      document.body.classList.toggle("sidebar-open", open);
      document.body.classList.toggle("menu-open", open);
      sidebar.classList.toggle("active", open);
      sidebar.classList.toggle("open", open);
      overlay.classList.toggle("active", open);
      overlay.classList.toggle("visible", open);
      overlay.classList.toggle("show", open);
      overlay.setAttribute("aria-hidden", String(!open));
      if (mobileMenuButton) mobileMenuButton.setAttribute("aria-expanded", String(open));
      const closeButton = document.getElementById("closeSidebar");
      if (closeButton) closeButton.setAttribute("aria-expanded", String(open));
      if (window.matchMedia("(max-width: 768px)").matches) {
        document.body.style.overflow = open ? "hidden" : "";
      } else {
        document.body.style.overflow = "";
      }
    }

    function toggleSidebarCollapse() {
      if (window.matchMedia("(max-width: 768px)").matches) {
        setMobileSidebarOpen(!isMobileSidebarOpen());
        return;
      }

      document.body.classList.toggle("sidebar-collapsed");
      const collapsed = document.body.classList.contains("sidebar-collapsed");
      try { localStorage.setItem("maxsom-sidebar-collapsed", collapsed ? "1" : "0"); } catch (_) {}
      const btn = document.getElementById("menuToggle");
      if (btn) {
        btn.setAttribute("aria-expanded", String(!collapsed));
        btn.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
        btn.setAttribute("title", collapsed ? "Expandir menu" : "Recolher menu");
        const label = btn.querySelector(".toggle-label");
        if (label) label.textContent = collapsed ? "Expandir menu" : "Recolher menu";
      }
    }

    const menuToggle = sidebar.querySelector("#menuToggle");
    if (menuToggle) {
      menuToggle.dataset.layoutMenuBound = "true";
      menuToggle.addEventListener("click", toggleSidebarCollapse);
    }

    // O menu móvel precisa funcionar independentemente da autenticação/Supabase.
    // Por isso, seu evento é ligado aqui, dentro do componente que cria o menu,
    // antes de main.js iniciar qualquer operação assíncrona.
    if (mobileMenuButton && mobileMenuButton.dataset.layoutMenuBound !== "true") {
      mobileMenuButton.dataset.layoutMenuBound = "true";
      mobileMenuButton.addEventListener("click", (event) => {
        event.preventDefault();
        setMobileSidebarOpen(!isMobileSidebarOpen());
      });
    }

    const closeSidebarBtn = sidebar.querySelector("#closeSidebar");
    if (closeSidebarBtn && closeSidebarBtn.dataset.layoutMenuBound !== "true") {
      closeSidebarBtn.dataset.layoutMenuBound = "true";
      closeSidebarBtn.type = "button";
      closeSidebarBtn.addEventListener("click", (event) => {
        event.preventDefault();
        setMobileSidebarOpen(false);
      });
    }

    if (overlay.dataset.layoutMenuBound !== "true") {
      overlay.dataset.layoutMenuBound = "true";
      overlay.addEventListener("click", () => setMobileSidebarOpen(false));
    }

    // Fechar ao escolher uma página, tocar em Escape ou girar o aparelho para desktop.
    sidebar.querySelectorAll("a.nav-link").forEach((navLink) => {
      if (navLink.dataset.layoutLinkBound === "true") return;
      navLink.dataset.layoutLinkBound = "true";
      navLink.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
          setMobileSidebarOpen(false);
        }
      });
    });

    if (document.body.dataset.layoutEscapeBound !== "true") {
      document.body.dataset.layoutEscapeBound = "true";
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMobileSidebarOpen(false);
      });
    }

    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 768px)").matches) {
        setMobileSidebarOpen(false);
      }
    }, { passive: true });

    try {
      if (window.matchMedia("(min-width: 769px)").matches && localStorage.getItem("maxsom-sidebar-collapsed") === "1") {
        document.body.classList.add("sidebar-collapsed");
        if (menuToggle) {
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Expandir menu");
          menuToggle.setAttribute("title", "Expandir menu");
          const label = menuToggle.querySelector(".toggle-label");
          if (label) label.textContent = "Expandir menu";
        }
      }
    } catch (_) {}

    // Se o estado de autenticação já chegou, aplique-o à navegação recém-criada.
    if (lastAuthState) applyAuthState(lastAuthState);
    document.dispatchEvent(new CustomEvent("maxsom:menu-ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
