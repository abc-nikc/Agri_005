import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Inventory, StockTransaction, Stocktake, StockInForm, StockOutForm, StocktakeForm } from '@/types/inventory';
import { inventoryService } from '@/services/inventory.service';

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<Inventory[]>([]);
  const transactions = ref<StockTransaction[]>([]);
  const stocktakes = ref<Stocktake[]>([]);
  const alerts = ref<{ lowStock: Inventory[]; expiring: Inventory[] }>({ lowStock: [], expiring: [] });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(p?: any) { l(); try { items.value = await inventoryService.getAll(p); } catch (e: any) { error.value = e.response?.data?.error; } finally { lf(); } }
  async function fetchAlerts() { try { alerts.value = await inventoryService.getAlerts(); } catch { /* ignore */ } }
  async function doStockIn(d: StockInForm) { l(); try { const r = await inventoryService.stockIn(d); const i = items.value.findIndex(x => x.id === r.id); if (i >= 0) items.value[i] = r; else items.value.unshift(r); return r; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { lf(); } }
  async function doStockOut(d: StockOutForm) { l(); try { const r = await inventoryService.stockOut(d); const i = items.value.findIndex(x => x.id === d.inventoryId); if (i >= 0) items.value[i] = r; return r; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { lf(); } }
  async function fetchTransactions(p?: any) { l(); try { transactions.value = await inventoryService.getTransactions(p); } catch (e: any) { error.value = e.response?.data?.error; } finally { lf(); } }
  async function doStocktake(d: StocktakeForm) { l(); try { const r = await inventoryService.stocktake(d); stocktakes.value.unshift(r); return r; } catch (e: any) { error.value = e.response?.data?.error; throw e; } finally { lf(); } }
  async function fetchStocktakes(p?: any) { l(); try { stocktakes.value = await inventoryService.getStocktakes(p); } catch (e: any) { error.value = e.response?.data?.error; } finally { lf(); } }
  function clearError() { error.value = null; }
  function l() { loading.value = true; error.value = null; }
  function lf() { loading.value = false; }

  return { items, transactions, stocktakes, alerts, loading, error, fetchAll, fetchAlerts, doStockIn, doStockOut, fetchTransactions, doStocktake, fetchStocktakes, clearError };
});
