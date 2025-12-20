// Shared API helper (ES module)

export const API_BASE = "https://script.google.com/macros/s/AKfycbyS40ekvxtFXjjj9NIav3xe-4ZUTxc1EEdfpGJalS69h0NUSZKC8u6jwowuJhOhXo_hDQ/exec";

export async function api(endpoint, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set("endpoint", endpoint);

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

