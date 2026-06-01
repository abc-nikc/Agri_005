export interface Staff {
  id: string;
  name: string;
  username: string;
  systemRole: string;
  businessDivision?: string;
  totalWorkHours: number;
  contactPhone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffFormData {
  name: string;
  username: string;
  password?: string;
  systemRole: string;
  businessDivision?: string;
  contactPhone?: string;
}

export type CreateStaffDto = Omit<StaffFormData, 'password'> & { password?: string };
export type UpdateStaffDto = Partial<StaffFormData>;

export interface StaffQueryParams {
  name?: string;
  systemRole?: string;
  businessDivision?: string;
  isActive?: boolean;
}
