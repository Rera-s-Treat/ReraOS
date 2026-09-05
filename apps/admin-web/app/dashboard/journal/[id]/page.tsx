'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  deleteJournalPost,
  getJournalImageUrl,
  getJournalPostById,
  updateJournalPost,
} from '@/services/journal.services';
import { JournalPost, JournalStatus } from '@/types/journal';

const PUBLIC_SITE_ORIGIN = 'https://rerastreat.com.ng';
const STATUS_OPTIONS: JournalStatus[] = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'];

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: JournalStatus;
}

export default function JournalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params?.id;

  const [post, setPost] = useState<JournalPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const fetchPost = async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await getJournalPostById(postId);
      setPost(data);
      setForm({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? '',
        body: data.body,
        status: data.status,
      });
    } catch (err) {
      setError('Failed to load journal post');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !form) return;

    try {
      setIsSaving(true);
      setSaveError('');

      await updateJournalPost(postId, {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || undefined,
        body: form.body.trim(),
        status: form.status,
        coverImage: coverImage ?? undefined,
      });

      setSavedAt(Date.now());
      setCoverImage(null);
      fetchPost();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!confirm('Delete this journal post permanently? This cannot be undone.')) return;

    try {
      await deleteJournalPost(postId);
      router.push('/dashboard/journal');
    } catch (err) {
      console.error(err);
      alert('Failed to delete journal post');
    }
  };

  if (isLoading || !form) {
    return <div style={pageStyle}>{error || 'Loading post...'}</div>;
  }

  if (!post) {
    return <div style={pageStyle}>{error}</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{post.title}</h1>
          {post.status === 'PUBLISHED' && (
            <a
              href={`${PUBLIC_SITE_ORIGIN}/journal/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              {PUBLIC_SITE_ORIGIN}/journal/{post.slug}
            </a>
          )}
        </div>
        <button type="button" onClick={handleDelete} style={deleteBtnStyle}>
          Delete Post
        </button>
      </div>

      <form onSubmit={handleSave} style={cardStyle}>
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => prev && { ...prev, title: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => prev && { ...prev, status: e.target.value as JournalStatus })
              }
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={fieldStyle}>
          <label>URL slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((prev) => prev && { ...prev, slug: e.target.value })}
            style={inputStyle}
          />
          <span style={hintStyle}>
            {PUBLIC_SITE_ORIGIN}/journal/{form.slug}
          </span>
        </div>

        <div style={fieldStyle}>
          <label>Excerpt (shown on the journal list page)</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((prev) => prev && { ...prev, excerpt: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />
        </div>

        <div style={fieldStyle}>
          <label>Body</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((prev) => prev && { ...prev, body: e.target.value })}
            style={{ ...inputStyle, minHeight: 280, resize: 'vertical' }}
          />
        </div>

        <div style={fieldStyle}>
          <label>Cover photo</label>
          {post.coverImage && !coverImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getJournalImageUrl(post.coverImage)}
              alt=""
              style={{ maxWidth: 240, borderRadius: 8, marginBottom: 8, display: 'block' }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
        </div>

        {saveError && <p style={{ color: 'red', marginBottom: 12 }}>{saveError}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" disabled={isSaving} style={submitBtnStyle}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {savedAt && <span style={{ color: '#027a48', fontSize: 13 }}>Saved</span>}
        </div>
      </form>
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
  flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = { margin: '0 0 4px', fontSize: 26 };
const linkStyle: React.CSSProperties = { color: '#E8621A', textDecoration: 'none', fontSize: 14 };

const deleteBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#b42318',
  border: '1px solid #f0b4ab',
  borderRadius: 8,
  cursor: 'pointer',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  padding: 24,
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

const hintStyle: React.CSSProperties = { fontSize: 12, color: '#888' };

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
