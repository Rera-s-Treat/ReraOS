'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { createJournalPost, getJournalPosts } from '@/services/journal.services';
import { JournalPost } from '@/types/journal';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#666',
  PUBLISHED: '#027a48',
  UNPUBLISHED: '#b42318',
};

const PUBLIC_SITE_ORIGIN = 'https://rerastreat.com.ng';

interface CreateFormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
}

const emptyForm: CreateFormState = { title: '', slug: '', excerpt: '', body: '' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function JournalPage() {
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError('');
      setPosts(await getJournalPosts());
    } catch (err) {
      setError('Failed to load journal posts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.slug.trim() || !form.body.trim()) {
      setFormError('Title, slug and body are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      await createJournalPost({
        title: form.title.trim(),
        slug: slugify(form.slug),
        excerpt: form.excerpt.trim() || undefined,
        body: form.body.trim(),
        status: 'DRAFT',
        coverImage: coverImage ?? undefined,
      });

      setForm(emptyForm);
      setSlugTouched(false);
      setCoverImage(null);
      setShowCreate(false);
      fetchPosts();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to create journal post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Journal</h1>
          <p style={subtitleStyle}>
            Write posts for the website&apos;s journal — only published posts are publicly visible.
          </p>
        </div>
        <button style={createBtnStyle} onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={createFormStyle}>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label>Title</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="How Many Small Chops for 100 Guests?"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label>URL slug</label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="how-many-small-chops-for-100-guests"
                style={inputStyle}
              />
              <span style={hintStyle}>
                {PUBLIC_SITE_ORIGIN}/journal/{form.slug || 'slug'}
              </span>
            </div>
          </div>

          <div style={fieldStyle}>
            <label>Excerpt (shown on the journal list page)</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            />
          </div>

          <div style={fieldStyle}>
            <label>Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Write the post here..."
              style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }}
            />
          </div>

          <div style={fieldStyle}>
            <label>Cover photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              style={inputStyle}
            />
          </div>

          {formError && <p style={{ color: 'red', marginBottom: 12 }}>{formError}</p>}

          <button type="submit" disabled={isSubmitting} style={submitBtnStyle}>
            {isSubmitting ? 'Creating...' : 'Create Post (as Draft)'}
          </button>
          <p style={hintStyle}>
            New posts start as Draft. Open the post afterwards to publish it.
          </p>
        </form>
      )}

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p style={{ padding: 16 }}>Loading journal posts...</p>
        ) : posts.length === 0 ? (
          <p style={{ padding: 16 }}>No journal posts yet. Create your first one above.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Published</th>
                <th style={thStyle}>Public link</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/journal/${post.id}`} style={linkStyle}>
                      {post.title}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: STATUS_COLOR[post.status] ?? '#666' }}>
                      {post.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={tdStyle}>
                    <a
                      href={`${PUBLIC_SITE_ORIGIN}/journal/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={linkStyle}
                    >
                      /journal/{post.slug}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
const subtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#666', maxWidth: 560 };

const createBtnStyle: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: 14,
  fontWeight: 600,
  background: '#E8621A',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const createFormStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  padding: 24,
  marginBottom: 20,
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

const tableWrapperStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  overflowX: 'auto',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };

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

const linkStyle: React.CSSProperties = { color: '#E8621A', textDecoration: 'none' };

const errorStyle: React.CSSProperties = { color: 'red', marginBottom: 16 };
