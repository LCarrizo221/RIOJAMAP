import { extractMunicipio } from '../../src/utils/ReferenteParser';

describe('extractMunicipio', () => {
  it('parses hyphen-separated referente', () => {
    expect(extractMunicipio('INT. ARMANDO MOLINA - Capital')).toBe('Capital');
  });

  it('parses em-dash separated referente', () => {
    expect(extractMunicipio('INT. HUGO PAEZ – Cnel. Felipe Varela')).toBe('Cnel. Felipe Varela');
  });

  it('takes the last segment with multiple hyphens', () => {
    expect(extractMunicipio('A - B - C')).toBe('C');
  });

  it('returns null for no separator', () => {
    expect(extractMunicipio('SIN SEPARADOR')).toBeNull();
  });

  it('returns null for null', () => {
    expect(extractMunicipio(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(extractMunicipio(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractMunicipio('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(extractMunicipio('   ')).toBeNull();
  });

  it('returns null when last segment is empty', () => {
    expect(extractMunicipio('A - ')).toBeNull();
  });

  it('handles extra whitespace around hyphen', () => {
    expect(extractMunicipio('INT. ARMANDO MOLINA   -   Capital')).toBe('Capital');
  });
});
