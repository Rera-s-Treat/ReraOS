'use client';

import React, { useEffect, useState } from 'react';

import { createEmployee, updateEmployee } from '@/services/staff.services';
import { CreateEmployeePayload, Employee } from '@/types/staff';

interface EmployeeFormModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface FormState {
  fullName: string;
  role: string;
  phone: string;
  monthlySalary: string;
  birthdayDay: string;
  birthdayMonth: string;
  address: string;
  qualification: string;
  allergy: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

const emptyForm: FormState = {
  fullName: '',
  role: '',
  phone: '',
  monthlySalary: '',
  birthdayDay: '',
  birthdayMonth: '',
  address: '',
  qualification: '',
  allergy: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
};

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(
      employee
        ? {
            fullName: employee.fullName,
            role: employee.role ?? '',
            phone: employee.phone ?? '',
            monthlySalary: employee.monthlySalary ?? '',
            birthdayDay: employee.birthdayDay ? String(employee.birthdayDay) : '',
            birthdayMonth: employee.birthdayMonth ? String(employee.birthdayMonth) : '',
            address: employee.address ?? '',
            qualification: employee.qualification ?? '',
            allergy: employee.allergy ?? '',
            bankName: employee.bankName ?? '',
            bankAccountNumber: employee.bankAccountNumber ?? '',
            bankAccountName: employee.bankAccountName ?? '',
          }
        : emptyForm,
    );
  }, [isOpen, employee]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    const payload: CreateEmployeePayload = {
      fullName: form.fullName.trim(),
      role: form.role.trim() || undefined,
      phone: form.phone.trim() || undefined,
      monthlySalary: form.monthlySalary.trim() ? Number(form.monthlySalary) : undefined,
      birthdayDay: form.birthdayDay ? Number(form.birthdayDay) : undefined,
      birthdayMonth: form.birthdayMonth ? Number(form.birthdayMonth) : undefined,
      address: form.address.trim() || undefined,
      qualification: form.qualification.trim() || undefined,
      allergy: form.allergy.trim() || undefined,
      bankName: form.bankName.trim() || undefined,
      bankAccountNumber: form.bankAccountNumber.trim() || undefined,
      bankAccountName: form.bankAccountName.trim() || undefined,
    };

    try {
      setIsSaving(true);
      setError('');
      if (employee) {
        await updateEmployee(employee.id, payload);
      } else {
        await createEmployee(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save employee');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <h3 style={groupTitleStyle}>Basic details</h3>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Role</label>
              <input name="role" value={form.role} onChange={handleChange} placeholder="e.g. Kitchen Assistant" style={inputStyle} />
            </div>
          </div>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Monthly Salary</label>
              <input
                name="monthlySalary"
                type="number"
                min="0"
                value={form.monthlySalary}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <h3 style={groupTitleStyle}>Personal details</h3>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Birthday — Day</label>
              <input
                name="birthdayDay"
                type="number"
                min="1"
                max="31"
                value={form.birthdayDay}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Birthday — Month</label>
              <select name="birthdayMonth" value={form.birthdayMonth} onChange={handleChange} style={inputStyle}>
                <option value="">—</option>
                {MONTH_OPTIONS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Address</label>
            <input name="address" value={form.address} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Qualification</label>
              <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. HND Food Science" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Allergy</label>
              <input name="allergy" value={form.allergy} onChange={handleChange} placeholder="e.g. Shellfish" style={inputStyle} />
            </div>
          </div>

          <h3 style={groupTitleStyle}>Account details (for payroll)</h3>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bank Name</label>
              <input name="bankName" value={form.bankName} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Account Number</label>
              <input name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Account Name</label>
            <input name="bankAccountName" value={form.bankAccountName} onChange={handleChange} style={inputStyle} />
          </div>

          {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isSaving} style={submitBtnStyle}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
  padding: 24,
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 640,
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 12,
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
};

const groupTitleStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: '#888',
  margin: '20px 0 10px',
};

const rowStyle: React.CSSProperties = { display: 'flex', gap: 16 };

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 14,
  flex: 1,
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#555' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
  fontFamily: 'inherit',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 12,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};
