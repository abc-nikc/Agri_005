export interface PlantingPlan {
  id: string;
  plotId: string;
  plotName: string;
  varietyId: string;
  varietyName: string;
  plannedSowDate: string;
  plannedHarvestDate: string;
  status: '待执行' | '执行中' | '已完成' | '已调整';
  solarTerm?: string;
  area: number;
  adjustReason?: string;
  adjustDate?: string;
  batchId?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlantingPlanFormData {
  plotId: string;
  plotName: string;
  varietyId: string;
  varietyName: string;
  plannedSowDate: string;
  plannedHarvestDate: string;
  area: number;
  remark?: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  plotId: string;
  plotName: string;
  varietyId: string;
  varietyName: string;
  sowDate: string;
  estimatedHarvestDate: string;
  status: '进行中' | '已完成';
  actualHarvestDate?: string;
  area: number;
  traceabilityCode?: string;
  planId?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionBatchFormData {
  plotId: string;
  varietyId: string;
  varietyName: string;
  sowDate: string;
  estimatedHarvestDate: string;
  area: number;
  planId?: string;
  remark?: string;
}
