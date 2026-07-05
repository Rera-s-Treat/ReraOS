'use client';

import React, { useEffect, useState } from 'react';
import { AddInventoryItemModal } from './AddInventoryItemModal';
import { EditInventoryItemModal } from './EditInventoryItemModal';
import { getInventoryItems } from '../../services/inventory.services';
import { InventoryItem } from '../../types/inventory';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getInventoryItems();
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Inventory</h1>
          <p style={subtitleStyle}>Monitor stock levels and item availability.</p>
        </div>

        <button style={addButtonStyle} onClick={() => setIsAddItemOpen(true)}>
          Add Item
        </button>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p>Loading inventory...</p>
        ) : items.length === 0 ? (
          <p>No inventory items found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>Unit Price</th>
                <th style={thStyle}>Qty In Stock</th>
                <th style={thStyle}>Reorder Level</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLowStock = item.quantityInStock <= item.reorderLevel;

                return (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.sku}</td>
                    <td style={tdStyle}>
                      {Number(item.unitPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: isLowStock ? '#b42318' : undefined,
                        fontWeight: isLowStock ? 600 : undefined,
                      }}
                    >
                      {item.quantityInStock}
                      {isLowStock ? ' (low)' : ''}
                    </td>
                    <td style={tdStyle}>{item.reorderLevel}</td>
                    <td style={tdStyle}>{item.status}</td>
                    <td style={tdStyle}>
                      <button
                        style={editButtonStyle}
                        onClick={() => setEditingItem(item)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AddInventoryItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSuccess={fetchItems}
      />

      <EditInventoryItemModal
        isOpen={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={fetchItems}
      />
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#666',
};

const editButtonStyle: React.CSSProperties = {
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const addButtonStyle: React.CSSProperties = {
  background: '#E8621A',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 600,
};

const tableWrapperStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  overflowX: 'auto',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 14,
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: 16,
};
