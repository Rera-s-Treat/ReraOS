'use client';

import React, { useEffect, useState } from 'react';
import {
  FulfillmentStatus,
  KitchenStatus,
  Order,
  PaymentStatus,
} from '../../types/order';
import {
  updateFulfillmentStatus,
  updateKitchenStatus,
  updatePaymentStatus,
} from '../../services/orders.services';

interface OrderStatusModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentStatusOptions: PaymentStatus[] = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'FAILED',
  'REFUNDED',
];

const kitchenStatusOptions: KitchenStatus[] = [
  'NOT_STARTED',
  'KITCHEN_INFORMED',
  'PREPARING',
  'READY',
];

const fulfillmentStatusOptions: FulfillmentStatus[] = [
  'PENDING',
  'PICKED_UP',
  'SERVED',
  'DELIVERED',
  'CANCELLED',
];

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('PENDING_CONFIRMATION');
  const [kitchenStatus, setKitchenStatus] =
    useState<KitchenStatus>('NOT_STARTED');
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<FulfillmentStatus>('PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !order) return;

    setError('');
    setPaymentStatus(order.paymentStatus);
    setKitchenStatus(order.kitchenStatus);
    setFulfillmentStatus(order.fulfillmentStatus);
  }, [isOpen, order]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (paymentStatus !== order.paymentStatus) {
        await updatePaymentStatus(order.id, paymentStatus);
      }

      if (kitchenStatus !== order.kitchenStatus) {
        await updateKitchenStatus(order.id, kitchenStatus);
      }

      if (fulfillmentStatus !== order.fulfillmentStatus) {
        await updateFulfillmentStatus(order.id, fulfillmentStatus);
      }

      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2>Update Order Status</h2>
          <button onClick={handleClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <p style={orderNumberStyle}>{order.orderNumber}</p>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label>Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(e.target.value as PaymentStatus)
              }
              style={inputStyle}
            >
              {paymentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label>Kitchen Status</label>
            <select
              value={kitchenStatus}
              onChange={(e) =>
                setKitchenStatus(e.target.value as KitchenStatus)
              }
              style={inputStyle}
            >
              {kitchenStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label>Fulfillment Status</label>
            <select
              value={fulfillmentStatus}
              onChange={(e) =>
                setFulfillmentStatus(e.target.value as FulfillmentStatus)
              }
              style={inputStyle}
            >
              {fulfillmentStatusOptions.map((status) => (
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
  maxWidth: 480,
  background: '#fff',
  borderRadius: 12,
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const orderNumberStyle: React.CSSProperties = {
  color: '#666',
  fontFamily: 'monospace',
  fontSize: 13,
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
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  fontSize: 15,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
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
