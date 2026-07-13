'use client';

import React, { useEffect, useState } from 'react';
import { Logo } from '../../components/brand/Logo';
import { PRODUCT_CATEGORY_LABELS, Product, ProductCategory } from '../../types/product';
import { Order, OrderType } from '../../types/order';
import {
  CartItem,
  PaymentAccount,
  WhatsappSession,
} from '../../types/whatsapp-session';
import { getProductImageUrl } from '../../services/products.services';
import {
  checkoutSession,
  getMenu,
  getSession,
  markPaymentPaid,
  startSession,
  updateSession,
} from '../../services/whatsapp-sessions.services';

const STORAGE_KEY = 'reraos_order_session_id';

type Phase = 'phone' | 'menu' | 'details' | 'review' | 'payment' | 'done';

export default function PublicOrderPage() {
  const [phase, setPhase] = useState<Phase>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>(
    'ALL',
  );

  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    null,
  );

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;

    (async () => {
      try {
        const session = await getSession(savedId);
        resumeFromSession(session);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    })();
  }, []);

  function resumeFromSession(session: WhatsappSession) {
    setSessionId(session.id);

    if (session.order) {
      setOrder(session.order);
      setPhase(session.order.paymentClaimedAt ? 'done' : 'payment');
      return;
    }

    const cartMap: Record<string, number> = {};
    (session.cartJson ?? []).forEach((item) => {
      cartMap[item.productId] = item.quantity;
    });
    setCart(cartMap);
    setCustomerName(session.customerName ?? '');
    if (session.orderType) setOrderType(session.orderType);
    setDeliveryAddress(session.deliveryAddress ?? '');
    setNotes(session.notes ?? '');
    setPhase('menu');
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();

    if (!phoneInput.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const session = await startSession({
        customerPhone: phoneInput.trim(),
        customerName: nameInput.trim() || undefined,
      });

      localStorage.setItem(STORAGE_KEY, session.id);
      setSessionId(session.id);
      setCustomerName(session.customerName ?? nameInput.trim());

      if (session.order) {
        setOrder(session.order);
        setPhase(session.order.paymentClaimedAt ? 'done' : 'payment');
        return;
      }

      const menu = await getMenu();
      setProducts(menu);
      setPhase('menu');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to start your order');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (phase !== 'menu' || products.length > 0) return;

    (async () => {
      try {
        const menu = await getMenu();
        setProducts(menu);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load the menu');
      }
    })();
  }, [phase, products.length]);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = products.find((p) => p.id === productId);
    return sum + (product ? Number(product.price) * qty : 0);
  }, 0);

  const visibleProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const cartProductCategories = new Set(
    Object.keys(cart)
      .map((productId) => products.find((p) => p.id === productId)?.category)
      .filter(Boolean),
  );
  const showDrinksNudge =
    (cartProductCategories.has('PLATTERS') ||
      cartProductCategories.has('WHOLE_MEALS')) &&
    !cartProductCategories.has('DRINKS');

  function setQuantity(productId: string, quantity: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }
      return next;
    });
  }

  async function handleContinueFromMenu() {
    if (!sessionId) return;

    if (cartCount === 0) {
      setError('Add at least one item to continue');
      return;
    }

    const cartItems: CartItem[] = Object.entries(cart).map(
      ([productId, quantity]) => ({ productId, quantity }),
    );

    try {
      setLoading(true);
      setError('');
      await updateSession(sessionId, {
        cartItems,
        currentStep: 'COLLECTING_ORDER_TYPE',
      });
      setPhase('details');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save your cart');
    } finally {
      setLoading(false);
    }
  }

  async function handleContinueFromDetails() {
    if (!sessionId) return;

    if (!customerName.trim()) {
      setError('Your name is required');
      return;
    }

    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      setError('Delivery address is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await updateSession(sessionId, {
        customerName: customerName.trim(),
        orderType,
        deliveryAddress:
          orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        currentStep: 'REVIEWING_ORDER',
      });
      setPhase('review');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save your details');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError('');
      const result = await checkoutSession(sessionId);
      setOrder(result.order);
      setPaymentAccount(result.paymentAccount);
      setPhase('payment');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to place your order');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError('');
      const updatedOrder = await markPaymentPaid(sessionId);
      setOrder(updatedOrder);
      setPhase('done');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update your order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <Logo style={{ height: 64, margin: '0 auto 16px', display: 'block' }} />
        <h1 style={titleStyle}>Place an Order</h1>

        {error && <p style={errorStyle}>{error}</p>}

        {phase === 'phone' && (
          <form onSubmit={handleStart}>
            <div style={fieldStyle}>
              <label>Phone Number</label>
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+2348012345678"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Name (optional)</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Starting...' : 'Start Order'}
            </button>
          </form>
        )}

        {phase === 'menu' && (
          <div>
            <p style={subtitleStyle}>Tap + to add items to your order.</p>

            <div style={categoryTabsRowStyle}>
              {(['ALL', ...Object.keys(PRODUCT_CATEGORY_LABELS)] as Array<
                ProductCategory | 'ALL'
              >).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    ...categoryTabStyle,
                    ...(selectedCategory === category
                      ? categoryTabActiveStyle
                      : {}),
                  }}
                >
                  {category === 'ALL' ? 'All' : PRODUCT_CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>

            {showDrinksNudge && (
              <div style={nudgeBannerStyle}>🥤 Don&apos;t forget the drinks!</div>
            )}

            {products.length === 0 ? (
              <p>Loading menu...</p>
            ) : visibleProducts.length === 0 ? (
              <p>No items in this category.</p>
            ) : (
              visibleProducts.map((product) => (
                <div key={product.id} style={menuRowStyle}>
                  <div style={menuItemInfoStyle}>
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getProductImageUrl(product.images[0])}
                        alt=""
                        style={menuThumbnailStyle}
                      />
                    ) : (
                      <div style={menuThumbnailPlaceholderStyle} />
                    )}

                    <div>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ color: '#666', fontSize: 13 }}>
                        {Number(product.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={stepperStyle}>
                    <button
                      type="button"
                      style={stepperBtnStyle}
                      onClick={() =>
                        setQuantity(product.id, (cart[product.id] ?? 0) - 1)
                      }
                    >
                      −
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center' }}>
                      {cart[product.id] ?? 0}
                    </span>
                    <button
                      type="button"
                      style={stepperBtnStyle}
                      onClick={() =>
                        setQuantity(product.id, (cart[product.id] ?? 0) + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}

            <p style={estimatedTotalStyle}>
              Cart: {cartCount} item{cartCount === 1 ? '' : 's'} —{' '}
              {cartTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <button
              type="button"
              onClick={handleContinueFromMenu}
              disabled={loading}
              style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {phase === 'details' && (
          <div>
            <div style={fieldStyle}>
              <label>Your Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Order Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                style={inputStyle}
              >
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup</option>
              </select>
            </div>

            {orderType === 'DELIVERY' && (
              <div style={fieldStyle}>
                <label>Delivery Address</label>
                <input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  style={inputStyle}
                />
              </div>
            )}

            <div style={fieldStyle}>
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions?"
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              />
            </div>

            <button
              type="button"
              onClick={handleContinueFromDetails}
              disabled={loading}
              style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Review Order'}
            </button>
          </div>
        )}

        {phase === 'review' && (
          <div>
            <h2 style={sectionTitleStyle}>Review Your Order</h2>

            {showDrinksNudge && (
              <div style={nudgeBannerStyle}>🥤 Don&apos;t forget the drinks!</div>
            )}

            {Object.entries(cart).map(([productId, qty]) => {
              const product = products.find((p) => p.id === productId);
              if (!product) return null;
              return (
                <div key={productId} style={reviewRowStyle}>
                  <span>
                    {product.name} × {qty}
                  </span>
                  <span>
                    {(Number(product.price) * qty).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              );
            })}

            <p style={estimatedTotalStyle}>
              Total:{' '}
              {cartTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
              {orderType === 'DELIVERY'
                ? `Delivery to: ${deliveryAddress}`
                : 'Pickup order'}
            </p>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        )}

        {phase === 'payment' && order && (
          <div>
            <h2 style={sectionTitleStyle}>Order Placed!</h2>
            <p style={{ marginBottom: 4 }}>
              Order number: <strong>{order.orderNumber}</strong>
            </p>
            <p style={{ marginBottom: 16 }}>
              Amount to pay:{' '}
              <strong>
                {Number(order.totalAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </p>

            {paymentAccount && (
              <div style={paymentBoxStyle}>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  Make payment into:
                </p>
                <p style={{ margin: '8px 0 0' }}>
                  {paymentAccount.bankName}
                </p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                  {paymentAccount.accountNumber}
                </p>
                <p style={{ margin: 0 }}>{paymentAccount.accountName}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={loading}
              style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Submitting...' : 'I have paid the money'}
            </button>
          </div>
        )}

        {phase === 'done' && order && (
          <div>
            <h2 style={sectionTitleStyle}>Thank you!</h2>
            <p>
              We've received your payment confirmation for order{' '}
              <strong>{order.orderNumber}</strong>. Our team will verify it
              shortly and get your order started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f7f8fa',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  background: '#ffffff',
  borderRadius: 12,
  padding: 32,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 20,
  fontSize: 26,
};

const subtitleStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 14,
  marginBottom: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 16,
  fontSize: 20,
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
  fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#E8621A',
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  marginBottom: 16,
};

const categoryTabsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
};

const categoryTabStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 999,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const categoryTabActiveStyle: React.CSSProperties = {
  background: '#E8621A',
  borderColor: '#E8621A',
  color: '#fff',
};

const nudgeBannerStyle: React.CSSProperties = {
  background: '#fef6e7',
  color: '#b45309',
  border: '1px solid #fde5b8',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 16,
};

const menuRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #f1f5f9',
};

const menuItemInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const menuThumbnailStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  objectFit: 'cover',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  flexShrink: 0,
};

const menuThumbnailPlaceholderStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 8,
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  flexShrink: 0,
};

const stepperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const stepperBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
};

const estimatedTotalStyle: React.CSSProperties = {
  fontWeight: 600,
  margin: '16px 0',
};

const reviewRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  fontSize: 14,
};

const paymentBoxStyle: React.CSSProperties = {
  background: '#f8f9fc',
  border: '1px solid #e4e7ec',
  borderRadius: 8,
  padding: 16,
  marginBottom: 20,
  textAlign: 'center',
};
