export type OperationType = '播种' | '移栽' | '施肥' | '打药' | '灌溉' | '排水' | '除草' | '整枝' | '采收';

export interface FarmingOperation {
  id: string;
  operationType: OperationType;
  plotId: string;
  plotName?: string;
  varietyId?: string;
  varietyName?: string;
  batchId?: string;
  area?: number;
  fertilizerName?: string;
  fertilizerAmount?: number;
  fertilizerUnit?: string;
  pesticideName?: string;
  pesticideAmount?: number;
  pesticideUnit?: string;
  waterAmount?: number;
  waterUnit?: string;
  waterDuration?: number;
  waterDurationUnit?: string;
  workDescription?: string;
  harvestYield?: number;
  yieldUnit?: string;
  qualityGrade?: string;
  harvestDestination?: string;
  operatorName: string;
  operationDate: string;
  weather?: string;
  temperature?: number;
  remark?: string;
  cropStage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmingOperationFormData {
  operationType: OperationType;
  plotId: string;
  varietyId?: string;
  batchId?: string;
  area?: number;
  fertilizerName?: string;
  fertilizerAmount?: number;
  fertilizerUnit?: string;
  pesticideName?: string;
  pesticideAmount?: number;
  pesticideUnit?: string;
  waterAmount?: number;
  waterUnit?: string;
  waterDuration?: number;
  waterDurationUnit?: string;
  workDescription?: string;
  harvestYield?: number;
  yieldUnit?: string;
  qualityGrade?: string;
  harvestDestination?: string;
  operatorName: string;
  operationDate: string;
  weather?: string;
  temperature?: number;
  remark?: string;
  cropStage?: string;
}

export type CreateOperationDto = FarmingOperationFormData;
export type UpdateOperationDto = Partial<FarmingOperationFormData>;
