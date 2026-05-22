/**
 * Site-wide display variables.
 * Edit these to change how things look across the app.
 * No DB call, no admin UI — just change values here, save, redeploy.
 */

export const CURRENCY = {
  prefix: 'Rs. ',

  // Thresholds (in LKR)
  thousandThreshold: 1000,
  lakhsThreshold: 100_000,
  croresThreshold: 10_000_000,

  // Labels
  thousandLabel: 'K',
  lakhsLabel: 'Lakhs',
  croresLabel: 'කෝටි',

  // Decimal places
  lakhsDecimals: 2,
  croresDecimals: 2,

  // Which units to use
  useThousands: false,
  useLakhs: true,
  useCrores: true,
};