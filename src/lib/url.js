/** Small helpers for keeping filter state in the URL (shareable links). */

/** searchParams prop (Promise result) -> flat object of first string values. */
export function normalizeSearchParams(sp) {
  const out = {};
  for (const [key, value] of Object.entries(sp ?? {})) {
    if (Array.isArray(value)) out[key] = value[0] ?? "";
    else out[key] = value ?? "";
  }
  return out;
}

/**
 * Merge query changes into the current query string.
 * Empty/null values are dropped. Example:
 *   buildQuery({ q: "tee", page: "2" }, { q: "hoodie", page: 1 }) -> "?q=hoodie"
 */
export function buildQuery(current = {}, changes = {}) {
  const merged = { ...current, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
