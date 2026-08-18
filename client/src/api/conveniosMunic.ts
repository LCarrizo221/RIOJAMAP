export interface Convenio {
  id: number;
  expediente: string;
  nombre: string | null;
  referente: string | null;
  municipio: string | null;
  detalle: string | null;
  monto_total: number;
  monto_parcial: number;
  saldo: number;
  fecha_carga: string | null;
  es_eventual: boolean;
  version: number;
  imported_from: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConveniosMunicResponse {
  convenios: Convenio[];
  count: number;
  montoTotal: number;
  montoParcial: number;
  saldo: number;
}

export async function getConveniosMunic(
  municipio: string,
  referente?: string,
): Promise<ConveniosMunicResponse> {
  const params = new URLSearchParams({ municipio });
  if (referente) params.set('referente', referente);

  const res = await fetch(`/api/convenios-munic?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch convenios: ${res.status}`);
  }
  return res.json();
}
