import { apiClient } from './api-client';

export interface DashboardMetrics {
  totalArea: number; plantedArea: number; idleArea: number;
  varietyCount: number; staffCount: number; plotCount: number;
  activeStaffCount: number; equipmentCount: number; batchCount: number;
}

export interface DistributionItem {
  status?: string; category?: string; count: number; area?: number;
}

export interface Activity {
  id: string; action: string; user: string; timestamp: string; source?: string;
}

export interface EquipmentItem {
  id: string; equipmentNumber: string; type: string; status: string;
  associatedPlotId?: string; nextMaintenanceDate?: string; mqttTopic?: string;
  associatedPlotNumber?: string;
}

export interface PlotItem {
  id: string; plotNumber: string; area: number; status: string;
  currentVarietyId?: string; soilType?: string; region?: string;
  currentVarietyName?: string;
}

export interface BatchItem {
  id: string; batchNumber: string; status: string;
  varietyName?: string; plotNumber?: string;
  plannedStartDate?: string; plannedEndDate?: string;
  actualStartDate?: string; actualEndDate?: string;
  area?: number;
}

export interface OperationItem {
  id: string; operationType: string; plotName?: string; varietyName?: string;
  operatorName?: string; operationDate: string;
}

// ===== 原有接口 =====
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const r = await apiClient.get('/dashboard/metrics');
  return r.data.data;
};

export const getPlotStatusDistribution = async (): Promise<DistributionItem[]> => {
  const r = await apiClient.get('/dashboard/plot-status');
  return r.data.data;
};

export const getVarietyCategoryDistribution = async (): Promise<DistributionItem[]> => {
  const r = await apiClient.get('/dashboard/variety-categories');
  return r.data.data;
};

export const getRecentActivities = async (limit = 10): Promise<Activity[]> => {
  const r = await apiClient.get('/dashboard/recent-activities', { params: { limit } });
  return r.data.data;
};

export const getOperationTrends = async (): Promise<{ dates: string[]; counts: number[] }> => {
  const r = await apiClient.get('/dashboard/trends');
  return r.data.data;
};

// ===== 新增接口 =====
export const getAllPlots = async (): Promise<PlotItem[]> => {
  const r = await apiClient.get('/plots');
  return r.data.data || [];
};

export const getAllEquipment = async (): Promise<EquipmentItem[]> => {
  const r = await apiClient.get('/equipment');
  return r.data.data || [];
};

export const getMaintenanceAlerts = async (): Promise<EquipmentItem[]> => {
  const r = await apiClient.get('/equipment/maintenance-alerts');
  return r.data.data || [];
};

export const getAllBatches = async (): Promise<BatchItem[]> => {
  const r = await apiClient.get('/production-batches');
  return r.data.data || [];
};

export const getAllOperations = async (): Promise<OperationItem[]> => {
  const r = await apiClient.get('/farming-operations');
  return r.data.data || [];
};

export const getStaffStats = async (): Promise<{ totalStaff: number; activeStaff: number; byRole: { role: string; count: number }[] }> => {
  const r = await apiClient.get('/staff/statistics');
  return r.data.data;
};

export const getNotifications = async (): Promise<any[]> => {
  try {
    const r = await apiClient.get('/notifications');
    return r.data.data || [];
  } catch { return []; }
};

export const getInventoryList = async (): Promise<any[]> => {
  try {
    const r = await apiClient.get('/inventory');
    return r.data.data || [];
  } catch { return []; }
};
