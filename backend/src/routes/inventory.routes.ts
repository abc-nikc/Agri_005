import { Router } from 'express';
import { getInventory, getAlerts, stockIn, stockOut, getTransactions, stocktake, getStocktakes } from '../controllers/inventory.controller';

const router = Router();
router.get('/alerts', ...getAlerts);
router.get('/transactions', ...getTransactions);
router.get('/stocktakes', ...getStocktakes);
router.get('/', ...getInventory);
router.post('/in', ...stockIn);
router.post('/out', ...stockOut);
router.post('/stocktake', ...stocktake);
export default router;
