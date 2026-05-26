import { z } from 'zod';
import { normalizePhone } from '@/lib/phone';

/**
 * Validation schema for vehicle requests.
 *
 * Required: phone + vehicle_type_id
 * Everything else is optional — admin fills in gaps when contacting.
 *
 * All text fields are length-capped to prevent abuse.
 * Phone is normalized to +94 format.
 */
export const vehicleRequestSchema = z.object({
  // Required
  contactPhone: z
    .string()
    .trim()
    .transform((v) => normalizePhone(v))
    .refine((v): v is string => v !== null, {
      message: 'Enter a valid Sri Lankan mobile number',
    }),
  vehicleTypeId: z.number().int().positive('Choose a vehicle type'),

  // Optional contact
  contactName: z.string().trim().max(80).optional(),
  whatsappPref: z.boolean().optional().default(true),

  // Optional vehicle details
  make: z.string().trim().max(50).optional(),
  model: z.string().trim().max(100).optional(),
  yearMin: z.number().int().min(1990).max(2030).optional(),
  yearMax: z.number().int().min(1990).max(2030).optional(),
  budgetMin: z.number().nonnegative().max(1_000_000_000).optional(),
  budgetMax: z.number().nonnegative().max(1_000_000_000).optional(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'cng']).optional(),
  transmission: z.enum(['auto', 'manual', 'tiptronic', 'cvt']).optional(),
  condition: z.enum(['brand_new', 'unregistered', 'registered', 'reconditioned']).optional(),

  // Optional location
  districtId: z.number().int().positive().optional(),
  cityId: z.number().int().positive().optional(),

  // Free-form
  description: z.string().trim().max(1000).optional(),

  // Provenance
  source: z.enum(['direct', 'failed_search']).optional().default('direct'),
  sourceQuery: z.string().trim().max(200).optional(),

  // Bot check
  captchaToken: z.string().min(1, 'Captcha required'),
});

export type VehicleRequestInput = z.infer<typeof vehicleRequestSchema>;

/**
 * Parse a free-text search query and extract structured fields.
 * Used to prefill the request form when arriving from a failed search.
 *
 * Examples:
 *   "Toyota Aqua 2015 Colombo"
 *      → { make: 'Toyota', model: 'Aqua', yearMin: 2015, yearMax: 2015, _location: 'Colombo' }
 *   "Honda Vezel under 5000000"
 *      → { make: 'Honda', model: 'Vezel', budgetMax: 5000000 }
 *   "diesel 4WD jeep"
 *      → { fuelType: 'diesel', description: '4WD jeep' }
 *
 * Anything not understood goes into `description`.
 */
interface ParseResult {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  fuelType?: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  transmission?: 'auto' | 'manual';
  description?: string;
}

const KNOWN_MAKES = [
  'toyota', 'honda', 'suzuki', 'nissan', 'mitsubishi', 'mazda', 'subaru',
  'hyundai', 'kia', 'mercedes', 'bmw', 'audi', 'volkswagen', 'ford',
  'chevrolet', 'tata', 'mahindra', 'isuzu', 'daihatsu', 'porsche', 'volvo',
  'land rover', 'jeep', 'lexus', 'micro', 'perodua', 'proton',
];

const KNOWN_FUELS: Record<string, 'petrol' | 'diesel' | 'hybrid' | 'electric'> = {
  petrol: 'petrol',
  gasoline: 'petrol',
  diesel: 'diesel',
  hybrid: 'hybrid',
  electric: 'electric',
  ev: 'electric',
};

const KNOWN_TRANSMISSIONS: Record<string, 'auto' | 'manual'> = {
  auto: 'auto',
  automatic: 'auto',
  manual: 'manual',
  stick: 'manual',
};

export function parseSearchQuery(query: string): ParseResult {
  if (!query) return {};

  const lower = query.toLowerCase().trim();
  const result: ParseResult = {};
  const usedTokens = new Set<string>();
  const tokens = lower.split(/\s+/);

  // Detect make
  for (const make of KNOWN_MAKES) {
    if (lower.includes(make)) {
      result.make = make.charAt(0).toUpperCase() + make.slice(1);
      // Try to find model right after make
      const idx = lower.indexOf(make);
      const after = lower.slice(idx + make.length).trim();
      const modelMatch = after.match(/^([a-z0-9-]+)/);
      if (modelMatch && modelMatch[1].length > 1 && modelMatch[1].length < 30) {
        // Only treat as model if not a year/number
        if (!/^\d{4}$/.test(modelMatch[1]) && !/^\d+$/.test(modelMatch[1])) {
          result.model = modelMatch[1].charAt(0).toUpperCase() + modelMatch[1].slice(1);
          usedTokens.add(modelMatch[1]);
        }
      }
      make.split(' ').forEach((t) => usedTokens.add(t));
      break;
    }
  }

  // Detect year (4-digit number between 1990-2030)
  const yearMatches = [...lower.matchAll(/\b(19[9]\d|20[0-3]\d)\b/g)];
  if (yearMatches.length > 0) {
    const years = yearMatches.map((m) => parseInt(m[1])).sort();
    if (years.length === 1) {
      result.yearMin = years[0];
      result.yearMax = years[0];
    } else {
      result.yearMin = years[0];
      result.yearMax = years[years.length - 1];
    }
    yearMatches.forEach((m) => usedTokens.add(m[1]));
  }

  // Detect budget
  // Patterns: "under 5m", "below 3000000", "5 lakhs", "10 lakhs to 20 lakhs", "1cr"
  const budgetPatterns = [
    // "under 5m" / "below 5m" / "max 5m"
    /(?:under|below|max(?:imum)?|less than|up to)\s+(\d+(?:\.\d+)?)\s*(m|million|lakhs?|crores?|cr|k)/gi,
    // "5m budget" / "5 lakhs"
    /(\d+(?:\.\d+)?)\s*(m|million|lakhs?|crores?|cr|k)\s*(?:budget|max|maximum)?/gi,
    // Plain numbers >= 100000
    /\b(\d{6,9})\b/g,
  ];

  for (const pattern of budgetPatterns) {
    const match = pattern.exec(lower);
    if (match) {
      let value = parseFloat(match[1]);
      const unit = (match[2] || '').toLowerCase();
      if (unit === 'k') value *= 1_000;
      else if (unit === 'm' || unit === 'million') value *= 1_000_000;
      else if (unit.startsWith('lakh')) value *= 100_000;
      else if (unit.startsWith('cr')) value *= 10_000_000;

      if (value >= 50_000 && value <= 1_000_000_000) {
        // If "under/below" prefix → budgetMax; otherwise → budgetMax too
        result.budgetMax = value;
        usedTokens.add(match[0]);
      }
      break;
    }
  }

  // Detect fuel
  for (const [keyword, value] of Object.entries(KNOWN_FUELS)) {
    if (lower.includes(keyword)) {
      result.fuelType = value;
      usedTokens.add(keyword);
      break;
    }
  }

  // Detect transmission
  for (const [keyword, value] of Object.entries(KNOWN_TRANSMISSIONS)) {
    if (lower.includes(keyword)) {
      result.transmission = value;
      usedTokens.add(keyword);
      break;
    }
  }

  // Description = anything we couldn't parse
  const remainingTokens = tokens.filter(
    (t) => !usedTokens.has(t) && t.length > 1 && !/^\d+$/.test(t),
  );
  if (remainingTokens.length > 0) {
    result.description = remainingTokens.join(' ').slice(0, 500);
  }

  return result;
}
