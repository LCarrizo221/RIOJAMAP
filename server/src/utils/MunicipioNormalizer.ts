export function normalizeMunicipio(input: string | null | undefined): string {
  if (input === null || input === undefined) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
