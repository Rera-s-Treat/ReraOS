'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { getEventById, updateEvent, updateRsvp } from '@/services/events.services';
import { EventRsvp, EventStatus, RerraEvent, RsvpAttendanceStatus } from '@/types/event';

const PUBLIC_SITE_ORIGIN = 'https://rerastreat.com.ng';

const STATUS_OPTIONS: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'COMPLETED'];
const ATTENDANCE_OPTIONS: RsvpAttendanceStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ATTENDED',
  'NO_SHOW',
  'CANCELLED',
];

interface FormState {
  title: string;
  description: string;
  bodyText: string;
  eventDate: string;
  location: string;
  capacity: string;
  rsvpOpen: boolean;
  status: EventStatus;
  interestOptions: string;
}

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;

  const [event, setEvent] = useState<RerraEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const fetchEvent = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await getEventById(eventId);
      setEvent(data);
      setForm({
        title: data.title,
        description: data.description ?? '',
        bodyText: data.bodyText ?? '',
        eventDate: toDatetimeLocal(data.eventDate),
        location: data.location ?? '',
        capacity: data.capacity ? String(data.capacity) : '',
        rsvpOpen: data.rsvpOpen,
        status: data.status,
        interestOptions: (data.interestOptions ?? []).join('\n'),
      });
    } catch (err) {
      setError('Failed to load event');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !form) return;

    try {
      setIsSaving(true);
      setSaveError('');

      await updateEvent(eventId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        bodyText: form.bodyText.trim() || undefined,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
        location: form.location.trim() || undefined,
        capacity: form.capacity.trim() ? Number(form.capacity) : undefined,
        rsvpOpen: form.rsvpOpen,
        status: form.status,
        interestOptions: form.interestOptions
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      });

      setSavedAt(Date.now());
      fetchEvent();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRsvpUpdate = async (rsvp: EventRsvp, changes: Partial<EventRsvp>) => {
    if (!eventId) return;
    try {
      await updateRsvp(eventId, rsvp.id, {
        attendanceStatus: changes.attendanceStatus,
        feedback: changes.feedback ?? undefined,
        feedbackRating: changes.feedbackRating ?? undefined,
      });
      fetchEvent();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !form) {
    return <div style={pageStyle}>{error || 'Loading event...'}</div>;
  }

  if (!event) {
    return <div style={pageStyle}>{error}</div>;
  }

  const rsvps = event.rsvps ?? [];
  const totalAttending = rsvps.reduce((sum, r) => sum + r.numberAttending, 0);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{event.title}</h1>
          <a
            href={`${PUBLIC_SITE_ORIGIN}/events/${event.slug}`}
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            {PUBLIC_SITE_ORIGIN}/events/{event.slug}
          </a>
        </div>
        <div style={statsStyle}>
          <div>
            <strong>{rsvps.length}</strong> RSVPs
          </div>
          <div>
            <strong>{totalAttending}</strong> attending
            {event.capacity ? ` / ${event.capacity} capacity` : ''}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={cardStyle}>
        <h2 style={sectionTitleStyle}>Event details, capacity &amp; RSVP settings</h2>

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
                setForm((prev) => prev && { ...prev, status: e.target.value as EventStatus })
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
          <label>Intro copy shown to customers</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, description: e.target.value })
            }
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
          />
        </div>

        <div style={fieldStyle}>
          <label>Extra body text (optional, shown below the intro)</label>
          <textarea
            value={form.bodyText}
            onChange={(e) => setForm((prev) => prev && { ...prev, bodyText: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />
        </div>

        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label>Date &amp; time</label>
            <input
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) =>
                setForm((prev) => prev && { ...prev, eventDate: e.target.value })
              }
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label>Location</label>
            <input
              value={form.location}
              onChange={(e) =>
                setForm((prev) => prev && { ...prev, location: e.target.value })
              }
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label>Guest capacity</label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) =>
                setForm((prev) => prev && { ...prev, capacity: e.target.value })
              }
              placeholder="Leave blank for unlimited"
              style={inputStyle}
            />
          </div>
        </div>

        <label style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={form.rsvpOpen}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, rsvpOpen: e.target.checked })
            }
          />
          RSVPs open (turn off to stop accepting new responses)
        </label>

        <div style={fieldStyle}>
          <label>&quot;What are you most excited to try?&quot; options (one per line)</label>
          <textarea
            value={form.interestOptions}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, interestOptions: e.target.value })
            }
            style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
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

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Responses, attendance &amp; feedback</h2>

        {rsvps.length === 0 ? (
          <p style={{ color: '#666' }}>No RSVPs yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Attending</th>
                  <th style={thStyle}>Interests</th>
                  <th style={thStyle}>Dietary</th>
                  <th style={thStyle}>Heard via</th>
                  <th style={thStyle}>Attendance</th>
                  <th style={thStyle}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => (
                  <RsvpRow key={rsvp.id} rsvp={rsvp} onUpdate={handleRsvpUpdate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RsvpRow({
  rsvp,
  onUpdate,
}: {
  rsvp: EventRsvp;
  onUpdate: (rsvp: EventRsvp, changes: Partial<EventRsvp>) => void;
}) {
  const [feedback, setFeedback] = useState(rsvp.feedback ?? '');

  return (
    <tr>
      <td style={tdStyle}>{rsvp.name}</td>
      <td style={tdStyle}>{rsvp.email || rsvp.phone || '—'}</td>
      <td style={tdStyle}>{rsvp.numberAttending}</td>
      <td style={tdStyle}>{rsvp.interests.join(', ') || '—'}</td>
      <td style={tdStyle}>{rsvp.dietaryNote || '—'}</td>
      <td style={tdStyle}>{rsvp.hearAboutUs || '—'}</td>
      <td style={tdStyle}>
        <select
          value={rsvp.attendanceStatus}
          onChange={(e) =>
            onUpdate(rsvp, { attendanceStatus: e.target.value as RsvpAttendanceStatus })
          }
          style={selectSmallStyle}
        >
          {ATTENDANCE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td style={tdStyle}>
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onBlur={() => {
            if (feedback !== (rsvp.feedback ?? '')) {
              onUpdate(rsvp, { feedback });
            }
          }}
          placeholder="Add feedback"
          style={{ ...inputStyle, minWidth: 160 }}
        />
      </td>
    </tr>
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

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  fontSize: 14,
  color: '#444',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  padding: 24,
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = { marginTop: 0, fontSize: 18 };

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

const selectSmallStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '8px 10px',
  fontSize: 13,
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
};

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

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };

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
