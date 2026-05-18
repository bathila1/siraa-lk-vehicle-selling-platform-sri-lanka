import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes, deduplicating and resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Turn a string into a URL-safe slug.
 * Removes accents, lowercases, replaces non-alphanumeric with hyphens.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Build a unique vehicle slug: "toyota-aqua-2015-colombo-x9k2nm"
 */
export function buildVehicleSlug(parts: {
  make: string;
  model: string;
  year: number;
  city?: string | null;
  random?: string;
}): string {
  const base = slugify(
    [parts.make, parts.model, parts.year, parts.city].filter(Boolean).join(' '),
  );
  const rand = parts.random ?? randomShortId(6);
  return `${base}-${rand}`;
}

/** Generate a short alphanumeric ID (lowercase, no ambiguous chars). */
export function randomShortId(length = 6): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Format LKR price compactly: 4_500_000 → "Rs. 45 Lakhs"
 * Pass full=true to get "Rs. 4,500,000".
 */
export function formatLKR(amount: number, full = false): string {
  if (full) {
    return 'Rs. ' + amount.toLocaleString('en-LK');
  }
  if (amount >= 10_000_000) {
    return `Rs. ${(amount / 10_000_000).toFixed(amount % 10_000_000 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100_000) {
    const lakhs = amount / 100_000;
    return `Rs. ${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2)} Lakhs`;
  }
  if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(0)}K`;
  }
  return 'Rs. ' + amount.toLocaleString('en-LK');
}

/** Build a WhatsApp deeplink for a vehicle inquiry. */
export function whatsappLink(phone: string, message: string): string {
  const normalized = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Build a tel: link. */
export function callLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

/** Normalize a Sri Lankan phone to +9476XXXXXXX. */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('+94')) return cleaned;
  if (cleaned.startsWith('94')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+94${cleaned.slice(1)}`;
  return cleaned;
}

/** Mask a phone for public display: +94764790033 → 076 479 ••33 */
export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  const local = normalized.replace('+94', '0');
  if (local.length < 10) return local;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ••${local.slice(-2)}`;
}

/** Pretty time-ago. */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
}
