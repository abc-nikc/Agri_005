export interface SensorData {
  id: string;
  plotId: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  recordedAt: string;
  equipmentId?: string;
}
