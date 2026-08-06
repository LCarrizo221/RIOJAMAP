// NameNormalizationService unit tests
import { NameNormalizationService } from '../../src/services/import/NameNormalizationService';

describe('NameNormalizationService', () => {
  const service = new NameNormalizationService();

  it('normalizes names to uppercase ASCII without punctuation', () => {
    const input = 'Maza, Ángel- Eduardo';
    const normalized = service.normalize(input);
    expect(normalized).toBe('MAZA ANGEL EDUARDO');
  });

  it('compare returns true for equivalent names', () => {
    const a = 'Juan Pérez';
    const b = 'JUAN PEREZ';
    expect(service.compare(a, b)).toBe(true);
  });

  it('compare returns false for different names or falsy inputs', () => {
    expect(service.compare('Alice', 'Bob')).toBe(false);
    expect(service.compare('', 'Bob')).toBe(false);
    expect(service.compare(null, 'Bob')).toBe(false);
  });
});
