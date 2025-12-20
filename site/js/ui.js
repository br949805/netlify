// Tiny UI helpers (ES module)

export function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

export function setText(selector, text) {
  $(selector).textContent = text;
}

export function setJson(selector, obj) {
  $(selector).textContent = JSON.stringify(obj, null, 2);
}
