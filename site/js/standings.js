// site/js/standings.js
const LEAGUE_ID = "1203358930160328704";
const API_BASE = "https://api.sleeper.app/v1";

// 5-minute cache to keep the UI snappy + reduce API calls
const CACHE_KEY = `standings_${LEAGUE_ID}`;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toPoints(intPart, decPart) {
  const a = Number(intPart || 0);
  const d = Number(decPart || 0);
  return a + d / 100;
}

function safeTeamName(user, rosterId) {
  return (
    user?.metadata?.team_name ||
    user?.display_name ||
    user?.username ||
    `Team ${rosterId}`
  );
}

async function fetchJson(url) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

export async function getStandings() {
  // Cache read
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  } catch (_) {
    // ignore cache errors
  }

  const [rosters, users] = await Promise.all([
    fetchJson(`${API_BASE}/league/${LEAGUE_ID}/rosters`),
    fetchJson(`${API_BASE}/league/${LEAGUE_ID}/users`),
  ]);

  const userById = new Map(users.map((u) => [u.user_id, u]));

  const rows = rosters.map((r) => {
    const u = userById.get(r.owner_id);
    const w = Number(r?.settings?.wins || 0);
    const l = Number(r?.settings?.losses || 0);
    const t = Number(r?.settings?.ties || 0);

    const pf = toPoints(r?.settings?.fpts, r?.settings?.fpts_decimal);
    const pa = toPoints(r?.settings?.fpts_against, r?.settings?.fpts_against_decimal);

    return {
      roster_id: r.roster_id,
      owner_id: r.owner_id,
      team: safeTeamName(u, r.roster_id),
      owner: u?.display_name || u?.username || "",
      w, l, t,
      pf, pa,

      // placeholders for later
      maxpf: null,
      eff: null,
    };
  });

  // Sort: Wins desc → PF desc → PA asc
  rows.sort((a, b) => {
    if (b.w !== a.w) return b.w - a.w;
    if (b.pf !== a.pf) return b.pf - a.pf;
    return a.pa - b.pa;
  });

  // Add rank
  rows.forEach((r, i) => (r.rank = i + 1));

  // Cache write
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: rows }));
  } catch (_) {}

  return rows;
}
