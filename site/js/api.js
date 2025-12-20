const API_BASE =
  "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";

export async function api(endpoint, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set("endpoint", endpoint);

  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("API error");
  return res.json();
}
