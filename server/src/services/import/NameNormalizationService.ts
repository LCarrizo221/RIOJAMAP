/**
 * NameNormalizationService
 *
 * Pure functions for consistent Argentine name normalization.
 * No Prisma dependency — safe to instantiate anywhere without DB access.
 *
 * Normalization pipeline (applied in order):
 *   1. trim()
 *   2. toUpperCase()
 *   3. Strip Unicode combining marks (accents: NFD decompose → strip U+0300–U+036F)
 *   4. Remove commas, dots, and dashes  /[,.\-]/g
 *   5. Collapse internal whitespace     /\s+/g → single space
 *   6. trim() again (step 4 may leave leading/trailing spaces)
 *
 * Edge cases:
 *   - null / undefined / '' → returns '' (normalize), false (compare)
 *   - Slashes are preserved — caller splits on '/' if needed (e.g. "Gury/Sandra")
 */
export class NameNormalizationService {
  /**
   * Normalize a person name to a canonical uppercase ASCII form.
   * Returns '' for any falsy input (null, undefined, empty string).
   */
  normalize(input: string | null | undefined): string {
    if (!input) return '';

    return input
      .trim()
      .toUpperCase()
      // Decompose accented chars and strip combining marks (é → E, ñ → N, etc.)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remove commas, dots, and dashes
      .replace(/[,.\-]/g, '')
      // Collapse runs of whitespace to a single space
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Returns true iff both names normalize to the same string.
   * Returns false if either argument is falsy — guards against empty-name false matches.
   *
   * Examples:
   *   compare("Maza, Angel Eduardo", "MAZA ANGEL EDUARDO") → true
   *   compare("pini herrera",        "PINI HERRERA")       → true
   *   compare("",                    "")                   → false
   *   compare(null,                  "PINI HERRERA")       → false
   */
  compare(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b) return false;
    return this.normalize(a) === this.normalize(b);
  }
}
