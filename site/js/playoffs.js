// site/js/playoffs.js
const API_BASE = "https://api.sleeper.app/v1";
const CACHE_TTL_MS = 60 * 1000; // 1 minute (scores change; keep it fresh)
function cacheKey(leagueId) { return `playoffs_winners_${leagueId}`; }

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function safeTeamName(user, rosterId) {
  return (
    user?.metadata?.team_name ||
    user?.display_name ||
    user?.username ||
    `Team ${rosterId}`
  );
}

function teamLabelFromSource(src) {
  if (!src) return "TBD";
  if (typeof src === "object") {
    const k = Object.keys(src)[0];
    const m = src[k];
    if (k === "w") return `Winner of M${m}`;
    if (k === "l") return `Loser of M${m}`;
  }
  return "TBD";
}

function groupByRound(rows) {
  const map = new Map();
  rows.forEach(r => {
    const key = Number(r.r || 0);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  const rounds = [...map.keys()].sort((a,b)=>a-b);
  return rounds.map(r => ({
    round: r,
    games: map.get(r).slice().sort((a,b)=>Number(a.m)-Number(b.m))
  }));
}

function fmtScore(x) {
  if (x == null || Number.isNaN(Number(x))) return "—";
  return Number(x).toFixed(2);
}

function renderBracketHtml({ rounds, rosterToTeamName, pointsByRoster, week }) {
  const cols = Math.max(rounds.length, 1);

  // simple spacing heuristic: bigger gaps in later rounds
  const gapByRound = (r) => Math.min(40, 18 * Math.pow(2, r - 1));

  return `
    <div class="panel rounded-3xl p-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-extrabold tracking-tight">Playoff Bracket</h2>
          <div class="text-xs muted mt-1">Winners bracket • Week ${week} live scores</div>
        </div>
        <div class="text-xs muted">Refreshes ~every minute</div>
      </div>

      <div class="bracket-wrap mt-4">
        <div class="bracket" style="grid-template-columns: repeat(${cols}, minmax(260px, 1fr));">
          ${rounds.map((rnd, idx) => {
            const isLast = idx === rounds.length - 1;
            const roundGap = gapByRound(rnd.round);

            return `
              <div class="bracket-round ${isLast ? "is-last" : ""}">
                <div class="bracket-round-title">Round ${rnd.round}</div>
                <div class="bracket-games" style="--bracket-gap:${roundGap}px;">
                  ${rnd.games.map(g => {
                    const t1Name = (g.t1 != null) ? (rosterToTeamName.get(Number(g.t1)) || `Roster ${g.t1}`) : teamLabelFromSource(g.t1_from);
                    const t2Name = (g.t2 != null) ? (rosterToTeamName.get(Number(g.t2)) || `Roster ${g.t2}`) : teamLabelFromSource(g.t2_from);

                    const t1Score = (g.t1 != null) ? pointsByRoster.get(Number(g.t1)) : null;
                    const t2Score = (g.t2 != null) ? pointsByRoster.get(Number(g.t2)) : null;

                    const winner = g.w != null ? Number(g.w) : null;
                    const loser  = g.l != null ? Number(g.l) : null;

                    const t1IsWinner = winner != null && g.t1 != null && Number(g.t1) === winner;
                    const t2IsWinner = winner != null && g.t2 != null && Number(g.t2) === winner;

                    const t1IsLoser = loser != null && g.t1 != null && Number(g.t1) === loser;
                    const t2IsLoser = loser != null && g.t2 != null && Number(g.t2) === loser;

                    return `
                      <div class="bracket-game">
                        <div class="bracket-game-meta">
                          <div class="text-xs muted">M${g.m}</div>
                          ${winner ? `<div class="text-xs px-2 py-0.5 rounded-full"
                            style="background:rgba(45,212,191,.14); border:1px solid rgba(45,212,191,.25)">Final</div>` : ``}
                        </div>

                        <div class="bracket-team ${t1IsWinner ? "bracket-w" : ""}">
                          <div>
                            <div class="bracket-team-name ${g.t1 == null ? "bracket-placeholder" : ""}">${t1Name}</div>
                            ${t1IsLoser ? `<div class="bracket-team-sub">Eliminated</div>` : ``}
                          </div>
                          <div class="bracket-score">${fmtScore(t1Score)}</div>
                        </div>

                        <div class="bracket-team ${t2IsWinner ? "bracket-w" : ""}">
                          <div>
                            <div class="bracket-team-name ${g.t2 == null ? "bracket-placeholder" : ""}">${t2Name}</div>
                            ${t2IsLoser ? `<div class="bracket-team-sub">Eliminated</div>` : ``}
                          </div>
                          <div class="bracket-score">${fmtScore(t2Score)}</div>
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

export async function renderWinnersBracket({ leagueId, mountId }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  // Cache read (HTML)
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey(leagueId)) || "null");
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      mount.innerHTML = cached.html;
      return;
    }
  } catch (_) {}

  mount.innerHTML = `<div class="panel rounded-3xl p-5 muted text-sm">Loading playoff bracket…</div>`;

  try {
    // Get current NFL week from Sleeper state endpoint
    const nflState = await fetchJson(`${API_BASE}/state/nfl`);
    const week = Number(nflState?.week || 0);

    // Pull bracket + roster/user mapping + current week matchups (points)
    const [bracket, rosters, users, matchups] = await Promise.all([
      fetchJson(`${API_BASE}/league/${leagueId}/winners_bracket`),
      fetchJson(`${API_BASE}/league/${leagueId}/rosters`),
      fetchJson(`${API_BASE}/league/${leagueId}/users`),
      fetchJson(`${API_BASE}/league/${leagueId}/matchups/${week}`),
    ]);

    const userById = new Map(users.map(u => [u.user_id, u]));
    const rosterToTeamName = new Map();
    rosters.forEach(r => {
      const u = userById.get(r.owner_id);
      rosterToTeamName.set(Number(r.roster_id), safeTeamName(u, r.roster_id));
    });

    // Map roster_id -> points for current week
    const pointsByRoster = new Map();
    (matchups || []).forEach(m => {
      // Sleeper returns "points" on matchup rows
      pointsByRoster.set(Number(m.roster_id), Number(m.points ?? 0));
    });

    const rounds = groupByRound(bracket || []);
    const html = renderBracketHtml({ rounds, rosterToTeamName, pointsByRoster, week });

    mount.innerHTML = html;

    // Cache write
    try {
      sessionStorage.setItem(cacheKey(leagueId), JSON.stringify({ ts: Date.now(), html }));
    } catch (_) {}

  } catch (e) {
    console.error(e);
    mount.innerHTML = `
      <div class="panel rounded-3xl p-5">
        <div class="font-extrabold">Playoff Bracket</div>
        <div class="muted text-sm mt-1">
          Could not load bracket/scores yet. (If your league bracket isn’t created yet, Sleeper won’t return it.)
        </div>
      </div>
    `;
  }
}
