/**
 * Sri Lankan phone number normalization.
 *
 * Goal: Convert ALL valid inputs to the same canonical form so the database
 * never has duplicates like "0771234567" and "+94771234567" for the same person.
 *
 * Canonical form: +94XXXXXXXXX (always +94 prefix, no spaces, no dashes)
 *
 * Accepted inputs:
 *   "0771234567"         → "+94771234567"
 *   "0 77 123 4567"      → "+94771234567"
 *   "077-123-4567"       → "+94771234567"
 *   "94771234567"        → "+94771234567"
 *   "+94 77 123 4567"    → "+94771234567"
 *   "+94771234567"       → "+94771234567"  (already canonical)
 *
 * Rejects: anything not matching SL mobile format
 */

/**
 * Normalize any SL phone input to canonical +94 form.
 * Returns null if not a valid SL mobile number.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Strip all whitespace, dashes, parens
  const cleaned = input.replace(/[\s\-()]/g, '');

  // Match the various accepted formats
  const patterns: Array<{ regex: RegExp; transform: (m: RegExpMatchArray) => string }> = [
    // 0xxxxxxxxx (10 digits starting with 0)
    {
      regex: /^0(7\d{8})$/,
      transform: (m) => `+94${m[1]}`,
    },
    // 94xxxxxxxxx (11 digits starting with 94)
    {
      regex: /^94(7\d{8})$/,
      transform: (m) => `+94${m[1]}`,
    },
    // +94xxxxxxxxx (already canonical-ish)
    {
      regex: /^\+94(7\d{8})$/,
      transform: (m) => `+94${m[1]}`,
    },
  ];

  for (const { regex, transform } of patterns) {
    const m = cleaned.match(regex);
    if (m) return transform(m);
  }

  return null;
}

/**
 * Display a phone number in a human-friendly way.
 *   "+94771234567" → "077 123 4567"
 */
export function formatPhoneDisplay(canonical: string): string {
  if (!canonical || !canonical.startsWith('+94')) return canonical;
  const digits = canonical.slice(3); // strip +94
  if (digits.length !== 9) return canonical;
  // Sri Lankan format: 0XX XXX XXXX
  return `0${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

/**
 * Mask a phone for public display.
 *   "+94771234567" → "+94 77 ••• 4567"
 */
export function maskPhone(canonical: string): string {
  if (!canonical || canonical.length < 6) return canonical;
  const visible = canonical.slice(-4);
  const prefix = canonical.slice(0, canonical.length - 7);
  return `${prefix}•••${visible}`;
}

/** Check validity without normalizing (e.g. for client-side instant feedback) */
export function isValidPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null;
}
