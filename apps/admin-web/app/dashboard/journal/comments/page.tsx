'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { deleteJournalComment, getJournalComments, updateCommentStatus } from '@/services/journal.services';
import { CommentStatus, JournalComment } from '@/types/journal';

const STATUS_FILTERS: Array<{ label: string; value: CommentStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

export default function JournalCommentsPage() {
  const [comments, setComments] = useState<JournalComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<CommentStatus | 'ALL'>('PENDING');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError('');
      setComments(await getJournalComments());
    } catch (err) {
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleStatusChange = async (id: string, status: CommentStatus) => {
    try {
      setBusyId(id);
      await updateCommentStatus(id, status);
      await fetchComments();
    } catch (err) {
      alert('Failed to update comment status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment permanently?')) return;
    try {
      setBusyId(id);
      await deleteJournalComment(id);
      await fetchComments();
    } catch (err) {
      alert('Failed to delete comment');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === 'ALL' ? comments : comments.filter((c) => c.status === filter);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Journal Comments</h1>
          <p style={subtitleStyle}>Review comments before they show publicly on a post.</p>
        </div>
        <Link href="/dashboard/journal" style={backLinkStyle}>
          ← Back to Journal
        </Link>
      </div>

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
                {comments.filter((c) => c.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: '#888' }}>Loading comments…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && !error && filtered.length === 0 && (
        <p style={{ color: '#888' }}>No comments here.</p>
      )}

      <div style={listStyle}>
        {filtered.map((comment) => (
          <div key={comment.id} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <strong>{comment.authorName}</strong>
                <div style={metaStyle}>
                  on &ldquo;{comment.post.title}&rdquo; · {formatDate(comment.createdAt)}
                </div>
              </div>
              <span style={statusPillStyle(comment.status)}>{comment.status}</span>
            </div>

            <p style={bodyStyle}>{comment.body}</p>

            <div style={actionsRowStyle}>
              {comment.status !== 'PUBLISHED' && (
                <button
                  onClick={() => handleStatusChange(comment.id, 'PUBLISHED')}
                  disabled={busyId === comment.id}
                  style={publishBtnStyle}
                >
                  Publish
                </button>
              )}
              {comment.status !== 'REJECTED' && (
                <button
                  onClick={() => handleStatusChange(comment.id, 'REJECTED')}
                  disabled={busyId === comment.id}
                  style={rejectBtnStyle}
                >
                  {comment.status === 'PENDING' ? 'Reject' : 'Unpublish'}
                </button>
              )}
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={busyId === comment.id}
                style={deleteBtnStyle}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: 24 };

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 20,
  gap: 16,
};

const titleStyle: React.CSSProperties = { margin: 0, fontSize: 28 };
const subtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#666' };
const backLinkStyle: React.CSSProperties = { color: '#E8621A', textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap' };

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

const metaStyle: React.CSSProperties = { fontSize: 13, color: '#888', marginTop: 4 };

const bodyStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#333',
  lineHeight: 1.6,
  marginBottom: 14,
  whiteSpace: 'pre-wrap',
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

const rejectBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#b42318',
  border: '1px solid #f0b4ab',
  borderRadius: 8,
  cursor: 'pointer',
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#888',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

function statusPillStyle(status: CommentStatus): React.CSSProperties {
  const colors: Record<CommentStatus, { bg: string; fg: string }> = {
    PENDING: { bg: '#FEF3C7', fg: '#92400E' },
    PUBLISHED: { bg: '#DCFCE7', fg: '#166534' },
    REJECTED: { bg: '#F3F4F6', fg: '#4B5563' },
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
