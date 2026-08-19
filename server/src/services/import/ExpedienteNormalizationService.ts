/**
 * ExpedienteNormalizationService
 *
 * Pure function class for normalizing Argentine expediente (expediente) numbers
 * to a canonical format: `H11-02353-2-26` = [A-Z]\d{2}-\d{5}-\d-\d{2}.
 *
 * No Prisma dependency — safe to instantiate anywhere without DB access.
 *
 * Normalization pipeline (applied in order):
 *   1. Return input as-is for falsy values (null, undefined, empty string).
 *   2. trim() + toUpperCase() for matching.
 *   3. Match against an anchored regex that absorbs leading junk and
 *      flexible separators (- / . spaces) between groups.
 *   4. If the regex matches, rebuild into canonical form with a 5-digit
 *      zero-padded main number.
 *   5. If the regex does NOT match, return the ORIGINAL input string unchanged
 *      (never uppercased, never partially transformed).
 *
 * The regex requires at least one separator between the main number and check
 * digit, and between check digit and year. This prevents false positives on
 * ambiguous inputs missing the check digit (e.g. `H11-2052-26`), which would
 * otherwise backtrack-match as `H11-00205-2-26`.
 */
export class ExpedienteNormalizationService {
  /**
   * Canonical regex: [LETTER][prefixDigits]-[mainNum]-[checkDigit]-[year].
   *
   * Group layout:
   *   1 — prefix letter (H, A, …)
   *   2 — prefix digits (1–2, e.g. 11, 10)
   *   3 — main number (3–5 digits; padded to 5 on rebuild)
   *   4 — check digit (exactly 1)
   *   5 — year (exactly 2)
   *
   * Separators:
   *   - Before prefix digits: \s*-?\s*  (absorbs `H-11` style dash)
   *   - Before main number:   [\s\-/.]*  (allows zero separators, e.g. `H-111879`)
   *   - Before check digit:  [\s\-/.]+  (requires ≥1 — prevents ambiguous matches)
   *   - Before year:          [\s\-/.]+  (requires ≥1 — prevents ambiguous matches)
   *
   * Leading non-alphanumeric junk (`[^A-Z0-9]*`) is absorbed, e.g. `:H11-…`.
   */
  private static readonly CANONICAL_REGEX =
    /^[^A-Z0-9]*([A-Z])\s*-?\s*(\d{1,2})[\s\-/.]*(\d{3,5})[\s\-/.]+(\d)[\s\-/.]+(\d{2})$/;

  /**
   * Normalize an expediente string to canonical form.
   *
   * - null / undefined / '' / falsy → returned as-is (same type).
   * - Valid pattern → canonical `H11-02353-2-26` form (5-digit zero-padded).
   * - Invalid pattern → returned UNCHANGED (original input, not uppercased).
   *
   * Examples:
   *   'H11-02353-2/26'        → 'H11-02353-2-26'
   *   'H11-1712-1-26'          → 'H11-01712-1-26'
   *   'H11-796-5-25'           → 'H11-00796-5-25'
   *   'h11-01637-6-26'         → 'H11-01637-6-26'
   *   ':H11-02164-3-26'        → 'H11-02164-3-26'
   *   'H-11-1880-9-26'         → 'H11-01880-9-26'
   *   'H-111879-8-26'          → 'H11-01879-8-26'
   *   'H11- 00388-7-26'        → 'H11-00388-7-26'
   *   'A10-00067-6-26'          → 'A10-00067-6-26' (already canonical)
   *   'H11-2052-26'             → 'H11-2052-26' (ambiguous — unchanged)
   *   'H11-02066-5-2'           → 'H11-02066-5-2' (ambiguous — unchanged)
   *   'ACTUACION'              → 'ACTUACION' (unchanged)
   */
  normalize(input: string | null | undefined): string | null | undefined {
    if (!input) return input;

    const s = String(input).trim().toUpperCase();
    const match = s.match(ExpedienteNormalizationService.CANONICAL_REGEX);
    if (!match) return input;

    const [, letter, prefixDigits, mainNumber, checkDigit, year] = match;
    return `${letter}${prefixDigits}-${mainNumber.padStart(5, '0')}-${checkDigit}-${year}`;
  }
}
