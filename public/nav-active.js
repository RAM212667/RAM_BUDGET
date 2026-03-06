(function () {
  function normalizePath(path) {
    if (!path || path === "/") return "index.html";
    const clean = path.split("?")[0].split("#")[0];
    const last = clean.substring(clean.lastIndexOf("/") + 1);
    return last || "index.html";
  }

  function ensureStyle() {
    if (document.getElementById("active-tab-style")) return;
    const style = document.createElement("style");
    style.id = "active-tab-style";
    style.textContent = `
      .page-link.is-active {
        background: #eef8f3;
        border-color: #8ccdb2;
        color: #144b3a;
        box-shadow: 0 0 0 1px rgba(140, 205, 178, 0.45), 0 0 14px rgba(69, 153, 117, 0.18);
      }
    `;
    document.head.appendChild(style);
  }

  function markActiveTab() {
    const current = normalizePath(window.location.pathname);
    const links = document.querySelectorAll(".page-nav .page-link[href]");
    links.forEach(link => {
      const href = link.getAttribute("href") || "";
      const target = normalizePath(href);
      link.classList.toggle("is-active", target === current);
    });
  }

  function init() {
    ensureStyle();
    markActiveTab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
