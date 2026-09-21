'use client';

import React, { useEffect, useState } from 'react';

import { EmployeeFormModal } from '@/components/staff/EmployeeFormModal';
import {
  createPayrollEntry,
  getAttendanceRecords,
  getEmployees,
  getPayrollEntries,
  updateEmployee,
  updatePayrollEntry,
} from '@/services/staff.services';
import {
  AttendanceRecord,
  Employee,
  PayrollEntry,
  PayrollStatus,
} from '@/types/staff';

type Tab = 'employees' | 'attendance' | 'payroll';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `₦${Number(value).toLocaleString()}`;
}

function formatBirthday(day?: number | null, month?: number | null): string {
  if (!day || !month) return '—';
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [emp, att, pay] = await Promise.all([
        getEmployees(),
        getAttendanceRecords(),
        getPayrollEntries(),
      ]);
      setEmployees(emp);
      setAttendance(att);
      setPayroll(pay);
    } catch (err) {
      setError('Failed to load staff data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div style={pageStyle}>
      <div style={checkinLinkBoxStyle}>
        Staff clock in/out at:{' '}
        <a href="/admin/checkin" target="_blank" rel="noreferrer" style={{ color: '#E8621A' }}>
          rerastreat.com.ng/admin/checkin
        </a>{' '}
        — bookmark this on a shared device.
      </div>

      <div style={tabRowStyle}>
        {(['employees', 'attendance', 'payroll'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tab === t ? tabBtnActiveStyle : tabBtnStyle}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: '#888' }}>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && !error && tab === 'employees' && (
        <EmployeesTab employees={employees} onChanged={fetchAll} />
      )}
      {!isLoading && !error && tab === 'attendance' && <AttendanceTab records={attendance} />}
      {!isLoading && !error && tab === 'payroll' && (
        <PayrollTab entries={payroll} employees={employees} onChanged={fetchAll} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------

function EmployeesTab({
  employees,
  onChanged,
}: {
  employees: Employee[];
  onChanged: () => void;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const openAddForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const toggleActive = async (employee: Employee) => {
    await updateEmployee(employee.id, { isActive: !employee.isActive });
    onChanged();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={sectionTitleStyle}>Employees</h2>
        <button onClick={openAddForm} style={secondaryBtnStyle}>
          + Add Employee
        </button>
      </div>

      <EmployeeFormModal
        isOpen={isFormOpen}
        employee={editingEmployee}
        onClose={() => setIsFormOpen(false)}
        onSaved={onChanged}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Birthday</th>
              <th style={thStyle}>Monthly Salary</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td style={tdStyle}>{emp.fullName}</td>
                <td style={tdStyle}>{emp.role || '—'}</td>
                <td style={tdStyle}>{emp.phone || '—'}</td>
                <td style={tdStyle}>{formatBirthday(emp.birthdayDay, emp.birthdayMonth)}</td>
                <td style={tdStyle}>{formatMoney(emp.monthlySalary)}</td>
                <td style={tdStyle}>{emp.isActive ? 'Active' : 'Inactive'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => openEditForm(emp)} style={linkBtnStyle}>
                      Edit
                    </button>
                    <button onClick={() => toggleActive(emp)} style={linkBtnStyle}>
                      {emp.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={7}>
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------

function AttendanceTab({ records }: { records: AttendanceRecord[] }) {
  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>Attendance (most recent 200)</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Employee</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Clock In</th>
              <th style={thStyle}>Clock Out</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}>{r.employee.fullName}</td>
                <td style={tdStyle}>{formatDate(r.workDate)}</td>
                <td style={tdStyle}>{formatTime(r.clockInAt)}</td>
                <td style={tdStyle}>{formatTime(r.clockOutAt)}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={4}>
                  No attendance recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------

function PayrollTab({
  entries,
  employees,
  onChanged,
}: {
  entries: PayrollEntry[];
  employees: Employee[];
  onChanged: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEmployeeSelect = (id: string) => {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp?.monthlySalary) setAmount(String(emp.monthlySalary));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !periodLabel.trim() || !periodStart || !periodEnd || !amount.trim()) {
      setError('All fields except notes are required');
      return;
    }
    try {
      setIsSaving(true);
      setError('');
      await createPayrollEntry({
        employeeId,
        periodLabel: periodLabel.trim(),
        periodStart,
        periodEnd,
        amount: Number(amount),
      });
      setEmployeeId('');
      setPeriodLabel('');
      setPeriodStart('');
      setPeriodEnd('');
      setAmount('');
      setIsAdding(false);
      onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to record payroll entry');
    } finally {
      setIsSaving(false);
    }
  };

  const markPaid = async (entry: PayrollEntry) => {
    await updatePayrollEntry(entry.id, { status: 'PAID' as PayrollStatus });
    onChanged();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={sectionTitleStyle}>Payroll</h2>
        <button onClick={() => setIsAdding((v) => !v)} style={secondaryBtnStyle}>
          {isAdding ? 'Cancel' : '+ Record Payroll Entry'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} style={addFormStyle}>
          <select
            value={employeeId}
            onChange={(e) => handleEmployeeSelect(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
          <input
            placeholder="Period label (e.g. September 2026)"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            style={inputStyle}
          />
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            style={inputStyle}
          />
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" disabled={isSaving} style={submitBtnStyle}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          {error && <p style={{ color: 'red', fontSize: 13, width: '100%' }}>{error}</p>}
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Employee</th>
              <th style={thStyle}>Period</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td style={tdStyle}>{entry.employee.fullName}</td>
                <td style={tdStyle}>{entry.periodLabel}</td>
                <td style={tdStyle}>{formatMoney(entry.amount)}</td>
                <td style={tdStyle}>{entry.status}</td>
                <td style={tdStyle}>
                  {entry.status !== 'PAID' && (
                    <button onClick={() => markPaid(entry)} style={linkBtnStyle}>
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={5}>
                  No payroll entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: 24 };

const checkinLinkBoxStyle: React.CSSProperties = {
  background: '#FFF7ED',
  border: '1px solid #FDE0C4',
  borderRadius: 10,
  padding: '10px 16px',
  fontSize: 13,
  color: '#7C4A1E',
  marginBottom: 20,
};

const tabRowStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 20 };

const tabBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#555',
  border: '1px solid #d1d5db',
  borderRadius: 20,
  cursor: 'pointer',
};

const tabBtnActiveStyle: React.CSSProperties = {
  ...tabBtnStyle,
  background: '#1C4A1C',
  color: '#fff',
  borderColor: '#1C4A1C',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  padding: 24,
};

const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 };

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

const addFormStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
  padding: 16,
  background: '#F9FAFB',
  borderRadius: 10,
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
  fontFamily: 'inherit',
  flex: '1 1 180px',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 13,
};

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#E8621A',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
};
