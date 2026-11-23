import type { StaffTaskStatus } from '../../data/store.ts';
import type { StaffRoleCode } from './staff.permissions.ts';

export interface StaffDashboardSummary {
  staff: {
    id: string;
    employeeNumber: string;
    fullName: string;
    role: string;
    department?: string;
    campus?: string;
  };

  statistics: {
    key: string;
    label: string;
    value: number | string;
    description?: string;
  }[];

  tasks: {
    id: string;
    title: string;
    description: string;
    dueAt?: string;
    status: StaffTaskStatus;
  }[];

  activities: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }[];
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface StaffProfileDto {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  officeLocation: string;
  bio: string;
  role: StaffRoleCode | 'UNCONFIGURED';
  roleTitle: string;
  department: string;
  campus: string;
  allowedCampuses: string[];
  restrictedFrom: string[];
  assignedUnits?: string[];
}
