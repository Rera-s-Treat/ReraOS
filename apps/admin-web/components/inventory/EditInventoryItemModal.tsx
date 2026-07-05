'use client';

import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../../types/inventory';
import { updateInventoryItem } from '../../services/inventory.services';

interface EditInventoryItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  sku: string;
  description: string;
  unitPrice: string;
  costPrice: string;
  quantityInStock: string;
  reorderLevel: string;
  status: string;
}

const emptyForm: FormState = {
  name: '',
  sku: '',
  description: '',
  unitPrice: '',
  costPrice: '',
  quantityInStock: '0',
  reorderLevel: '0',
  status: 'ACTIVE',
};

const statusOptions = ['ACTIVE', 'INACTIVE'];

export const EditInventoryItemModal: React.FC<EditInventoryItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!isOpen || !item) return;

    setError('');
    setForm({
      name: item.name,
      sku: item.sku,
      description: item.description ?? '',
      unitPrice: item.unitPrice,
      costPrice: item.costPrice ?? '',
      quantityInStock: String(item.quantityInStock),
      reorderLevel: String(item.reorderLevel),
      status: item.status,
    });
  }, [isOpen, item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const validate = () => {
    if (!form.name.trim()) return 'Item name is required';
    if (!form.sku.trim()) return 'SKU is required';
    if (!form.unitPrice.trim()) return 'Unit price is required';
    if (Number.isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 0) {
      return 'Unit price must be a valid non-negative number';
    }
    if (
      form.costPrice.trim() &&
      (Number.isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)
    ) {
      return 'Cost price must be a valid non-negative number';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await updateInventoryItem(item.id, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim() || undefined,
        unitPrice: Number(form.unitPrice),
        costPrice: form.costPrice.trim() ? Number(form.costPrice) : undefined,
        quantityInStock: Number(form.quantityInStock),
        reorderLevel: Number(form.reorderLevel),
        status: form.status,
      });

      onClose();
      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to update inventory item',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>Edit Inventory Item</h2>
          <button onClick={handleClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label>Item Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter item name"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="Enter unique SKU"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter description (optional)"
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            />
          </div>

          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label>Unit Price</label>
              <input
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Cost Price</label>
              <input
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={handleChange}
                placeholder="0.00 (optional)"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label>Quantity In Stock</label>
              <input
                name="quantityInStock"
                type="number"
                min="0"
                value={form.quantityInStock}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Reorder Level</label>
              <input
                name="reorderLevel"
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={inputStyle}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

          <div style={footerStyle}>
            <button type="button" onClick={handleClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...submitBtnStyle,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
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
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: '#fff',
  borderRadius: 12,
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 16,
  flex: 1,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  fontSize: 15,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
  fontFamily: 'inherit',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 20,
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
  background: '#E8621A',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
};
