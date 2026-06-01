export type InventoryType = '农产品' | '农资';

export interface Inventory {
  id: string;
  type: InventoryType;
  name: string;
  spec?: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
  location?: string;
  qualityGrade?: string;
  qualityPassed?: boolean;
  expiryDate?: string;
  minStock: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  type: '入库' | '出库';
  subType: string;
  inventoryId: string;
  itemName: string;
  quantity: number;
  unit: string;
  operator: string;
  approver?: string;
  sourceOrDest?: string;
  plotId?: string;
  batchNumber?: string;
  transactionDate: string;
  remark?: string;
}

export interface Stocktake {
  id: string;
  type: string;
  executor: string;
  inventoryId: string;
  itemName: string;
  systemQuantity: number;
  actualQuantity: number;
  unit: string;
  discrepancy: number;
  discrepancyRate: number;
  result: string;
  remark?: string;
  createdAt: string;
}

export interface StockInForm {
  type: string;
  subType: string;
  name: string;
  spec?: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
  location?: string;
  qualityGrade?: string;
  qualityPassed?: boolean;
  expiryDate?: string;
  operator: string;
  sourceOrDest?: string;
  remark?: string;
}

export interface StockOutForm {
  inventoryId: string;
  subType: string;
  quantity: number;
  operator: string;
  approver?: string;
  sourceOrDest?: string;
  plotId?: string;
  remark?: string;
}

export interface StocktakeForm {
  type: string;
  executor: string;
  inventoryId: string;
  actualQuantity: number;
  remark?: string;
}
