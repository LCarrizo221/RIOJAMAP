/**
 * Strip accents (NFD), lowercase, trim.
 */
export function normalizeMunicipio(input: string | null | undefined): string {
  if (input === null || input === undefined) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Canonical GeoJSON department names (18 departments in La Rioja).
 * Keys AND values are normalized (no accents, lowercase).
 */
const CANONICAL: Record<string, string> = {
  arauco: 'arauco',
  capital: 'capital',
  'castro barros': 'castro barros',
  chamical: 'chamical',
  chilecito: 'chilecito',
  'coronel felipe varela': 'coronel felipe varela',
  famatina: 'famatina',
  'general angel v. penaloza': 'general angel v. penaloza',
  'general belgrano': 'general belgrano',
  'general juan f. quiroga': 'general juan f. quiroga',
  'general lamadrid': 'general lamadrid',
  'general ocampo': 'general ocampo',
  'general san martin': 'general san martin',
  independencia: 'independencia',
  'rosario vera penaloza': 'rosario vera penaloza',
  'san blas de los sauces': 'san blas de los sauces',
  sanagasta: 'sanagasta',
  vinchina: 'vinchina',
};

/**
 * Translation map: normalized DB/abbreviated variants → canonical name.
 * ALL keys and values are normalized (no accents, lowercase).
 * Covers all known abbreviations, tilde variants, and name differences
 * found in ConveniosMunic, Intendentes026, and other Type1 imports.
 */
const ALIAS_TO_CANONICAL: Record<string, string> = {
  // General abbreviations
  'gral. belgrano': 'general belgrano',
  'gral belgrano': 'general belgrano',
  'cnel. felipe varela': 'coronel felipe varela',
  'cnel felipe varela': 'coronel felipe varela',
  'general angel vicente penaloza': 'general angel v. penaloza',
  'angel vicente penaloza': 'general angel v. penaloza',
  'angel v. penaloza': 'general angel v. penaloza',
  'facundo quiroga': 'general juan f. quiroga',
  'general facundo quiroga': 'general juan f. quiroga',
  'juan f. quiroga': 'general juan f. quiroga',
  'juan f quiroga': 'general juan f. quiroga',
  'rosario vera penaloza': 'rosario vera penaloza',
  // Sanagasta variants
  'sanagasta (actual)': 'sanagasta',
  'sanagasta actual': 'sanagasta',
};

/**
 * Given any municipio variant (DB value, user input, GeoJSON name),
 * returns the canonical normalized department name (no accents, lowercase).
 *
 * Returns empty string for unknown input.
 */
export function canonicalMunicipio(input: string | null | undefined): string {
  const norm = normalizeMunicipio(input);
  if (!norm) return '';
  if (ALIAS_TO_CANONICAL[norm]) return ALIAS_TO_CANONICAL[norm];
  if (CANONICAL[norm]) return norm;
  return '';
}

/**
 * Returns the canonical GeoJSON name for a department,
 * or the original input if not found (for display fallback).
 */
export function displayMunicipio(input: string | null | undefined): string {
  const canon = canonicalMunicipio(input);
  return canon || normalizeMunicipio(input);
}

/**
 * All 18 canonical department names in La Rioja (lowercase).
 */
export const LA_RIOJA_DEPARTAMENTOS: string[] = Object.values(CANONICAL);

/**
 * Returns all normalized variants (including the canonical name itself)
 * that map to the given canonical municipio.
 * Used by API routes to build IN (...) clauses for matching.
 */
export function getVariantsForCanonical(canonicalInput: string): string[] {
  const canon = canonicalMunicipio(canonicalInput);
  if (!canon) return [];
  const variants = [canon];
  for (const [alias, target] of Object.entries(ALIAS_TO_CANONICAL)) {
    const normCanon = normalizeMunicipio(target);
    if (normCanon === canon) {
      const normAlias = normalizeMunicipio(alias);
      if (!variants.includes(normAlias)) {
        variants.push(normAlias);
      }
    }
  }
  return variants;
}
