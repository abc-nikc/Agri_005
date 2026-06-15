export interface Plot {
  id: string;
  plotNumber: string;
  area: number;
  soilType?: string;
  region: string;
  status: string;
  currentVarietyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlotFormData {
  plotNumber: string;
  area: number;
  soilType?: string;
  region: string;
  status?: string;
}
