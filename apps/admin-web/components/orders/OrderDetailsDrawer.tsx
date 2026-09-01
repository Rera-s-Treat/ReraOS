'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { Order, OrderAuditLogEntry } from '../../types/order';
import {
  getOrderAuditLog,
  sendOrderConfirmation,
  sendOrderPaymentInstruction,
  sendOrderReady,
  sendOrderUpdate,
} from '../../services/orders.services';

interface OrderDetailsDrawerProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  const [auditLog, setAuditLog] = useState<OrderAuditLogEntry[]>([]);
  const [isLoadingAuditLog, setIsLoadingAuditLog] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isSendingAction, setIsSendingAction] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const { isSuperAdmin } = useCurrentUser();

  useEffect(() => {
    if (!isOpen || !order) return;

    setActionMessage('');
    setCustomMessage('');

    if (!isSuperAdmin) return;

    const fetchAuditLog = async () => {
      try {
        setIsLoadingAuditLog(true);
        const data = await getOrderAuditLog(order.id);
        setAuditLog(data);
      } catch {
        setAuditLog([]);
      } finally {
        setIsLoadingAuditLog(false);
      }
    };

    fetchAuditLog();
  }, [isOpen, order, isSuperAdmin]);

  if (!isOpen || !order) return null;

  const runAction = async (
    key: string,
    action: () => Promise<{ success: boolean }>,
  ) => {
    try {
      setIsSendingAction(key);
      setActionMessage('');
      await action();
      setActionMessage('Message sent (see server logs if SMS/email is not yet configured).');
    } catch (err: any) {
      setActionMessage(
        err?.response?.data?.message || 'Failed to send message',
      );
    } finally {
      setIsSendingAction('');
    }
  };

  const locationDetails =
    order.orderType === 'DINE_IN'
      ? `Table: ${order.tableNumber || '-'}`
      : order.orderType === 'DELIVERY'
        ? `Delivery address: ${order.deliveryAddress || '-'}`
        : 'Pickup at counter';

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={drawerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'monospace', fontSize: 18 }}>
              {order.orderNumber}
            </h2>
            {order.unifiedStatus && (
              <span style={unifiedBadgeStyle}>{order.unifiedStatus}</span>
            )}
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Customer</h3>
          <p style={lineStyle}>{order.customerName}</p>
          <p style={lineStyle}>{order.customerPhone}</p>
          {order.customerEmail && <p style={lineStyle}>{order.customerEmail}</p>}
          <p style={lineStyle}>
            {order.channel} · {order.orderType}
          </p>
          <p style={lineStyle}>{locationDetails}</p>
          {order.notes && (
            <p style={notesStyle}>
              <strong>Notes:</strong> {order.notes}
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Items</h3>
          <table style={itemsTableStyle}>
            <thead>
              <tr>
                <th style={itemThStyle}>Product</th>
                <th style={itemThStyle}>Qty</th>
                <th style={itemThStyle}>Unit Price</th>
                <th style={itemThStyle}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td style={itemTdStyle}>{item.product.name}</td>
                  <td style={itemTdStyle}>{item.quantity}</td>
                  <td style={itemTdStyle}>
                    {Number(item.unitPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={itemTdStyle}>
                    {Number(item.lineTotal).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={totalsBlockStyle}>
            <div style={totalsRowStyle}>
              <span>Subtotal</span>
              <span>{Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div style={totalsRowStyle}>
              <span>Discount</span>
              <span>{Number(order.discountAmount).toLocaleString()}</span>
            </div>
            <div style={{ ...totalsRowStyle, fontWeight: 700 }}>
              <span>Total</span>
              <span>{Number(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Payment</h3>
          <p style={lineStyle}>Status: {order.paymentStatus}</p>
          {order.paymentClaimedAt && (
            <p style={lineStyle}>
              Customer claimed payment at:{' '}
              {new Date(order.paymentClaimedAt).toLocaleString()}
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Inventory Impact</h3>
          <p style={placeholderStyle}>
            Not yet tracked — products aren&apos;t linked to raw inventory
            items yet.
          </p>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Customer Notifications</h3>
          <div style={actionRowStyle}>
            <button
              style={actionBtnStyle}
              disabled={isSendingAction !== ''}
              onClick={() =>
                runAction('confirmation', () =>
                  sendOrderConfirmation(order.id),
                )
              }
            >
              {isSendingAction === 'confirmation' ? 'Sending...' : 'Send Confirmation'}
            </button>
            <button
              style={actionBtnStyle}
              disabled={isSendingAction !== ''}
              onClick={() =>
                runAction('payment-instruction', () =>
                  sendOrderPaymentInstruction(order.id),
                )
              }
            >
              {isSendingAction === 'payment-instruction'
                ? 'Sending...'
                : 'Send Payment Instructions'}
            </button>
            <button
              style={actionBtnStyle}
              disabled={isSendingAction !== ''}
              onClick={() =>
                runAction('ready', () => sendOrderReady(order.id))
              }
            >
              {isSendingAction === 'ready' ? 'Sending...' : 'Send Order-Ready'}
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Custom cancellation/update message (optional)"
              style={textareaStyle}
            />
            <button
              style={{ ...actionBtnStyle, marginTop: 8 }}
              disabled={isSendingAction !== ''}
              onClick={() =>
                runAction('update', () =>
                  sendOrderUpdate(order.id, customMessage.trim() || undefined),
                )
              }
            >
              {isSendingAction === 'update'
                ? 'Sending...'
                : 'Send Cancellation / Update'}
            </button>
          </div>

          {actionMessage && <p style={actionMessageStyle}>{actionMessage}</p>}
        </section>

        {isSuperAdmin && (
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Activity Log</h3>
          {isLoadingAuditLog ? (
            <p style={placeholderStyle}>Loading...</p>
          ) : auditLog.length === 0 ? (
            <p style={placeholderStyle}>No status changes recorded yet.</p>
          ) : (
            <ul style={auditListStyle}>
              {auditLog.map((entry) => (
                <li key={entry.id} style={auditItemStyle}>
                  <div>{entry.description}</div>
                  <div style={auditMetaStyle}>
                    {entry.user
                      ? `${entry.user.firstName} ${entry.user.lastName}`
                      : 'System'}{' '}
                    · {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'flex-end',
  zIndex: 999,
};

const drawerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  height: '100%',
  background: '#fff',
  overflowY: 'auto',
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 20,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
};

const unifiedBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: '#f9ede3',
  color: '#e8621a',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
  paddingBottom: 20,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#666',
};

const lineStyle: React.CSSProperties = {
  margin: '4px 0',
  fontSize: 14,
};

const notesStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  background: '#f9fafb',
  padding: 10,
  borderRadius: 8,
};

const itemsTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const itemThStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: '1px solid #e5e7eb',
  color: '#666',
};

const itemTdStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #f1f5f9',
};

const totalsBlockStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 14,
};

const totalsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 0',
};

const placeholderStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#999',
  fontStyle: 'italic',
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 60,
  padding: '10px 12px',
  fontSize: 13,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontFamily: 'inherit',
  resize: 'vertical',
};

const actionMessageStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: '#027a48',
};

const auditListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const auditItemStyle: React.CSSProperties = {
  fontSize: 13,
  background: '#f9fafb',
  padding: 10,
  borderRadius: 8,
};

const auditMetaStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: '#999',
};
