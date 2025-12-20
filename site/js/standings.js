import { api } from "./api.js";
import { setText, setJson } from "./ui.js";

async function main() {
  try {
    setText("#status", "Fetching data…");
    const data = await api("standings");
    setText("#status", "OK");
    setJson("#out", data);
  } catch (err) {
    setText("#status", `Error: ${err.message}`);
    console.error(err);
  }
}

main();
