/**
 * Safely unwraps a Supabase relationship that may be returned as:
 * - a single object  { id, name, ... }
 * - an array          [{ id, name, ... }]
 * - null / undefined
 *
 * Always returns either the first element (if array), the object itself, or null.
 *
 * Usage:
 *   const course = unwrapRelation(row.courses);
 *   // course is now a single object or null — never an array
 */
export function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/**
 * Safely extracts a slug string from any value.
 * Returns the value as a string, or a fallback if it's null/undefined/empty.
 */
export function safeSlug(value: unknown, fallback = "unknown"): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}
