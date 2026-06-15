export interface TraceabilityRecord {
  id: string;
  traceCode: string;
  batchId: string;
  batchNumber: string;
  plotName: string;
  varietyName: string;
  sowDate: string;
  harvestDate?: string;
  area: number;
  operationsData?: any[];
  inputsData?: any[];
  inventoryData?: any[];
  salesData?: any[];
  qrCodeUrl?: string;
  exportedAt?: string;
  exportedBy?: string;
  createdAt: string;
}
