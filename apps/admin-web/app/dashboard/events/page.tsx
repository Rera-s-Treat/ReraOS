'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { createEvent, getEvents } from '@/services/events.services';
import { RerraEvent } from '@/types/event';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#666',
  PUBLISHED: '#027a48',
  CLOSED: '#b54708',
  CANCELLED: '#b42318',
  COMPLETED: '#3b4b66',
};

const PUBLIC_SITE_ORIGIN = 'https://rerastreat.com.ng';

interface CreateFormState {
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  location: string;
  capacity: string;
  interestOptions: string;
}

const emptyForm: CreateFormState = {
  title: '',
  slug: '',
  description: '',
  eventDate: '',
  location: '',
  capacity: '',
  interestOptions: 'Small chops\nYam fries & sauce\nPeppered beef\nPeppered chicken\nEverything!',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function EventsPage() {
  const [events, setEvents] = useState<RerraEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError('');
      setEvents(await getEvents());
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.slug.trim()) {
      setFormError('Title and URL slug are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      await createEvent({
        title: form.title.trim(),
        slug: slugify(form.slug),
        description: form.description.trim() || undefined,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
        location: form.location.trim() || undefined,
        capacity: form.capacity.trim() ? Number(form.capacity) : undefined,
        interestOptions: form.interestOptions
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      });

      setForm(emptyForm);
      setSlugTouched(false);
      setShowCreate(false);
      fetchEvents();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Rera Events</h1>
          <p style={subtitleStyle}>
            Tastings, previews and customer events — create one, share the public link, and
            watch RSVPs come in.
          </p>
        </div>
        <button style={createBtnStyle} onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={createFormStyle}>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label>Event Title</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Rera's Treat Preview Tasting"
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
                placeholder="preview-tasting"
                style={inputStyle}
              />
              <span style={hintStyle}>
                {PUBLIC_SITE_ORIGIN}/events/{form.slug || 'slug'}
              </span>
            </div>
          </div>

          <div style={fieldStyle}>
            <label>Intro copy shown to customers</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="You've been following us while we've been getting ready. Now we'd love you to be among the first to taste what we've been working on."
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            />
          </div>

          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label>Date &amp; time</label>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Ogijo, Ogun State"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label>Guest capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                placeholder="Leave blank for unlimited"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label>&quot;What are you most excited to try?&quot; options (one per line)</label>
            <textarea
              value={form.interestOptions}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, interestOptions: e.target.value }))
              }
              style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
            />
          </div>

          {formError && <p style={{ color: 'red', marginBottom: 12 }}>{formError}</p>}

          <button type="submit" disabled={isSubmitting} style={submitBtnStyle}>
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
          <p style={hintStyle}>
            New events start as Draft. Open the event afterwards to publish it and start
            collecting RSVPs.
          </p>
        </form>
      )}

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p style={{ padding: 16 }}>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={{ padding: 16 }}>No events yet. Create your first one above.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>RSVPs</th>
                <th style={thStyle}>Public link</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/events/${event.id}`} style={linkStyle}>
                      {event.title}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: STATUS_COLOR[event.status] ?? '#666' }}>
                      {event.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {event.eventDate ? new Date(event.eventDate).toLocaleString() : '—'}
                  </td>
                  <td style={tdStyle}>
                    {event._count?.rsvps ?? 0}
                    {event.capacity ? ` / ${event.capacity}` : ''}
                  </td>
                  <td style={tdStyle}>
                    <a
                      href={`${PUBLIC_SITE_ORIGIN}/events/${event.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={linkStyle}
                    >
                      /events/{event.slug}
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
