/**
 * Technocore Single-Line Sweep
 *
 * Normalization replaces every character in Unicode categories
 * Cc, Cf, Cs, Co, Zl, and Zp with a space, then trims ends.
 */

const SWEEP_PATTERN = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu;

/**
 * Apply the Technocore single-line sweep to text.
 * Replaces all Unicode category Cc, Cf, Cs, Co, Zl, Zp chars with space and trims.
 */
export function sweep(text: string): string {
  if (typeof text !== 'string') return '';
  return text.replace(SWEEP_PATTERN, ' ').trim();
}
