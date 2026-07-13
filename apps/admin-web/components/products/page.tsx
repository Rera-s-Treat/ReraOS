'use client';

import React, { useEffect, useState } from 'react';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';
import { getProductImageUrl, getProducts } from '../../services/products.services';
import { PRODUCT_CATEGORY_LABELS, Product } from '../../types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Products</h1>
          <p style={subtitleStyle}>
            Manage menu items, pricing, and availability.
          </p>
        </div>

        <button style={addButtonStyle} onClick={() => setIsAddOpen(true)}>
          Add Product
        </button>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Photo</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Available</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={tdStyle}>
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getProductImageUrl(product.images[0])}
                        alt=""
                        style={thumbnailStyle}
                      />
                    ) : (
                      <div style={thumbnailPlaceholderStyle} />
                    )}
                  </td>
                  <td style={tdStyle}>{product.name}</td>
                  <td style={tdStyle}>
                    {product.category ? PRODUCT_CATEGORY_LABELS[product.category] : '-'}
                  </td>
                  <td style={tdStyle}>
                    {Number(product.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td style={tdStyle}>{product.status}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...availabilityBadgeStyle,
                        background: product.isAvailable
                          ? '#ecfdf3'
                          : '#fef3f2',
                        color: product.isAvailable ? '#027a48' : '#b42318',
                      }}
                    >
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={editButtonStyle}
                      onClick={() => setEditingProduct(product)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchProducts}
      />

      <EditProductModal
        isOpen={editingProduct !== null}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={fetchProducts}
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

const thumbnailStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  objectFit: 'cover',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
};

const thumbnailPlaceholderStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 6,
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
};

const availabilityBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: 16,
};
