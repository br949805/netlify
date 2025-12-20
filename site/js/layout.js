// site/js/layout.js
function sidebarHtml(active) {
  const is = (key) => (active === key ? "nav-active" : "");
  const aria = (key) => (active === key ? `aria-current="page"` : "");

  return `
    <aside class="w-[280px] panel flex flex-col">
      <div class="px-5 py-4 border-b" style="border-color:var(--border)">
        <div class="flex items-center gap-3">
          <div class="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center">
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

        <a class="navlink disabled" href="#">
          <span class="text-sm">Matchups</span>
        </a>

        <a class="navlink disabled" href="#">
          <span class="text-sm">Players</span>
        </a>

        <div class="mt-3 pt-3 border-t" style="border-color:var(--border)"></div>

        <a class="navlink disabled" href="#">
          <span class="text-sm">History</span>
        </a>

        <a class="navlink ${is("rules")}" ${aria("rules")} href="./rules.html">
          <span class="text-sm">Rules</span>
        </a>
      </nav>

      <div class="mt-auto p-4">
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

export function renderLayout({ active = "home", mainHtml = "" } = {}) {
  const app = document.getElementById("app");
  if (!app) throw new Error('Missing <div id="app"></div>');

  app.innerHTML = `
    <div class="flex min-h-screen">
      ${sidebarHtml(active)}
      <main class="flex-1">${mainHtml}</main>
    </div>
  `;
}