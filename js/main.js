
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const navLinks = document.querySelectorAll(".nav-link");

// Recolher ou expandir o menu no computador
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");

    const collapsed = document.body.classList.contains("sidebar-collapsed");

    menuToggle.setAttribute("aria-expanded", String(!collapsed));

    const label = menuToggle.querySelector(".toggle-label");

    if (label) {
      label.textContent = collapsed ? "Expandir menu" : "Recolher menu";
    }
  });
}

// Abrir o menu no celular
if (mobileMenu) {
  mobileMenu.addEventListener("click", () => {
    document.body.classList.add("mobile-sidebar-open");
    mobileMenu.setAttribute("aria-expanded", "true");
  });
}

// Fechar o menu do celular
function closeMobileMenu() {
  document.body.classList.remove("mobile-sidebar-open");

  if (mobileMenu) {
    mobileMenu.setAttribute("aria-expanded", "false");
  }
}

// Fechar ao clicar na área escura
if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeMobileMenu);
}

// Fechar ao pressionar Esc
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});

// Fechar o menu do celular ao escolher uma seção
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMobileMenu();

    navLinks.forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});
