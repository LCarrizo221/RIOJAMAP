// ExpedienteNormalizationService unit tests
import { ExpedienteNormalizationService } from '../../src/services/import/ExpedienteNormalizationService';

describe('ExpedienteNormalizationService', () => {
  const service = new ExpedienteNormalizationService();

  // ── Falsy inputs ────────────────────────────────────────────────────────────

  it('returns null for null', () => {
    expect(service.normalize(null)).toBeNull();
  });

  it('returns undefined for undefined', () => {
    expect(service.normalize(undefined)).toBeUndefined();
  });

  it('returns empty string for empty string', () => {
    expect(service.normalize('')).toBe('');
  });

  // ── Canonicalization cases (non-canonical → canonical) ──────────────────────

  it.each([
    ['H11-02353-2/26',  'H11-02353-2-26'],
    ['H11-1712-1-26',   'H11-01712-1-26'],
    ['H11-796-5-25',    'H11-00796-5-25'],
    ['h11-01637-6-26',  'H11-01637-6-26'],
    [':H11-02164-3-26','H11-02164-3-26'],
    ['H-11-1880-9-26',  'H11-01880-9-26'],
    ['H-111879-8-26',   'H11-01879-8-26'],
    ['H11- 00388-7-26','H11-00388-7-26'],
  ])('normalizes %p → %p', (input, expected) => {
    expect(service.normalize(input)).toBe(expected);
  });

  // ── Already canonical (unchanged) ───────────────────────────────────────────

  it('leaves already-canonical expedientes unchanged', () => {
    expect(service.normalize('A10-00067-6-26')).toBe('A10-00067-6-26');
    expect(service.normalize('H11-02353-2-26')).toBe('H11-02353-2-26');
  });

  // ── Ambiguous inputs (must NOT be normalized — never invent digits) ──────────

  it.each([
    'H11-2052-26',    // missing check digit
    'H11-02066-5-2',  // year truncated to 1 digit
  ])('leaves ambiguous expediente %p unchanged', (input) => {
    expect(service.normalize(input)).toBe(input);
  });

  // ── Non-expediente strings (must pass through unchanged) ───────────────────

  it.each([
    'ACTUACION',
    'ACTUACIÓN',
    'CR. DANTE HERRERA',
    'VALES COMBUSTIBLE',
    'FONDO ROTATORIO',
    'MISAEL - TRANS- A RECUPERAR',
    'NAME-CONSULTORIA-RAD-REGISTRO-ARTESANAL-DIGITAL|3300000|0|3300000',
  ])('leaves non-expediente string %p unchanged', (input) => {
    expect(service.normalize(input)).toBe(input);
  });
});
