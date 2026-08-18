import { normalizeMunicipio } from '../../src/utils/MunicipioNormalizer';

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
