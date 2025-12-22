// site/js/layout.js
function sidebarHtml(active) {
  const is = (key) => (active === key ? "nav-active" : "");
  const aria = (key) => (active === key ? `aria-current="page"` : "");

  return `
    <aside id="sidebar"
      class="panel flex flex-col
             fixed inset-y-0 left-0 z-50 w-[280px]
             -translate-x-full transition-transform duration-200
             md:static md:translate-x-0 md:w-[280px]">
      <div class="px-5 py-4 border-b" style="border-color:var(--border)">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="./assets/logo.svg" alt="League logo" class="w-full h-full object-contain" />
          </div>
          <div>
            <div class="font-semibold leading-tight">League Hub</div>
            <div class="text-xs muted">Dynasty • 2025 Season</div>
          </div>
        </div>
      </div>

      <nav class="px-3 py-3 space-y-1">
        <a class="navlink ${is("home")}" ${aria("home")} href="./index.html">
          <span class="text-sm font-semibold">News & Stories</span>
          <span class="nav-badge">Home</span>
        </a>

        <a class="navlink ${is("standings")}" ${aria("standings")} href="./standings.html">
          <span class="text-sm">Standings</span>
        </a>

        <a class="navlink disabled" href="#"><span class="text-sm">Matchups</span></a>
        <a class="navlink disabled" href="#"><span class="text-sm">Players</span></a>

        <div class="mt-3 pt-3 border-t" style="border-color:var(--border)"></div>

        <a class="navlink disabled" href="#"><span class="text-sm">History</span></a>

        <a class="navlink ${is("rules")}" ${aria("rules")} href="./rules.html">
          <span class="text-sm">Rules</span>
        </a>
      </nav>

      <!-- Hide the tip card on mobile to reduce clutter -->
      <div class="mt-auto p-4 hidden md:block">
        <div class="panel2 rounded-2xl p-4">
          <div class="text-sm font-semibold">Tip</div>
          <div class="text-xs muted mt-1">
            Publish weekly recaps + power rankings here and embed the best posts into your main page.
          </div>
          <button class="mt-3 w-full text-sm font-semibold rounded-xl px-3 py-2"
                  style="background:rgba(45,212,191,.16); border:1px solid rgba(45,212,191,.28); color:var(--text)">
            Create Story
          </button>
        </div>
      </div>
    </aside>
  `;
}

function topbarHtml() {
  return `
    <div class="md:hidden sticky top-0 z-40 panel border-b" style="border-color:var(--border)">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="./assets/logo.svg" alt="League logo" class="w-9 h-9 object-contain" />
          <div class="font-extrabold tracking-tight">League Hub</div>
        </div>
        <button id="menuBtn"
          class="ringy rounded-xl px-3 py-2 text-sm font-semibold"
          style="background:rgba(255,255,255,.06); border:1px solid var(--border)">
          Menu
        </button>
      </div>
    </div>
  `;
}

function overlayHtml() {
  return `
    <div id="overlay"
      class="fixed inset-0 z-40 hidden md:hidden"
      style="background:rgba(0,0,0,.55)"></div>
  `;
}

export function renderLayout({ active = "home", mainHtml = "" } = {}) {
  const app = document.getElementById("app");
  if (!app) throw new Error('Missing <div id="app"></div>');

  app.innerHTML = `
    ${topbarHtml()}
    ${overlayHtml()}
    <div class="flex min-h-screen">
      ${sidebarHtml(active)}
      <main class="flex-1 min-w-0">${mainHtml}</main>
    </div>
  `;

  // Mobile drawer behavior
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuBtn = document.getElementById("menuBtn");

  const open = () => {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  };

  if (menuBtn) menuBtn.addEventListener("click", open);
  if (overlay) overlay.addEventListener("click", close);

  // Close drawer when a nav link is clicked (mobile)
  sidebar.querySelectorAll("a.navlink").forEach(a => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 767px)").matches) close();
    });
  });

  // Ensure sidebar is closed if user rotates / resizes into desktop
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 768px)").matches) close();
  });
}
