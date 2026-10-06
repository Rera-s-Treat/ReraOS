import axiosInstance from './axios';
import {
  AttendanceRecord,
  CreateEmployeePayload,
  CreatePayrollEntryPayload,
  Employee,
  PayrollEntry,
  RosterEntry,
  UpdateEmployeePayload,
  UpdatePayrollEntryPayload,
} from '../types/staff';

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await axiosInstance.get('/staff/employees');
  return response.data;
};

export const createEmployee = async (payload: CreateEmployeePayload): Promise<Employee> => {
  const response = await axiosInstance.post('/staff/employees', payload);
  return response.data;
};

export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeePayload,
): Promise<Employee> => {
  const response = await axiosInstance.patch(`/staff/employees/${id}`, payload);
  return response.data;
};

export const getAttendanceRecords = async (employeeId?: string): Promise<AttendanceRecord[]> => {
  const response = await axiosInstance.get('/staff/attendance', {
    params: employeeId ? { employeeId } : undefined,
  });
  return response.data;
};

export const getPayrollEntries = async (employeeId?: string): Promise<PayrollEntry[]> => {
  const response = await axiosInstance.get('/staff/payroll', {
    params: employeeId ? { employeeId } : undefined,
  });
  return response.data;
};

export const createPayrollEntry = async (
  payload: CreatePayrollEntryPayload,
): Promise<PayrollEntry> => {
  const response = await axiosInstance.post('/staff/payroll', payload);
  return response.data;
};

export const updatePayrollEntry = async (
  id: string,
  payload: UpdatePayrollEntryPayload,
): Promise<PayrollEntry> => {
  const response = await axiosInstance.patch(`/staff/payroll/${id}`, payload);
  return response.data;
};

// Public check-in kiosk endpoints (no auth) ---------------------------------

export const getCheckinRoster = async (): Promise<RosterEntry[]> => {
  const response = await axiosInstance.get('/public/staff/roster');
  return response.data;
};

export const clockIn = async (employeeId: string) => {
  const response = await axiosInstance.post('/public/staff/clock-in', { employeeId });
  return response.data;
};

export const clockOut = async (employeeId: string) => {
  const response = await axiosInstance.post('/public/staff/clock-out', { employeeId });
  return response.data;
};
