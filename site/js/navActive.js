// site/js/navActive.js
export function applyActiveNav() {
  const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  const pageKey = {
    "index.html": "home",
    "standings.html": "standings",
    "rules.html": "rules",
  }[file] || "home";

  document.querySelectorAll("[data-nav]").forEach((el) => {
    const isActive = el.dataset.nav === pageKey;
    el.classList.toggle("nav-active", isActive);
    if (isActive) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}
