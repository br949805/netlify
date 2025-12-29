import fs from "node:fs/promises";
import path from "node:path";

const START_LEAGUE_ID = "1203358930160328704"; // your 2025 league
const OUT_DIR = path.join(process.cwd(), "site", "data", "history");
const SEASONS_DIR = path.join(OUT_DIR, "seasons");
const MANUAL_DIR = path.join(OUT_DIR, "manual");

// Optional: you create this file for the two manual seasons
const MANUAL_INDEX_PATH = path.join(process.cwd(), "history.manual.json");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function safeFetchJson(url) {
  try {
    return await fetchJson(url);
  } catch (e) {
    return null; // tolerate missing bracket endpoints for some seasons
  }
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getLeagueChain(startLeagueId) {
  const chain = [];
  let leagueId = startLeagueId;

  while (leagueId && leagueId !== "0") {
    const league = await fetchJson(`https://api.sleeper.app/v1/league/${leagueId}`);

    chain.push({
      source: "sleeper",
      season: String(league.season),
      league_id: league.league_id,
      name: league.name,
      previous_league_id: league.previous_league_id ?? null
    });

    const prev = league.previous_league_id;
    leagueId = (prev && prev !== "0") ? prev : null;
  }

  chain.sort((a, b) => Number(a.season) - Number(b.season));
  return chain;
}

async function buildSeasonPack(leagueId) {
  const league = await fetchJson(`https://api.sleeper.app/v1/league/${leagueId}`);
  const users = await fetchJson(`https://api.sleeper.app/v1/league/${leagueId}/users`);
  const rosters = await fetchJson(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);

  const winners_bracket = await safeFetchJson(
    `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`
  );
  const loser_bracket = await safeFetchJson(
    `https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`
  );

  // Matchups are optional; you can add later if you want week-by-week history.
  // const matchupsByWeek = {};

  return {
    generated_at: new Date().toISOString(),
    league,
    users,
    rosters,
    winners_bracket,
    loser_bracket
  };
}

async function main() {
  await fs.mkdir(SEASONS_DIR, { recursive: true });
  await fs.mkdir(MANUAL_DIR, { recursive: true });

  // 1) Traverse Sleeper seasons
  const sleeperSeasons = await getLeagueChain(START_LEAGUE_ID);

  // 2) Write each season pack
  for (const s of sleeperSeasons) {
    const pack = await buildSeasonPack(s.league_id);
    const outPath = path.join(SEASONS_DIR, `${s.season}.json`);
    await fs.writeFile(outPath, JSON.stringify(pack, null, 2), "utf8");
    console.log(`Wrote ${outPath}`);
  }

  // 3) Load manual seasons if provided
  const manual = await readJsonIfExists(MANUAL_INDEX_PATH);
  const manualSeasons = (manual?.manual_seasons ?? []).map((m) => ({
    source: "manual",
    season: String(m.season),
    name: m.name ?? "League History (Manual)",
    path: `/data/history/manual/${m.season}.json`
  }));

  // Also write individual manual files into site/data/history/manual/<year>.json
  if (manual?.manual_seasons?.length) {
    for (const m of manual.manual_seasons) {
      const outPath = path.join(MANUAL_DIR, `${m.season}.json`);
      await fs.writeFile(outPath, JSON.stringify(m, null, 2), "utf8");
      console.log(`Wrote ${outPath}`);
    }
  }

  // 4) Build combined index.json (manual + sleeper)
  const combined = [
    ...manualSeasons,
    ...sleeperSeasons.map((s) => ({
      source: "sleeper",
      season: s.season,
      league_id: s.league_id,
      name: s.name
    }))
  ].sort((a, b) => Number(a.season) - Number(b.season));

  const index = {
    generated_at: new Date().toISOString(),
    seasons: combined
  };

  await fs.writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2), "utf8");
  console.log(`Wrote ${path.join(OUT_DIR, "index.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
