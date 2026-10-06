export interface Employee {
  id: string;
  fullName: string;
  role?: string | null;
  phone?: string | null;
  monthlySalary?: string | null;
  isActive: boolean;
  birthdayDay?: number | null;
  birthdayMonth?: number | null;
  address?: string | null;
  qualification?: string | null;
  allergy?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RosterEntry {
  id: string;
  fullName: string;
  clockedInAt: string | null;
  clockedOutAt: string | null;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  workDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  employee: { fullName: string };
}

export type PayrollStatus = 'PENDING' | 'PAID';

export interface PayrollEntry {
  id: string;
  employeeId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amount: string;
  status: PayrollStatus;
  paidAt: string | null;
  notes?: string | null;
  employee: { fullName: string };
}

export interface CreateEmployeePayload {
  fullName: string;
  role?: string;
  phone?: string;
  monthlySalary?: number;
  birthdayDay?: number;
  birthdayMonth?: number;
  address?: string;
  qualification?: string;
  allergy?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload> & { isActive?: boolean };

export interface CreatePayrollEntryPayload {
  employeeId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  notes?: string;
}

export interface UpdatePayrollEntryPayload {
  amount?: number;
  status?: PayrollStatus;
  notes?: string;
}
