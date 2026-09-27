export interface Equipment {
  id: string;
  equipmentNumber: string;
  type: string;
  status: string;
  associatedPlotId?: string;
  associatedPlotNumber?: string;
  nextMaintenanceDate?: string;
  mqttTopic?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentFormData {
  equipmentNumber: string;
  type: string;
  status: string;
  associatedPlotId?: string;
  nextMaintenanceDate?: string;
  mqttTopic?: string;
}

export type CreateEquipmentDto = EquipmentFormData;
export type UpdateEquipmentDto = Partial<EquipmentFormData>;

export interface EquipmentQueryParams {
  type?: string;
  status?: string;
}
