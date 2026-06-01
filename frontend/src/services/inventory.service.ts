import axios from 'axios';
import type { Inventory, StockTransaction, Stocktake, StockInForm, StockOutForm, StocktakeForm } from '@/types/inventory';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const c = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });
c.interceptors.request.use(x => { const t = localStorage.getItem('access_token'); if (t) x.headers.Authorization = `Bearer ${t}`; return x; });

export const inventoryService = {
  getAll: async (p?: any): Promise<Inventory[]> => { const r = await c.get('/inventory', { params: p }); return r.data.data; },
  getAlerts: async (): Promise<{ lowStock: Inventory[]; expiring: Inventory[] }> => { const r = await c.get('/inventory/alerts'); return r.data.data; },
  stockIn: async (d: StockInForm): Promise<Inventory> => { const r = await c.post('/inventory/in', d); return r.data.data; },
  stockOut: async (d: StockOutForm): Promise<Inventory> => { const r = await c.post('/inventory/out', d); return r.data.data; },
  getTransactions: async (p?: any): Promise<StockTransaction[]> => { const r = await c.get('/inventory/transactions', { params: p }); return r.data.data; },
  stocktake: async (d: StocktakeForm): Promise<Stocktake> => { const r = await c.post('/inventory/stocktake', d); return r.data.data; },
  getStocktakes: async (p?: any): Promise<Stocktake[]> => { const r = await c.get('/inventory/stocktakes', { params: p }); return r.data.data; },
};
