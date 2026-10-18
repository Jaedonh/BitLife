/**
 * Legal-age rules for the player's romantic partners (lovers and spouses).
 *
 * Nobody dates under 16. Adults only ever pair with adults, and a 16- or
 * 17-year-old with someone within two years of their own age. A minor only
 * meets partners their own age or a little older (never above 17), so a couple
 * who stay together never end up as an adult and a minor as they age.
 */

export const MIN_ROMANCE_AGE = 16;
export const ADULT_AGE = 18;

/** The ages a new partner can have for a player of `age`, or null when the player is too young for romance. */
export function partnerAgeRange(age: number): [number, number] | null {
  if (age < MIN_ROMANCE_AGE) return null;
  if (age < ADULT_AGE) return [age, ADULT_AGE - 1];
  return [Math.max(ADULT_AGE, age - 4), age + 4];
}

/** Whether the player and a partner of these ages may be romantic. Checked on every romantic act, so it follows both as they age. */
export function romanceAllowed(playerAge: number, partnerAge: number): boolean {
  if (playerAge < MIN_ROMANCE_AGE || partnerAge < MIN_ROMANCE_AGE) return false;
  if (playerAge >= ADULT_AGE) return partnerAge >= ADULT_AGE;
  return Math.abs(playerAge - partnerAge) <= 2;
}

/** Clamps a content-given age range to `band`; when they do not overlap, the band wins. */
export function clampRange(range: [number, number], band: [number, number]): [number, number] {
  const lo = Math.max(range[0], band[0]);
  const hi = Math.min(range[1], band[1]);
  return lo <= hi ? [lo, hi] : band;
}
