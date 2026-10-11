document.addEventListener("DOMContentLoaded", function () {

    // Elementos do site
    const sidebar = document.getElementById("sidebar");
    const page = document.querySelector(".page");
    const overlay = document.getElementById("overlay");

    const menuToggle = document.getElementById("menuToggle");
    const closeSidebar = document.getElementById("closeSidebar");

    const currentYear = document.getElementById("currentYear");
    const sidebarYear = document.getElementById("sidebarYear");


    // ========================================
    // ANO AUTOMÁTICO
    // ========================================

    const year = new Date().getFullYear();

    if (currentYear) {
        currentYear.textContent = year;
    }

    if (sidebarYear) {
        sidebarYear.textContent = year;
    }


    // ========================================
    // VERIFICAR TAMANHO DA TELA
    // ========================================

    function isMobile() {
        return window.innerWidth <= 860;
    }


    // ========================================
    // ABRIR MENU NO CELULAR
    // ========================================

    function openMobileMenu() {

        if (!sidebar || !overlay) return;

        sidebar.classList.add("open");
        overlay.classList.add("active");

        document.body.style.overflow = "hidden";
    }


    // ========================================
    // FECHAR MENU NO CELULAR
    // ========================================

    function closeMobileMenu() {

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (overlay) {
            overlay.classList.remove("active");
        }

        document.body.style.overflow = "";
    }


    // ========================================
    // BOTÃO DO MENU
    // ========================================

    if (menuToggle && sidebar && page) {

        menuToggle.addEventListener("click", function () {

            if (isMobile()) {

                // No celular, abre ou fecha o menu
                if (sidebar.classList.contains("open")) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }

            } else {

                // No computador, recolhe ou expande o menu
                sidebar.classList.toggle("collapsed");

                const collapsed =
                    sidebar.classList.contains("collapsed");

                page.classList.toggle(
                    "sidebar-collapsed",
                    collapsed
                );

            }

        });

    }


    // ========================================
    // BOTÃO X DO MENU
    // ========================================

    if (closeSidebar) {

        closeSidebar.addEventListener("click", function () {
            closeMobileMenu();
        });

    }


    // ========================================
    // CLICAR NO FUNDO ESCURO
    // ========================================

    if (overlay) {

        overlay.addEventListener("click", function () {
            closeMobileMenu();
        });

    }


    // ========================================
    // FECHAR MENU AO TROCAR DE PÁGINA
    // ========================================

    document.querySelectorAll(".sidebar a").forEach(function (link) {

        link.addEventListener("click", function () {

            if (isMobile()) {
                closeMobileMenu();
            }

        });

    });


    // ========================================
    // AJUSTAR AO REDIMENSIONAR A TELA
    // ========================================

    window.addEventListener("resize", function () {

        if (!sidebar || !page) return;

        if (isMobile()) {

            sidebar.classList.remove("collapsed");
            page.classList.remove("sidebar-collapsed");

        } else {

            closeMobileMenu();

        }

    });

});
