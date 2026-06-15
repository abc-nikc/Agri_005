import { Router } from 'express';
import { getBatches, getBatchById, createBatch, completeBatch, deleteBatch, splitBatchByQuality } from '../controllers/production-batch.controller';

const router = Router();
router.get('/', ...getBatches);
router.get('/:id', ...getBatchById);
router.post('/', ...createBatch);
router.post('/:id/split', ...splitBatchByQuality);
router.put('/:id/complete', ...completeBatch);
router.delete('/:id', ...deleteBatch);
export default router;
