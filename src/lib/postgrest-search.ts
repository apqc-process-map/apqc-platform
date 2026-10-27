const safeColumn = /^[a-z_][a-z0-9_]*$/;

export function normalizeSearchTerm(value: string, maxLength = 120) {
  return value.trim().slice(0, maxLength);
}

function quotedIlikePattern(term: string) {
  const escapedPattern = term.replace(/[\\%_]/g, "\\$&");
  const value = `*${escapedPattern}*`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${value}"`;
}

/** Build a raw PostgREST OR expression from trusted column names and escaped user text. */
export function buildOrIlikeFilter(columns: readonly string[], rawTerm: string) {
  const term = normalizeSearchTerm(rawTerm);
  if (!term) return null;
  if (!columns.length || columns.some((column) => !safeColumn.test(column))) {
    throw new Error("Invalid search column configuration.");
  }
  const pattern = quotedIlikePattern(term);
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}