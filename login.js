/* Compatibilidade legada: o fluxo de login atual é controlado por js/main.js. */
document.addEventListener("DOMContentLoaded", () => {
  if (window.MaxSom && typeof window.MaxSom.initialize === "function") {
    window.MaxSom.initialize();
  }
});
