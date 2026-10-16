/* =========================================================
   MAX SOM — MENU LATERAL GLOBAL
   Arquivo: js/menu.js
   ========================================================= */

(() => {
  "use strict";

  const links = [
    { href: "index.html", label: "Início", icon: "⌂" },
    { href: "produtos.html", label: "Produtos", icon: "▣" },
    { href: "servicos.html", label: "Serviços", icon: "⚙" },
    { href: "projetos.html", label: "Projetos", icon: "▧" },
    { href: "publicacoes.html", label: "Publicações", icon: "▤" },
    { href: "atendimento.html", label: "Atendimento", icon: "☏" }
  ];

  function currentPage() {
    return (
      window.location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();
  }

  function createLink(item, current) {
    const active = item.href.toLowerCase() === current;

    return `
      <a class="nav-link${active ? " active" : ""}"
         href="${item.href}"
         ${active ? 'aria-current="page"' : ""}>
        <span class="nav-icon" aria-hidden="true">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    `;
  }

  function renderMenu() {
    // Impede que o menu seja criado duas vezes.
    if (document.getElementById("sidebar")) return;

    const current = currentPage();

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.id = "sidebar";
    sidebar.setAttribute("aria-label", "Menu lateral");

    sidebar.innerHTML = `
      <a href="index.html"
         class="brand"
         aria-label="Max Som - Início">

        <img
          src="assets/logo-maxsom-white.png"
          alt="Max Som"
          class="brand-logo">
      </a>

      <button
        class="menu-toggle"
        id="menuToggle"
        type="button"
        aria-label="Recolher ou expandir menu"
        aria-controls="sidebar"
        aria-expanded="true">

        <span aria-hidden="true">☰</span>
        <span class="toggle-label">Recolher menu</span>
      </button>

      <nav class="side-nav" aria-label="Menu principal">
        ${links.map(item => createLink(item, current)).join("")}
      </nav>

      <div class="sidebar-bottom">

        <a class="nav-link" href="atendimento.html">
          <span class="nav-icon" aria-hidden="true">?</span>
          <span class="nav-label">Ajuda</span>
        </a>

        <a class="nav-link" href="login.html">
          <span class="nav-icon" aria-hidden="true">♙</span>
          <span class="nav-label">Minha conta</span>
        </a>

      </div>
    `;

    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    overlay.setAttribute("aria-hidden", "true");

    document.body.prepend(overlay);
    document.body.prepend(sidebar);

    // Adiciona o botão mobile na barra superior, se ela existir.
    const topbar = document.querySelector(".topbar");

    if (topbar && !document.getElementById("mobileMenu")) {
      const mobileButton = document.createElement("button");

      mobileButton.className = "mobile-menu-button";
      mobileButton.id = "mobileMenu";
      mobileButton.type = "button";
      mobileButton.setAttribute("aria-label", "Abrir menu");
      mobileButton.setAttribute("aria-controls", "sidebar");
      mobileButton.setAttribute("aria-expanded", "false");
      mobileButton.innerHTML =
        '<span aria-hidden="true">☰</span>';

      topbar.prepend(mobileButton);
    }

    setupMenuEvents();
  }

  function setupMenuEvents() {
    const sidebar = document.getElementById("sidebar");
    const desktopToggle = document.getElementById("menuToggle");
    const mobileToggle = document.getElementById("mobileMenu");
    const overlay = document.getElementById("sidebarOverlay");

    const isMobile = () =>
      window.matchMedia("(max-width: 768px)").matches;

    function closeMobileMenu() {
      document.body.classList.remove(
        "mobile-sidebar-open",
        "sidebar-open",
        "menu-open"
      );

      if (mobileToggle) {
        mobileToggle.setAttribute("aria-expanded", "false");
      }

      if (overlay) {
        overlay.setAttribute("aria-hidden", "true");
      }
    }

    function toggleMobileMenu() {
      const open =
        !document.body.classList.contains("mobile-sidebar-open");

      document.body.classList.toggle("mobile-sidebar-open", open);
      document.body.classList.toggle("sidebar-open", open);
      document.body.classList.toggle("menu-open", open);

      if (mobileToggle) {
        mobileToggle.setAttribute("aria-expanded", String(open));
      }

      if (overlay) {
        overlay.setAttribute("aria-hidden", String(!open));
      }
    }

    if (desktopToggle) {
      desktopToggle.addEventListener("click", () => {
        if (isMobile()) {
          toggleMobileMenu();
          return;
        }

        const collapsed =
          document.body.classList.toggle("sidebar-collapsed");

        desktopToggle.setAttribute(
          "aria-expanded",
          String(!collapsed)
        );

        const label =
          desktopToggle.querySelector(".toggle-label");

        if (label) {
          label.textContent = collapsed
            ? "Expandir menu"
            : "Recolher menu";
        }
      });
    }

    if (mobileToggle) {
      mobileToggle.addEventListener("click", toggleMobileMenu);
    }

    if (overlay) {
      overlay.addEventListener("click", closeMobileMenu);
    }

    if (sidebar) {
      sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          if (isMobile()) {
            closeMobileMenu();
          }
        });
      });
    }

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    });

    window.addEventListener("
