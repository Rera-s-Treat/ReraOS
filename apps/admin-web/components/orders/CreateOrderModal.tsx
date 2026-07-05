'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '../../types/product';
import { OrderChannel, OrderType } from '../../types/order';
import { getProducts } from '../../services/products.services';
import { createOrder } from '../../services/orders.services';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemRow {
  productId: string;
  quantity: string;
}

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  channel: OrderChannel;
  orderType: OrderType;
  tableNumber: string;
  deliveryAddress: string;
  notes: string;
  discountAmount: string;
}

const initialForm: FormState = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  channel: 'WHATSAPP',
  orderType: 'DELIVERY',
  tableNumber: '',
  deliveryAddress: '',
  notes: '',
  discountAmount: '0',
};

const emptyRow: ItemRow = { productId: '', quantity: '1' };

const channelOptions: OrderChannel[] = ['WHATSAPP', 'MANUAL', 'WALK_IN'];
const orderTypeOptions: OrderType[] = ['PICKUP', 'DELIVERY', 'DINE_IN'];

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);
  const [rows, setRows] = useState<ItemRow[]>([{ ...emptyRow }]);

  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setForm(initialForm);
    setRows([{ ...emptyRow }]);

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const data = await getProducts();
        setProducts(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowChange = (
    index: number,
    field: keyof ItemRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const handleClose = () => {
    setError('');
    onClose();
  };

  const estimatedSubtotal = rows.reduce((sum, row) => {
    const product = products.find((p) => p.id === row.productId);
    const quantity = Number(row.quantity) || 0;
    return sum + (product ? Number(product.price) * quantity : 0);
  }, 0);

  const validate = () => {
    if (!form.customerName.trim()) return 'Customer name is required';
    if (!form.customerPhone.trim()) return 'Customer phone is required';
    if (form.orderType === 'DINE_IN' && !form.tableNumber.trim()) {
      return 'Table number is required for dine-in orders';
    }
    if (form.orderType === 'DELIVERY' && !form.deliveryAddress.trim()) {
      return 'Delivery address is required for delivery orders';
    }
    if (rows.length === 0) return 'At least one item is required';

    for (const row of rows) {
      if (!row.productId) return 'Select an item for every row';
      const quantity = Number(row.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return 'Quantity must be a whole number of at least 1';
      }
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await createOrder({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        channel: form.channel,
        orderType: form.orderType,
        tableNumber:
          form.orderType === 'DINE_IN' ? form.tableNumber.trim() : undefined,
        deliveryAddress:
          form.orderType === 'DELIVERY'
            ? form.deliveryAddress.trim()
            : undefined,
        notes: form.notes.trim() || undefined,
        discountAmount: form.discountAmount.trim()
          ? Number(form.discountAmount)
          : undefined,
        items: rows.map((row) => ({
          productId: row.productId,
          quantity: Number(row.quantity),
        })),
      });

      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>New Order</h2>
          <button onClick={handleClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={rowLayoutStyle}>
            <div style={fieldStyle}>
              <label>Customer Name</label>
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Customer Phone</label>
              <input
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="Enter phone number"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label>Customer Email</label>
            <input
              name="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={handleChange}
              placeholder="Enter email (optional)"
              style={inputStyle}
            />
          </div>

          <div style={rowLayoutStyle}>
            <div style={fieldStyle}>
              <label>Channel</label>
              <select
                name="channel"
                value={form.channel}
                onChange={handleChange}
                style={inputStyle}
              >
                {channelOptions.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label>Order Type</label>
              <select
                name="orderType"
                value={form.orderType}
                onChange={handleChange}
                style={inputStyle}
              >
                {orderTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.orderType === 'DINE_IN' && (
            <div style={fieldStyle}>
              <label>Table Number</label>
              <input
                name="tableNumber"
                value={form.tableNumber}
                onChange={handleChange}
                placeholder="Enter table number"
                style={inputStyle}
              />
            </div>
          )}

          {form.orderType === 'DELIVERY' && (
            <div style={fieldStyle}>
              <label>Delivery Address</label>
              <input
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                placeholder="Enter delivery address"
                style={inputStyle}
              />
            </div>
          )}

          <div style={fieldStyle}>
            <label>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Enter notes (optional)"
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Items</label>

            {rows.map((row, index) => (
              <div key={index} style={itemRowStyle}>
                <select
                  value={row.productId}
                  onChange={(e) =>
                    handleRowChange(index, 'productId', e.target.value)
                  }
                  disabled={isLoadingProducts}
                  style={{ ...inputStyle, flex: 3 }}
                >
                  <option value="">Select item</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` (${product.sku})` : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(e) =>
                    handleRowChange(index, 'quantity', e.target.value)
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  style={removeRowBtnStyle}
                >
                  Remove
                </button>
              </div>
            ))}

            <button type="button" onClick={addRow} style={addRowBtnStyle}>
              + Add Item
            </button>
          </div>

          <div style={fieldStyle}>
            <label>Discount Amount</label>
            <input
              name="discountAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.discountAmount}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <p style={estimatedTotalStyle}>
            Estimated subtotal:{' '}
            {estimatedSubtotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

          <div style={footerStyle}>
            <button type="button" onClick={handleClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingProducts}
              style={{
                ...submitBtnStyle,
                opacity: isSubmitting || isLoadingProducts ? 0.6 : 1,
                cursor:
                  isSubmitting || isLoadingProducts
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
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
  marginBottom: 20,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
};

const rowLayoutStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 16,
  flex: 1,
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

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 8,
  alignItems: 'center',
};

const addRowBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

const removeRowBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#b42318',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const estimatedTotalStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 16,
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
