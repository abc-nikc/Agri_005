import type { Inventory, StockTransaction, Stocktake, StockInForm, StockOutForm, StocktakeForm } from '@/types/inventory';
import { apiClient as c } from './api-client';

export const inventoryService = {
  getAll: async (p?: any): Promise<Inventory[]> => { const r = await c.get('/inventory', { params: p }); return r.data.data; },
  getAlerts: async (): Promise<{ lowStock: Inventory[]; expiring: Inventory[] }> => { const r = await c.get('/inventory/alerts'); return r.data.data; },
  stockIn: async (d: StockInForm): Promise<Inventory> => { const r = await c.post('/inventory/in', d); return r.data.data; },
  stockOut: async (d: StockOutForm): Promise<Inventory> => { const r = await c.post('/inventory/out', d); return r.data.data; },
  getTransactions: async (p?: any): Promise<StockTransaction[]> => { const r = await c.get('/inventory/transactions', { params: p }); return r.data.data; },
  stocktake: async (d: StocktakeForm): Promise<Stocktake> => { const r = await c.post('/inventory/stocktake', d); return r.data.data; },
  getStocktakes: async (p?: any): Promise<Stocktake[]> => { const r = await c.get('/inventory/stocktakes', { params: p }); return r.data.data; },
};
