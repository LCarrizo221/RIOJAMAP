export function extractMunicipio(referente: string | null | undefined): string | null {
  if (!referente) return null;

  const trimmed = referente.trim();
  if (trimmed === '') return null;

  const parts = trimmed.split(/\s*[-–]\s*/);
  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1].trim();
  return lastPart === '' ? null : lastPart;
}
