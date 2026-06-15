import { Router } from 'express';
import { getLatest, query, getStats, sendControl, getAnomalies, getAlertHistory, getAlertStats, resolveAlert, getThresholds, updateThreshold } from '../controllers/sensor.controller';

const router = Router();
router.get('/latest', ...getLatest);
router.get('/query', ...query);
router.get('/stats', ...getStats);
router.get('/anomalies', ...getAnomalies);
router.post('/control', ...sendControl);

// 告警记录
router.get('/alerts', ...getAlertHistory);
router.get('/alerts/statistics', ...getAlertStats);
router.put('/alerts/:id/resolve', ...resolveAlert);

// 阈值配置
router.get('/thresholds', ...getThresholds);
router.put('/thresholds', ...updateThreshold);

export default router;
