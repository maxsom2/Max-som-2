/* O menu compartilhado do projeto é inicializado por js/main.js. */
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.MaxSom?.initialize) window.MaxSom.initialize();
    }, { once: true });
  } else if (window.MaxSom?.initialize) {
    window.MaxSom.initialize();
  }
})();
