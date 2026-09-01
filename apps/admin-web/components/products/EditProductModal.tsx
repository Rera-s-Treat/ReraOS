'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '../../types/product';
import { updateProduct } from '../../services/products.services';
import { CategorySelect } from './CategorySelect';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  sku: string;
  description: string;
  servings: string;
  contents: string;
  price: string;
  categoryId: string;
  status: string;
  isAvailable: boolean;
  featured: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  name: '',
  sku: '',
  description: '',
  servings: '',
  contents: '',
  price: '',
  categoryId: '',
  status: 'ACTIVE',
  isAvailable: true,
  featured: false,
  sortOrder: '0',
};

const statusOptions = ['ACTIVE', 'INACTIVE'];

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!isOpen || !product) return;

    setError('');
    setForm({
      name: product.name,
      sku: product.sku ?? '',
      description: product.description ?? '',
      servings: product.servings ?? '',
      contents: (product.contents ?? []).join('\n'),
      price: product.price,
      categoryId: product.categoryId ?? '',
      status: product.status,
      isAvailable: product.isAvailable,
      featured: product.featured ?? false,
      sortOrder: String(product.sortOrder ?? 0),
    });
  }, [isOpen, product]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const validate = () => {
    if (!form.name.trim()) return 'Product name is required';
    if (!form.price.trim()) return 'Price is required';
    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      return 'Price must be a valid non-negative number';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await updateProduct(product.id, {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        servings: form.servings.trim() || undefined,
        contents: form.contents
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        price: Number(form.price),
        categoryId: form.categoryId || undefined,
        status: form.status,
        isAvailable: form.isAvailable,
        featured: form.featured,
        sortOrder: form.sortOrder.trim() ? Number(form.sortOrder) : undefined,
      });

      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>Edit Product</h2>
          <button onClick={handleClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label>Product Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="Enter SKU (optional)"
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
              <label>Price</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Category</label>
              <CategorySelect
                value={form.categoryId}
                onChange={(categoryId) => setForm((prev) => ({ ...prev, categoryId }))}
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label>Servings</label>
              <input
                name="servings"
                value={form.servings}
                onChange={handleChange}
                placeholder="e.g. Serves 1-2"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Sort Order</label>
              <input
                name="sortOrder"
                type="number"
                step="1"
                value={form.sortOrder}
                onChange={handleChange}
                placeholder="0"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label>What's included (one per line)</label>
            <textarea
              name="contents"
              value={form.contents}
              onChange={handleChange}
              placeholder={'2pcs chicken\nColeslaw\nFries'}
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            />
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

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              name="isAvailable"
              checked={form.isAvailable}
              onChange={handleChange}
            />
            Available on menu
          </label>

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
            />
            Featured (highlight on menu/homepage)
          </label>

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

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
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
