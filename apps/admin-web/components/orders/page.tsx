'use client';

import React, { useEffect, useState } from 'react';
import { CreateOrderModal } from './CreateOrderModal';
import { OrderStatusModal } from './OrderStatusModal';
import { OrderDetailsDrawer } from './OrderDetailsDrawer';
import { getOrders } from '../../services/orders.services';
import { FulfillmentStatus, Order, PaymentStatus } from '../../types/order';

interface FilterState {
  search: string;
  paymentStatus: PaymentStatus | '';
  fulfillmentStatus: FulfillmentStatus | '';
  dateFrom: string;
  dateTo: string;
}

const initialFilters: FilterState = {
  search: '',
  paymentStatus: '',
  fulfillmentStatus: '',
  dateFrom: '',
  dateTo: '',
};

const paymentStatusOptions: PaymentStatus[] = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'FAILED',
  'REFUNDED',
];

const fulfillmentStatusOptions: FulfillmentStatus[] = [
  'PENDING',
  'PICKED_UP',
  'SERVED',
  'DELIVERED',
  'CANCELLED',
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const fetchOrders = async (activeFilters: FilterState = filters) => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getOrders({
        search: activeFilters.search.trim() || undefined,
        paymentStatus: activeFilters.paymentStatus || undefined,
        fulfillmentStatus: activeFilters.fulfillmentStatus || undefined,
        dateFrom: activeFilters.dateFrom || undefined,
        dateTo: activeFilters.dateTo || undefined,
      });
      setOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    fetchOrders(initialFilters);
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Orders</h1>
          <p style={subtitleStyle}>Track and manage customer orders.</p>
        </div>

        <button style={addButtonStyle} onClick={() => setIsCreateOpen(true)}>
          New Order
        </button>
      </div>

      <form onSubmit={handleApplyFilters} style={filterBarStyle}>
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search name, phone, or order #"
          style={filterInputStyle}
        />

        <select
          name="paymentStatus"
          value={filters.paymentStatus}
          onChange={handleFilterChange}
          style={filterInputStyle}
        >
          <option value="">All payment statuses</option>
          {paymentStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          name="fulfillmentStatus"
          value={filters.fulfillmentStatus}
          onChange={handleFilterChange}
          style={filterInputStyle}
        >
          <option value="">All fulfillment statuses</option>
          {fulfillmentStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleFilterChange}
          style={filterInputStyle}
        />

        <input
          type="date"
          name="dateTo"
          value={filters.dateTo}
          onChange={handleFilterChange}
          style={filterInputStyle}
        />

        <button type="submit" style={applyFilterBtnStyle}>
          Search
        </button>
        <button
          type="button"
          onClick={handleClearFilters}
          style={clearFilterBtnStyle}
        >
          Clear
        </button>
      </form>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order #</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Channel</th>
                <th style={thStyle}>Items</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Fulfillment</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                    {order.orderNumber}
                  </td>
                  <td style={tdStyle}>
                    {order.customerName}
                    <div style={subTextStyle}>{order.customerPhone}</div>
                  </td>
                  <td style={tdStyle}>{order.channel}</td>
                  <td style={{ ...tdStyle, maxWidth: 220 }}>
                    <span style={itemsSummaryStyle}>
                      {order.items
                        .map((item) => `${item.quantity}× ${item.product.name}`)
                        .join(', ')}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {Number(order.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(order.paymentStatus)}>
                      {order.paymentStatus}
                    </span>
                    {order.paymentClaimedAt &&
                      order.paymentStatus === 'PENDING_CONFIRMATION' && (
                        <div style={paymentClaimedStyle}>
                          Customer says paid
                        </div>
                      )}
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(order.fulfillmentStatus)}>
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '-'}
                  </td>
                  <td style={tdStyle}>
                    <div style={actionsCellStyle}>
                      <button
                        style={viewButtonStyle}
                        onClick={() => setDetailsOrder(order)}
                      >
                        View
                      </button>
                      <button
                        style={editButtonStyle}
                        onClick={() => setSelectedOrder(order)}
                      >
                        Update Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchOrders(filters)}
      />

      <OrderStatusModal
        isOpen={selectedOrder !== null}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onSuccess={() => fetchOrders(filters)}
      />

      <OrderDetailsDrawer
        isOpen={detailsOrder !== null}
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />
    </div>
  );
}

const positiveStatuses = new Set([
  'CONFIRMED',
  'READY',
  'DELIVERED',
  'SERVED',
  'PICKED_UP',
]);

const negativeStatuses = new Set(['FAILED', 'REFUNDED', 'CANCELLED']);

function badgeStyle(status: string): React.CSSProperties {
  let background = '#f3f4f6';
  let color = '#374151';

  if (positiveStatuses.has(status)) {
    background = '#ecfdf3';
    color = '#027a48';
  } else if (negativeStatuses.has(status)) {
    background = '#fef3f2';
    color = '#b42318';
  }

  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background,
    color,
    whiteSpace: 'nowrap',
  };
}

const pageStyle: React.CSSProperties = {
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#666',
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 20,
  alignItems: 'center',
};

const filterInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
};

const applyFilterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const clearFilterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
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
  whiteSpace: 'nowrap',
};

const viewButtonStyle: React.CSSProperties = {
  background: '#fff',
  color: '#E8621A',
  border: '1px solid #E8621A',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const actionsCellStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
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
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 14,
};

const subTextStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 12,
  marginTop: 2,
};

const itemsSummaryStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  fontSize: 13,
  color: '#444',
};

const paymentClaimedStyle: React.CSSProperties = {
  color: '#b45309',
  fontSize: 11,
  fontWeight: 600,
  marginTop: 4,
  whiteSpace: 'nowrap',
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: 16,
};
