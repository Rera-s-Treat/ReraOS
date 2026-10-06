'use client';

import React, { useEffect, useState } from 'react';

import { getInventoryItems } from '@/services/inventory.services';
import { getProducts } from '@/services/products.services';
import { createProductionLog, getProductionLogs } from '@/services/production.services';
import { InventoryItem } from '@/types/inventory';
import { Product } from '@/types/product';
import { ProductionLog } from '@/types/production';

interface MaterialRow {
  inventoryItemId: string;
  quantityUsed: string;
}

interface ItemRow {
  productId: string;
  quantityMade: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

export default function ProductionPage() {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [productionDate, setProductionDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [itemRows, setItemRows] = useState<ItemRow[]>([
    { productId: '', quantityMade: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [logsData, itemsData, productsData] = await Promise.all([
        getProductionLogs(),
        getInventoryItems(),
        getProducts(),
      ]);
      setLogs(logsData);
      setInventoryItems(itemsData);
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load production data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addMaterialRow = () =>
    setMaterialRows((prev) => [...prev, { inventoryItemId: '', quantityUsed: '' }]);
  const removeMaterialRow = (index: number) =>
    setMaterialRows((prev) => prev.filter((_, i) => i !== index));
  const updateMaterialRow = (index: number, field: keyof MaterialRow, value: string) =>
    setMaterialRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const addItemRow = () => setItemRows((prev) => [...prev, { productId: '', quantityMade: '' }]);
  const removeItemRow = (index: number) =>
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  const updateItemRow = (index: number, field: keyof ItemRow, value: string) =>
    setItemRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const resetForm = () => {
    setProductionDate(today());
    setNotes('');
    setMaterialRows([]);
    setItemRows([{ productId: '', quantityMade: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = itemRows.filter((r) => r.productId && r.quantityMade.trim());
    if (validItems.length === 0) {
      setSaveError('Record at least one item made');
      return;
    }
    const validMaterials = materialRows.filter((r) => r.inventoryItemId && r.quantityUsed.trim());

    try {
      setIsSaving(true);
      setSaveError('');
      await createProductionLog({
        productionDate,
        notes: notes.trim() || undefined,
        materialsUsed: validMaterials.map((r) => ({
          inventoryItemId: r.inventoryItemId,
          quantityUsed: Number(r.quantityUsed),
        })),
        itemsMade: validItems.map((r) => ({
          productId: r.productId,
          quantityMade: Number(r.quantityMade),
        })),
      });
      resetForm();
      fetchAll();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save production log');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Record Today&apos;s Production</h2>

        <form onSubmit={handleSubmit}>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth noting about today's production"
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            />
          </div>

          <h3 style={groupTitleStyle}>Materials used</h3>
          {materialRows.map((row, index) => (
            <div key={index} style={itemRowStyle}>
              <select
                value={row.inventoryItemId}
                onChange={(e) => updateMaterialRow(index, 'inventoryItemId', e.target.value)}
                style={{ ...inputStyle, flex: 3 }}
              >
                <option value="">Select material</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantityInStock} in stock)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Qty used"
                value={row.quantityUsed}
                onChange={(e) => updateMaterialRow(index, 'quantityUsed', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={() => removeMaterialRow(index)} style={removeRowBtnStyle}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addMaterialRow} style={addRowBtnStyle}>
            + Add Material
          </button>

          <h3 style={groupTitleStyle}>Items made</h3>
          {itemRows.map((row, index) => (
            <div key={index} style={itemRowStyle}>
              <select
                value={row.productId}
                onChange={(e) => updateItemRow(index, 'productId', e.target.value)}
                style={{ ...inputStyle, flex: 3 }}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Qty made"
                value={row.quantityMade}
                onChange={(e) => updateItemRow(index, 'quantityMade', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeItemRow(index)}
                disabled={itemRows.length === 1}
                style={removeRowBtnStyle}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addItemRow} style={addRowBtnStyle}>
            + Add Item Made
          </button>

          {saveError && <p style={{ color: 'red', marginTop: 12 }}>{saveError}</p>}

          <div style={{ marginTop: 20 }}>
            <button type="submit" disabled={isSaving} style={submitBtnStyle}>
              {isSaving ? 'Saving…' : 'Save Production Log'}
            </button>
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recent Production Logs</h2>

        {isLoading && <p style={{ color: '#888' }}>Loading…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!isLoading && !error && logs.length === 0 && (
          <p style={{ color: '#888' }}>No production logs recorded yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {logs.map((log) => (
            <div key={log.id} style={logCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{formatDate(log.productionDate)}</strong>
                {log.recordedBy && (
                  <span style={{ fontSize: 12, color: '#888' }}>
                    {log.recordedBy.firstName} {log.recordedBy.lastName}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>Made:</strong>{' '}
                {log.itemsMade.map((i) => `${i.quantityMade}× ${i.product.name}`).join(', ')}
              </div>

              {log.materialsUsed.length > 0 && (
                <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                  <strong>Used:</strong>{' '}
                  {log.materialsUsed
                    .map((m) => `${m.quantityUsed}× ${m.inventoryItem.name}`)
                    .join(', ')}
                </div>
              )}

              {log.notes && <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>{log.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  padding: 24,
};

const sectionTitleStyle: React.CSSProperties = { marginTop: 0, fontSize: 18 };

const groupTitleStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: '#888',
  margin: '20px 0 10px',
};

const rowStyle: React.CSSProperties = { display: 'flex', gap: 16, flexWrap: 'wrap' };

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 16,
  flex: 1,
  minWidth: 200,
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

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 8,
  alignItems: 'center',
};

const addRowBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
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

const logCardStyle: React.CSSProperties = {
  background: '#F9FAFB',
  borderRadius: 10,
  padding: '14px 16px',
};
