import { Router } from 'express';
import { getBatches, getBatchById, createBatch, completeBatch, inspectBatchQuality, deleteBatch, splitBatchByQuality } from '../controllers/production-batch.controller';

const router = Router();
router.get('/', ...getBatches);
router.get('/:id', ...getBatchById);
router.post('/', ...createBatch);
router.post('/:id/split', ...splitBatchByQuality);
router.put('/:id/complete', ...completeBatch);
router.put('/:id/quality-inspection', ...inspectBatchQuality);
router.delete('/:id', ...deleteBatch);
export default router;
