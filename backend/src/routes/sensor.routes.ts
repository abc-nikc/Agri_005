import { Router } from 'express';
import { getLatest, query, getStats, sendControl, getAnomalies } from '../controllers/sensor.controller';

const router = Router();
router.get('/latest', ...getLatest);
router.get('/query', ...query);
router.get('/stats', ...getStats);
router.get('/anomalies', ...getAnomalies);
router.post('/control', ...sendControl);
export default router;
