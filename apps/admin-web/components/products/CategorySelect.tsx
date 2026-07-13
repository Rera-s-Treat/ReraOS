'use client';

import React, { useEffect, useState } from 'react';
import { createCategory, getCategories } from '../../services/categories.services';
import { Category } from '../../types/category';

const NEW_CATEGORY_VALUE = '__new__';

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories'));
  }, []);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === NEW_CATEGORY_VALUE) {
      setIsAddingNew(true);
      return;
    }
    onChange(e.target.value);
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      setIsCreating(true);
      setError('');
      const category = await createCategory(name);
      setCategories((prev) =>
        [...prev, category].sort((a, b) => a.name.localeCompare(b.name)),
      );
      onChange(category.id);
      setIsAddingNew(false);
      setNewCategoryName('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create category');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div>
      <select value={value} onChange={handleSelectChange} style={inputStyle}>
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        <option value={NEW_CATEGORY_VALUE}>+ Add new category...</option>
      </select>

      {isAddingNew && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            style={inputStyle}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            disabled={isCreating}
            style={addBtnStyle}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(false);
              setNewCategoryName('');
            }}
            style={cancelBtnStyle}
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p style={{ color: 'red', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
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

const addBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
