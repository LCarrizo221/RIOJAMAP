import { normalizeMunicipio, canonicalMunicipio, getVariantsForCanonical } from '../../src/utils/MunicipioNormalizer';

describe('normalizeMunicipio', () => {
  it('lowercases accented uppercase: "CAPITAL" → "capital"', () => {
    expect(normalizeMunicipio('CAPITAL')).toBe('capital');
  });

  it('strips accents and lowercases: "CÓRDOBA" → "cordoba"', () => {
    expect(normalizeMunicipio('CÓRDOBA')).toBe('cordoba');
  });

  it('trims whitespace and lowercases: "  Chamical  " → "chamical"', () => {
    expect(normalizeMunicipio('  Chamical  ')).toBe('chamical');
  });

  it('returns "" for null', () => {
    expect(normalizeMunicipio(null)).toBe('');
  });

  it('returns "" for undefined', () => {
    expect(normalizeMunicipio(undefined)).toBe('');
  });

  it('returns "" for empty string', () => {
    expect(normalizeMunicipio('')).toBe('');
  });

  it('is idempotent', () => {
    const input = '  CÓRDOBA  ';
    expect(normalizeMunicipio(normalizeMunicipio(input))).toBe(normalizeMunicipio(input));
  });

  it('handles mixed case with diacritics', () => {
    expect(normalizeMunicipio('ViLLa UnIon')).toBe('villa union');
  });
});

describe('canonicalMunicipio', () => {
  it('returns canonical name for exact match', () => {
    expect(canonicalMunicipio('capital')).toBe('capital');
  });

  it('resolves "angel vicente peñaloza" → "general angel v. penaloza"', () => {
    expect(canonicalMunicipio('angel vicente peñaloza')).toBe('general angel v. penaloza');
  });

  it('resolves "gral. belgrano" → "general belgrano"', () => {
    expect(canonicalMunicipio('gral. belgrano')).toBe('general belgrano');
  });

  it('resolves "cnel. felipe varela" → "coronel felipe varela"', () => {
    expect(canonicalMunicipio('cnel. felipe varela')).toBe('coronel felipe varela');
  });

  it('resolves "facundo quiroga" → "general juan f. quiroga"', () => {
    expect(canonicalMunicipio('facundo quiroga')).toBe('general juan f. quiroga');
  });

  it('resolves "sanagasta (actual)" → "sanagasta"', () => {
    expect(canonicalMunicipio('sanagasta (actual)')).toBe('sanagasta');
  });

  it('resolves accented variant "ROSARIO VERA PEÑALOZA" → "rosario vera penaloza"', () => {
    expect(canonicalMunicipio('ROSARIO VERA PEÑALOZA')).toBe('rosario vera penaloza');
  });

  it('returns "" for unknown input', () => {
    expect(canonicalMunicipio('desconocido')).toBe('');
  });

  it('returns "" for null/undefined', () => {
    expect(canonicalMunicipio(null)).toBe('');
    expect(canonicalMunicipio(undefined)).toBe('');
  });
});

describe('getVariantsForCanonical', () => {
  it('returns canonical + alias variants for "general angel v. penaloza"', () => {
    const variants = getVariantsForCanonical('general angel v. penaloza');
    expect(variants).toContain('general angel v. penaloza');
    expect(variants).toContain('angel vicente penaloza');
  });

  it('returns just the canonical for "capital" (no aliases)', () => {
    const variants = getVariantsForCanonical('capital');
    expect(variants).toEqual(['capital']);
  });

  it('returns empty array for unknown', () => {
    expect(getVariantsForCanonical('desconocido')).toEqual([]);
  });

  it('handles case-insensitive input', () => {
    const variants = getVariantsForCanonical('GRAL. BELGRANO');
    expect(variants).toContain('gral. belgrano');
    expect(variants).toContain('general belgrano');
  });
});
