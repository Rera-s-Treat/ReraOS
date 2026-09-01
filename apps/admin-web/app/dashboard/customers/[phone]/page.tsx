'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { getCustomerDetail, updateCustomer } from '@/services/customers.services';
import { CustomerDetail } from '@/types/customer';

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function tagBadgeStyle(tag: string): React.CSSProperties {
  let background = '#f3f4f6';
  let color = '#374151';

  if (tag === 'VIP') {
    background = '#fef6e7';
    color = '#b45309';
  } else if (tag === 'NEW') {
    background = '#eff6ff';
    color = '#1d4ed8';
  } else if (tag === 'REPEAT') {
    background = '#ecfdf3';
    color = '#027a48';
  } else if (tag === 'INACTIVE') {
    background = '#fef3f2';
    color = '#b42318';
  }

  return {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background,
    color,
    whiteSpace: 'nowrap',
    marginRight: 6,
    marginBottom: 4,
  };
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const positive = new Set(['CONFIRMED', 'DELIVERED', 'SERVED', 'PICKED_UP', 'READY']);
  const negative = new Set(['FAILED', 'REFUNDED', 'CANCELLED']);

  let background = '#f3f4f6';
  let color = '#374151';

  if (positive.has(status)) {
    background = '#ecfdf3';
    color = '#027a48';
  } else if (negative.has(status)) {
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

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ phone: string }>();
  const phone = params.phone;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const loadCustomer = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getCustomerDetail(phone);
      setCustomer(data);
      setNameDraft(data.displayName);
      setNotesDraft(data.notes || '');
    } catch (err) {
      setError('Failed to load customer');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (phone) {
      loadCustomer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  if (isLoading) {
    return <div style={pageStyle}>Loading customer...</div>;
  }

  if (error || !customer) {
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error || 'Customer not found.'}</p>
        <button style={backButtonStyle} onClick={() => router.push('/dashboard/customers')}>
          Back to Customers
        </button>
      </div>
    );
  }

  const manualTags = customer.tags.filter(
    (tag) => !['NEW', 'REPEAT', 'VIP', 'INACTIVE'].includes(tag),
  );
  const autoTags = customer.tags.filter((tag) =>
    ['NEW', 'REPEAT', 'VIP', 'INACTIVE'].includes(tag),
  );

  async function saveName() {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateCustomer(phone, { displayName: nameDraft });
      setIsEditingName(false);
      await loadCustomer();
    } catch {
      setSaveMessage('Failed to save name.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveNotes() {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateCustomer(phone, { notes: notesDraft });
      setSaveMessage('Notes saved.');
    } catch {
      setSaveMessage('Failed to save notes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function addTag() {
    const tag = newTag.trim();
    if (!tag || !customer) return;

    setIsSaving(true);
    try {
      await updateCustomer(phone, { tags: [...manualTags, tag] });
      setNewTag('');
      await loadCustomer();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeTag(tag: string) {
    setIsSaving(true);
    try {
      await updateCustomer(phone, { tags: manualTags.filter((t) => t !== tag) });
      await loadCustomer();
    } finally {
      setIsSaving(false);
    }
  }

  function copyPhone() {
    navigator.clipboard.writeText(customer!.phone);
    setSaveMessage('Phone number copied.');
  }

  function openWhatsApp() {
    window.open(`https://wa.me/${customer!.phone}`, '_blank');
  }

  return (
    <div style={pageStyle}>
      <button style={backButtonStyle} onClick={() => router.push('/dashboard/customers')}>
        ← Back to Customers
      </button>

      <div style={gridStyle}>
        {/* Profile summary */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    style={inputStyle}
                  />
                  <button style={smallButtonStyle} onClick={saveName} disabled={isSaving}>
                    Save
                  </button>
                  <button
                    style={smallSecondaryButtonStyle}
                    onClick={() => {
                      setIsEditingName(false);
                      setNameDraft(customer.displayName);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1 style={titleStyle}>
                  {customer.displayName}{' '}
                  <button style={editLinkStyle} onClick={() => setIsEditingName(true)}>
                    Edit
                  </button>
                </h1>
              )}

              <p style={subtitleStyle}>
                {customer.phone}
                {customer.email ? ` · ${customer.email}` : ''}
              </p>

              <div style={{ marginTop: 8 }}>
                {autoTags.map((tag) => (
                  <span key={tag} style={tagBadgeStyle(tag)}>
                    {tag}
                  </span>
                ))}
                {manualTags.map((tag) => (
                  <span key={tag} style={tagBadgeStyle(tag)}>
                    {tag}
                    <button style={removeTagButtonStyle} onClick={() => removeTag(tag)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  style={{ ...inputStyle, maxWidth: 160 }}
                />
                <button style={smallSecondaryButtonStyle} onClick={addTag} disabled={isSaving}>
                  Add Tag
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={actionButtonStyle} onClick={openWhatsApp}>
                Open WhatsApp
              </button>
              <button style={secondaryActionButtonStyle} onClick={copyPhone}>
                Copy Phone
              </button>
            </div>
          </div>

          {saveMessage && <p style={saveMessageStyle}>{saveMessage}</p>}

          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Total Orders</p>
              <p style={statValueStyle}>{customer.profile.totalOrders}</p>
            </div>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Lifetime Spend</p>
              <p style={statValueStyle}>{formatNaira(customer.profile.totalSpend)}</p>
            </div>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Average Order Value</p>
              <p style={statValueStyle}>
                {formatNaira(customer.profile.averageOrderValue)}
              </p>
            </div>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Customer Since</p>
              <p style={statValueStyle}>
                {new Date(customer.profile.firstOrderAt).toLocaleDateString()}
              </p>
            </div>
            <div style={statBoxStyle}>
              <p style={statLabelStyle}>Last Order</p>
              <p style={statValueStyle}>
                {new Date(customer.profile.lastOrderAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Internal notes */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Internal Notes</h3>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Preferred delivery/pickup pattern, issue history, allergies, etc."
            style={textareaStyle}
          />
          <button style={smallButtonStyle} onClick={saveNotes} disabled={isSaving}>
            Save Notes
          </button>
        </div>

        {/* Unpaid orders */}
        {customer.unpaidOrders.length > 0 && (
          <div style={{ ...cardStyle, border: '1px solid #fca5a5' }}>
            <h3 style={cardTitleStyle}>
              Outstanding Unpaid Orders ({customer.unpaidOrders.length})
            </h3>
            {customer.unpaidOrders.map((order) => (
              <div key={order.id} style={unpaidRowStyle}>
                <span>{order.orderNumber}</span>
                <span style={statusBadgeStyle(order.paymentStatus)}>
                  {order.paymentStatus}
                </span>
                <span>{formatNaira(order.totalAmount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Product behavior */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Product Behavior</h3>

          <p style={subLabelStyle}>Favorite Category</p>
          <p style={{ marginTop: 4, marginBottom: 16 }}>
            {customer.productBehavior.favoriteCategory || 'N/A'}
          </p>

          <p style={subLabelStyle}>Most Ordered Items</p>
          <div style={{ marginTop: 4, marginBottom: 16 }}>
            {customer.productBehavior.mostOrderedItems.map((item) => (
              <div key={item.productId} style={productRowStyle}>
                <span>{item.name}</span>
                <span style={{ color: '#666' }}>{item.quantity}×</span>
              </div>
            ))}
          </div>

          <p style={subLabelStyle}>Last Order Items</p>
          <div style={{ marginTop: 4 }}>
            {customer.productBehavior.lastOrderedItems.map((item) => (
              <div key={item.productId} style={productRowStyle}>
                <span>{item.name}</span>
                <span style={{ color: '#666' }}>{item.quantity}×</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Events &amp; Preferences</h3>

          <p style={subLabelStyle}>Events Attended</p>
          <p style={{ marginTop: 4, marginBottom: 16 }}>{customer.events.attended}</p>

          <p style={subLabelStyle}>Excited to try (from RSVPs)</p>
          <p style={{ marginTop: 4, marginBottom: 16 }}>
            {customer.events.interests.length > 0 ? customer.events.interests.join(', ') : 'N/A'}
          </p>

          <p style={subLabelStyle}>RSVP History</p>
          <div style={{ marginTop: 4 }}>
            {customer.events.rsvps.length === 0 ? (
              <p style={{ color: '#666', fontSize: 13 }}>No RSVPs yet.</p>
            ) : (
              customer.events.rsvps.map((rsvp) => (
                <div key={rsvp.id} style={productRowStyle}>
                  <span>{rsvp.eventTitle}</span>
                  <span style={{ color: '#666' }}>{rsvp.attendanceStatus}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order history */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={cardTitleStyle}>Order History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Order #</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Items</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Kitchen</th>
                  <th style={thStyle}>Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                      {order.orderNumber}
                    </td>
                    <td style={tdStyle}>{new Date(order.createdAt).toLocaleString()}</td>
                    <td style={{ ...tdStyle, maxWidth: 240 }}>{order.itemsSummary}</td>
                    <td style={tdStyle}>{formatNaira(order.totalAmount)}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(order.paymentStatus)}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(order.kitchenStatus)}>
                        {order.kitchenStatus}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(order.fulfillmentStatus)}>
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#E8621A',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  padding: 0,
  marginBottom: 20,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 600,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#666',
  fontSize: 14,
};

const editLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#E8621A',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 100,
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
  marginBottom: 12,
  fontFamily: 'inherit',
  resize: 'vertical',
};

const smallButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const smallSecondaryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#25D366',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const secondaryActionButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const removeTagButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  marginLeft: 4,
  fontWeight: 700,
  color: 'inherit',
};

const saveMessageStyle: React.CSSProperties = {
  color: '#027a48',
  fontSize: 13,
  marginTop: 8,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 12,
  marginTop: 20,
};

const statBoxStyle: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: 8,
  padding: '12px 14px',
};

const statLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: '#666',
};

const statValueStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 16,
  fontWeight: 700,
};

const subLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: '#666',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const productRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  fontSize: 14,
  borderBottom: '1px solid #f1f5f9',
};

const unpaidRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 14,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: 16,
};
