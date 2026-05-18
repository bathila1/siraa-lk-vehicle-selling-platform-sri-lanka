import { z } from 'zod';

/**
 * Reusable Zod schemas. Used at every input boundary:
 *  - Form validation (client-side)
 *  - API route validation (server-side)
 *  - Type derivation (z.infer<typeof Schema>)
 *
 * Rule: validate twice, trust once. Even with client validation, the server
 * re-validates because the client can be bypassed.
 */

// ---------- Primitives ----------

/** Sri Lankan phone numbers: accepts +9476..., 9476..., 076... — normalizes to +9476... */
export const sriLankanPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s|-/g, ''))
  .refine((v) => /^(\+?94|0)7\d{8}$/.test(v), {
    message: 'Enter a valid Sri Lankan mobile number (07x xxx xxxx)',
  })
  .transform((v) => {
    if (v.startsWith('+94')) return v;
    if (v.startsWith('94')) return `+${v}`;
    if (v.startsWith('0')) return `+94${v.slice(1)}`;
    return v;
  });

export const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

/** Bounded positive integer */
export const positiveInt = z.coerce.number().int().positive();

/** LKR amount stored as integer (no decimals) */
export const lkrPrice = z.coerce
  .number()
  .int('Price must be a whole number')
  .min(1000, 'Price must be at least Rs. 1,000')
  .max(1_000_000_000, 'Price exceeds maximum');

// ---------- Auth ----------

export const otpRequestSchema = z.object({
  phone: sriLankanPhone,
  purpose: z.enum(['seller_signup', 'seller_login', 'admin_login']),
  captchaToken: z.string().min(1, 'Captcha verification required'),
});

export const otpVerifySchema = z.object({
  phone: sriLankanPhone,
  code: otpCode,
  purpose: z.enum(['seller_signup', 'seller_login', 'admin_login']),
});

export const sellerSignupSchema = z.object({
  phone: sriLankanPhone,
  whatsappNumber: sriLankanPhone.optional(),
  fullName: z.string().trim().min(2, 'Name too short').max(80, 'Name too long'),
  districtId: positiveInt.optional(),
  cityId: positiveInt.optional(),
});

// ---------- Vehicles ----------

export const vehicleConditionEnum = z.enum(['registered']);

export const transmissionEnum = z.enum(['auto', 'manual', 'tiptronic', 'cvt', 'other']);

export const fuelEnum = z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'cng', 'lpg', 'other']);

export const bodyTypeEnum = z.enum([
  'sedan',
  'hatchback',
  'coupe',
  'wagon',
  'suv',
  'pickup',
  'van',
  'convertible',
  'mpv',
  'other',
]);

const currentYear = new Date().getFullYear();

export const vehicleCreateSchema = z.object({
  vehicleTypeId: positiveInt,
  makeId: positiveInt,
  model: z.string().trim().min(1, 'Model is required').max(60),
  year: z.coerce
    .number()
    .int()
    .min(1900, 'Year too old')
    .max(currentYear + 1, 'Year cannot be in the future'),
  price: lkrPrice,
  mileageKm: z.coerce.number().int().nonnegative().max(2_000_000).optional(),
  engineCc: z.coerce.number().int().positive().max(20_000).optional(),
  bodyType: bodyTypeEnum.optional(),
  transmission: transmissionEnum.optional(),
  fuelType: fuelEnum.optional(),
  condition: vehicleConditionEnum.default('registered'),
  color: z.string().trim().max(30).optional(),
  previousOwners: z.coerce.number().int().nonnegative().max(20).optional(),
  description: z.string().trim().max(5000).optional(),
  districtId: positiveInt,
  cityId: positiveInt.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  customAttributes: z.record(z.unknown()).default({}),
  imageIds: z.array(z.string()).min(3, 'Upload at least 3 images').max(6, 'Maximum 6 images'),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

// ---------- Search ----------

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  vehicleTypeId: positiveInt.optional(),
  makeId: positiveInt.optional(),
  model: z.string().trim().max(60).optional(),
  yearMin: z.coerce.number().int().min(1900).max(2100).optional(),
  yearMax: z.coerce.number().int().min(1900).max(2100).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  transmission: transmissionEnum.optional(),
  fuelType: fuelEnum.optional(),
  condition: vehicleConditionEnum.optional(),
  districtId: positiveInt.optional(),
  cityId: positiveInt.optional(),
  sort: z
    .enum(['relevance', 'newest', 'price_asc', 'price_desc', 'year_desc'])
    .default('relevance'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(24),
});

// ---------- Image upload ----------

export const imageUploadSchema = z.object({
  filename: z.string().trim().min(1).max(120),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024, 'Max 8 MB per image'),
});

// ---------- Boosts & payments ----------

export const boostInitiateSchema = z.object({
  vehicleId: positiveInt,
  planId: positiveInt,
});

// ---------- Reports ----------

export const reportSchema = z.object({
  vehicleId: positiveInt,
  reason: z.enum(['sold', 'scam', 'wrong_info', 'duplicate', 'other']),
  reporterPhone: sriLankanPhone.optional(),
  reporterName: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
});

// ---------- Saved lists ----------

export const saveShareSchema = z.object({
  vehicleIds: z
    .array(positiveInt)
    .min(1, 'Add at least one vehicle')
    .max(100, 'Maximum 100 vehicles per list'),
});

// ---------- Derived types ----------

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type SellerSignupInput = z.infer<typeof sellerSignupSchema>;
export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type BoostInitiateInput = z.infer<typeof boostInitiateSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type SaveShareInput = z.infer<typeof saveShareSchema>;
