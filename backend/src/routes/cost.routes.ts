import { Router } from 'express';
import { addCost, getCosts, addSale, getSales, costByPlot, costByBatch, unitCost, profitAnalysis, yieldPredict, batchCompare, generateReport } from '../controllers/cost.controller';

const router = Router();
router.post('/costs', ...addCost);
router.get('/costs', ...getCosts);
router.post('/sales', ...addSale);
router.get('/sales', ...getSales);
router.get('/plot/:id', ...costByPlot);
router.get('/batch/:id', ...costByBatch);
router.get('/unit/:id', ...unitCost);
router.get('/profit', ...profitAnalysis);
router.get('/yield/:variety', ...yieldPredict);
router.get('/compare/:variety', ...batchCompare);
router.get('/report', ...generateReport);
export default router;
