import type { CostRecord, SalesRecord, CostAnalysis, ProfitAnalysis, YieldPrediction, BatchCompareResult, SummaryReport } from '@/types/cost';
import { apiClient as c } from './api-client';

export const costService = {
  // 成本
  addCost: async (d: Partial<CostRecord>): Promise<CostRecord> => { const r = await c.post('/costs/costs', d); return r.data.data; },
  getCosts: async (p?: any): Promise<CostRecord[]> => { const r = await c.get('/costs/costs', { params: p }); return r.data.data; },
  // 销售
  addSale: async (d: Partial<SalesRecord>): Promise<SalesRecord> => { const r = await c.post('/costs/sales', d); return r.data.data; },
  getSales: async (p?: any): Promise<SalesRecord[]> => { const r = await c.get('/costs/sales', { params: p }); return r.data.data; },
  // 分析
  costByPlot: async (id: string): Promise<CostAnalysis> => { const r = await c.get(`/costs/plot/${id}`); return r.data.data; },
  costByBatch: async (id: string): Promise<CostAnalysis> => { const r = await c.get(`/costs/batch/${id}`); return r.data.data; },
  unitCost: async (id: string) => { const r = await c.get(`/costs/unit/${id}`); return r.data.data; },
  profitAnalysis: async (p?: any): Promise<ProfitAnalysis> => { const r = await c.get('/costs/profit', { params: p }); return r.data.data; },
  yieldPredict: async (v: string): Promise<YieldPrediction> => { const r = await c.get(`/costs/yield/${encodeURIComponent(v)}`); return r.data.data; },
  batchCompare: async (v: string): Promise<BatchCompareResult> => { const r = await c.get(`/costs/compare/${encodeURIComponent(v)}`); return r.data.data; },
  generateReport: async (p?: any): Promise<SummaryReport> => { const r = await c.get('/costs/report', { params: p }); return r.data.data; },
};
