/**
 * Smart search parser.
 * Parses free-text queries like "toyota aqua 2015 colombo under 5m"
 * into structured filter objects that can be applied to the DB query.
 *
 * Examples:
 *   "toyota aqua 2015" → { textQuery: "toyota aqua", year: 2015 }
 *   "honda civic under 5m colombo" → { textQuery: "honda civic", priceMax: 500000, cityHint: "colombo" }
 *   "automatic suv" → { textQuery: "suv", transmission: "auto" }
 */

export interface ParsedQuery {
  textQuery: string; // cleaned text to pass to FTS
  year?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  transmissionHint?: 'auto' | 'manual';
  fuelHint?: string;
  cityHint?: string;
  districtHint?: string;
}

const PRICE_PATTERNS = [
  // "under 5m", "below 3.5m", "less than 2m"
  { re: /(?:under|below|less\s+than)\s+([\d.]+)\s*m(?:illion)?/i, type: 'max', unit: 1_000_000 },
  // "under 500k", "below 800k"
  { re: /(?:under|below|less\s+than)\s+([\d.]+)\s*k/i, type: 'max', unit: 1_000 },
  // "over 2m", "above 1.5m"
  { re: /(?:over|above|more\s+than)\s+([\d.]+)\s*m(?:illion)?/i, type: 'min', unit: 1_000_000 },
  // "under 5000000" (raw number > 100000)
  { re: /(?:under|below)\s+([\d]{6,})/i, type: 'max', unit: 1 },
  // "over 1000000"
  { re: /(?:over|above)\s+([\d]{6,})/i, type: 'min', unit: 1 },
];

const YEAR_PATTERN = /\b(19[5-9]\d|20[0-2]\d)\b/;

const TRANSMISSION_HINTS: Record<string, 'auto' | 'manual'> = {
  automatic: 'auto',
  auto: 'auto',
  tiptronic: 'auto',
  cvt: 'auto',
  manual: 'manual',
  'gear box': 'manual',
};

const FUEL_HINTS: Record<string, string> = {
  petrol: 'petrol',
  diesel: 'diesel',
  hybrid: 'hybrid',
  electric: 'electric',
  ev: 'electric',
  cng: 'cng',
  lpg: 'lpg',
};

// Sri Lankan cities/districts that might appear in search queries
const LOCATION_HINTS = [
  'colombo',
  'gampaha',
  'kandy',
  'galle',
  'matara',
  'kurunegala',
  'ratnapura',
  'kalutara',
  'negombo',
  'moratuwa',
  'dehiwala',
  'kotte',
  'battaramulla',
  'nugegoda',
  'maharagama',
  'homagama',
  'jaffna',
  'trincomalee',
  'batticaloa',
  'anuradhapura',
  'polonnaruwa',
  'badulla',
  'nuwara eliya',
  'hambantota',
  'matale',
  'puttalam',
  'vavuniya',
  'ampara',
  'moneragala',
  'kegalle',
];

export function parseSearchQuery(raw: string): ParsedQuery {
  let q = raw.trim().toLowerCase();
  const result: ParsedQuery = { textQuery: raw.trim() };

  // Extract price hints
  for (const p of PRICE_PATTERNS) {
    const m = q.match(p.re);
    if (m) {
      const value = Math.round(parseFloat(m[1]) * p.unit);
      if (p.type === 'max') result.priceMax = value;
      else result.priceMin = value;
      q = q.replace(m[0], '').trim();
    }
  }

  // Extract year
  const yearMatch = q.match(YEAR_PATTERN);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1]);
    q = q.replace(yearMatch[0], '').trim();
  }

  // Extract transmission hint
  for (const [keyword, value] of Object.entries(TRANSMISSION_HINTS)) {
    const re = new RegExp(`\\b${keyword}\\b`, 'i');
    if (re.test(q)) {
      result.transmissionHint = value;
      q = q.replace(re, '').trim();
      break;
    }
  }

  // Extract fuel hint
  for (const [keyword, value] of Object.entries(FUEL_HINTS)) {
    const re = new RegExp(`\\b${keyword}\\b`, 'i');
    if (re.test(q)) {
      result.fuelHint = value;
      q = q.replace(re, '').trim();
      break;
    }
  }

  // Extract location hint
  for (const loc of LOCATION_HINTS) {
    if (q.includes(loc)) {
      result.cityHint = loc;
      q = q.replace(new RegExp(`\\b${loc}\\b`, 'i'), '').trim();
      break;
    }
  }

  // Clean up leftover noise words
  q = q.replace(/\s{2,}/g, ' ').trim();
  result.textQuery = q || raw.trim();

  return result;
}

/**
 * Convert ParsedQuery into a websearch-compatible tsquery string.
 * e.g. "toyota aqua" → "toyota & aqua"
 */
export function toTsQuery(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[^a-z0-9]/gi, ''))
    .filter((w) => w.length > 1)
    .join(' & ');
}
