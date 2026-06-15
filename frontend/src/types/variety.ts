export interface Variety {
  id: string;
  name: string;
  category: string;
  sowingSeason?: string[];
  plantingDensity?: number;
  fertilizationRate?: number;
  wateringFrequency?: number;
  growthCycle?: number;
  safetyInterval?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VarietyFormData {
  name: string;
  category: string;
  sowingSeason?: string[];
  plantingDensity?: number;
  fertilizationRate?: number;
  wateringFrequency?: number;
  growthCycle?: number;
  safetyInterval?: number;
}

export type CreateVarietyDto = VarietyFormData;
export type UpdateVarietyDto = Partial<VarietyFormData>;

export interface VarietyQueryParams {
  name?: string;
  category?: string;
  isActive?: boolean;
}
