import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { generalApiLimiter } from '../middleware/rateLimit';
import * as importController from '../controllers/importController';

const router = Router();

/**
 * Multer configuration:
 *   - memoryStorage: file bytes land in req.file.buffer (no disk I/O)
 *   - fileSize: 10 MB hard cap
 *   - fileFilter: accepts .xlsx only (MIME type check)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  },
});

// POST /api/import — authenticate first (reject unauthenticated before parsing body)
router.post(
  '/',
  authenticate,
  generalApiLimiter,
  upload.single('file'),
  importController.uploadFile,
);

// GET /api/import/expedientes/:numero/versions
router.get(
  '/expedientes/:numero/versions',
  authenticate,
  importController.getExpedienteVersions,
);

// GET /api/import/person/:personId/table/:tableName/versions
router.get(
  '/person/:personId/table/:tableName/versions',
  authenticate,
  importController.getPersonVersions,
);

// GET /api/import/reportes-historico
router.get(
  '/reportes-historico',
  authenticate,
  generalApiLimiter,
  importController.getReportesHistorico,
);

// GET /api/import/tables/:tableName — read-only listing (ADMIN and USER)
router.get('/tables/:tableName', authenticate, importController.listTableRows);

export default router;
