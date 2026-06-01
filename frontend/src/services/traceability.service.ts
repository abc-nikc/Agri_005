import axios from 'axios';
import type { TraceabilityRecord } from '@/types/traceability';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const c = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });
c.interceptors.request.use(x => { const t = localStorage.getItem('access_token'); if (t) x.headers.Authorization = `Bearer ${t}`; return x; });

export const traceabilityService = {
  list: async (): Promise<TraceabilityRecord[]> => { const r = await c.get('/traceability'); return r.data.data; },
  generate: async (batchId: string): Promise<TraceabilityRecord> => { const r = await c.post('/traceability/generate', { batchId }); return r.data.data; },
  exportReport: async (traceCode: string): Promise<string> => { const r = await c.get(`/traceability/${traceCode}/export`); return r.data; },
  // Public endpoint (no auth)
  scan: async (code: string): Promise<any> => { const r = await axios.get(`${API}/trace/${code}`); return r.data.data; },
};
