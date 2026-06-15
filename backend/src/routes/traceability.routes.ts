import { Router } from 'express';
import { list, generate, exportReport } from '../controllers/traceability.controller';

const router = Router();
router.get('/', ...list);
router.post('/generate', ...generate);
router.get('/:code/export', ...exportReport);
export default router;
