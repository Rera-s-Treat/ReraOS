'use client';

import React, { useState } from 'react';
import { createProduct } from '../../services/products.services';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  sku: string;
  description: string;
  price: string;
  category: string;
  isAvailable: boolean;
}

const initialForm: FormState = {
  name: '',
  sku: '',
  description: '',
  price: '',
  category: '',
  isAvailable: true,
};

const MAX_IMAGES = 3;

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);

    if (selected.length === 0) return;

    const combined = [...images, ...selected].slice(0, MAX_IMAGES);
    setImages(combined);
    setImagePreviews(combined.map((file) => URL.createObjectURL(file)));

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    setImagePreviews(next.map((file) => URL.createObjectURL(file)));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setImages([]);
    setImagePreviews([]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
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

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        price: Number(form.price),
        category: form.category.trim() || undefined,
        isAvailable: form.isAvailable,
        images,
      });

      resetForm();
      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>Add Product</h2>
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
                placeholder="0.00"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Main Course"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Images (up to {MAX_IMAGES})
            </label>

            {imagePreviews.length > 0 && (
              <div style={imagePreviewRowStyle}>
                {imagePreviews.map((src, index) => (
                  <div key={src} style={imagePreviewWrapperStyle}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={imagePreviewStyle} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={removeImageBtnStyle}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                style={inputStyle}
              />
            )}
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
              {isSubmitting ? 'Creating...' : 'Create Product'}
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

const imagePreviewRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 10,
  flexWrap: 'wrap',
};

const imagePreviewWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: 72,
  height: 72,
};

const imagePreviewStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 8,
  border: '1px solid #d1d5db',
};

const removeImageBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: -8,
  right: -8,
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: 'none',
  background: '#b42318',
  color: '#fff',
  fontSize: 12,
  lineHeight: 1,
  cursor: 'pointer',
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
