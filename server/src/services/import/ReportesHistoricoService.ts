/**
 * ReportesHistoricoService
 *
 * Immutable audit logger for the import pipeline.
 *
 * CONTRACT: log() NEVER throws, NEVER rejects.
 * A failed audit entry must not abort or roll back an in-progress import.
 * Errors are surfaced to console.error for operator visibility.
 *
 * Usage:
 *   await historicoService.log({ ... });  // fire-and-forget safe
 */

import { PrismaClient } from '@prisma/client';
import type { ReportesHistoricoEntry } from './types.js';

export class ReportesHistoricoService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Persists one audit entry to ReportesHistorico.
   * All errors are caught and logged to console.error — never rethrown.
   */
  async log(entry: ReportesHistoricoEntry): Promise<void> {
    try {
      await this.prisma.reportesHistorico.create({
        data: {
          fecha_importacion: entry.fecha_importacion,
          expediente:            entry.expediente       ?? null,
          nombre:                entry.nombre           ?? null,
          referente:             entry.referente        ?? null,
          monto_total:           entry.monto_total,
          monto_parcial:         entry.monto_parcial,
          saldo:                 entry.saldo,
          import_source_file:    entry.import_source_file    ?? null,
          matched_table_type:    entry.matched_table_type    ?? null,
          matched_table_name:    entry.matched_table_name    ?? null,
          matched_by_expediente: entry.matched_by_expediente,
          matched_by_name:       entry.matched_by_name,
          version_created:       entry.version_created       ?? null,
          warnings:              entry.warnings              ?? null,
        },
      });
    } catch (err) {
      // Audit failure must never abort the import — log and continue.
      console.error('[ReportesHistoricoService] Failed to write audit entry:', err);
    }
  }
}
