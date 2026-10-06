'use client';

import React, { useEffect, useState } from 'react';

import { getReviews, updateReviewStatus } from '@/services/reviews.services';
import { OrderReview, ReviewStatus } from '@/types/review';

const STATUS_FILTERS: Array<{ label: string; value: ReviewStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Unpublished', value: 'UNPUBLISHED' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ReviewStatus | 'ALL'>('PENDING');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getReviews();
      setReviews(data);
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusChange = async (id: string, status: ReviewStatus) => {
    try {
      setBusyId(id);
      await updateReviewStatus(id, status);
      await fetchReviews();
    } catch (err) {
      alert('Failed to update review status');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === 'ALL' ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div style={pageStyle}>
      <div style={filterRowStyle}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={filter === f.value ? filterBtnActiveStyle : filterBtnStyle}
          >
            {f.label}
            {f.value !== 'ALL' && (
              <span style={countBadgeStyle}>
                {reviews.filter((r) => r.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: '#888' }}>Loading reviews…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && !error && filtered.length === 0 && (
        <p style={{ color: '#888' }}>No reviews here.</p>
      )}

      <div style={listStyle}>
        {filtered.map((review) => (
          <div key={review.id} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <div style={starsStyle}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                <div style={metaStyle}>
                  {review.order.customerName} · Order #{review.order.orderNumber} ·{' '}
                  {formatDate(review.createdAt)}
                </div>
              </div>
              <span style={statusPillStyle(review.status)}>{review.status}</span>
            </div>

            {review.comment && <p style={commentStyle}>&ldquo;{review.comment}&rdquo;</p>}

            <div style={actionsRowStyle}>
              {review.status !== 'PUBLISHED' && (
                <button
                  onClick={() => handleStatusChange(review.id, 'PUBLISHED')}
                  disabled={busyId === review.id}
                  style={publishBtnStyle}
                >
                  Publish
                </button>
              )}
              {review.status !== 'UNPUBLISHED' && (
                <button
                  onClick={() => handleStatusChange(review.id, 'UNPUBLISHED')}
                  disabled={busyId === review.id}
                  style={unpublishBtnStyle}
                >
                  {review.status === 'PENDING' ? 'Decline' : 'Unpublish'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: 24 };

const filterRowStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 20 };

const filterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#555',
  border: '1px solid #d1d5db',
  borderRadius: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const filterBtnActiveStyle: React.CSSProperties = {
  ...filterBtnStyle,
  background: '#1C4A1C',
  color: '#fff',
  borderColor: '#1C4A1C',
};

const countBadgeStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.1)',
  borderRadius: 10,
  padding: '1px 7px',
  fontSize: 11,
};

const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14 };

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  padding: 20,
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 10,
};

const starsStyle: React.CSSProperties = { color: '#D9A441', fontSize: 16, letterSpacing: 2 };

const metaStyle: React.CSSProperties = { fontSize: 13, color: '#888', marginTop: 4 };

const commentStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#333',
  lineHeight: 1.6,
  marginBottom: 14,
};

const actionsRowStyle: React.CSSProperties = { display: 'flex', gap: 10 };

const publishBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const unpublishBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#b42318',
  border: '1px solid #f0b4ab',
  borderRadius: 8,
  cursor: 'pointer',
};

function statusPillStyle(status: ReviewStatus): React.CSSProperties {
  const colors: Record<ReviewStatus, { bg: string; fg: string }> = {
    PENDING: { bg: '#FEF3C7', fg: '#92400E' },
    PUBLISHED: { bg: '#DCFCE7', fg: '#166534' },
    UNPUBLISHED: { bg: '#F3F4F6', fg: '#4B5563' },
  };
  const c = colors[status];
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    padding: '4px 10px',
    borderRadius: 12,
    background: c.bg,
    color: c.fg,
    whiteSpace: 'nowrap',
  };
}
