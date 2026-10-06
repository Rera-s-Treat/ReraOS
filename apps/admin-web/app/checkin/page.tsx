'use client';

import React, { useEffect, useState } from 'react';

import { clockIn, clockOut, getCheckinRoster } from '@/services/staff.services';
import { RosterEntry } from '@/types/staff';

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

export default function CheckinPage() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRoster = async () => {
    try {
      setError('');
      const data = await getCheckinRoster();
      setRoster(data);
    } catch (err) {
      setError('Could not load the staff list. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const selected = roster.find((r) => r.id === selectedId) ?? null;

  const handleClockIn = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      setMessage('');
      await clockIn(selected.id);
      setMessage(`${selected.fullName} clocked in. Have a great shift!`);
      setSelectedId('');
      await fetchRoster();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Could not clock in. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      setMessage('');
      await clockOut(selected.id);
      setMessage(`${selected.fullName} clocked out. See you next time!`);
      setSelectedId('');
      await fetchRoster();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Could not clock out. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={brandStyle}>
          Rera&apos;s <span style={{ color: '#E8621A' }}>Treat</span>
        </div>
        <h1 style={titleStyle}>Staff Check-in</h1>

        {isLoading && <p style={mutedStyle}>Loading staff list…</p>}
        {error && <p style={errorStyle}>{error}</p>}

        {!isLoading && !error && (
          <>
            <label style={labelStyle}>Select your name</label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setMessage('');
              }}
              style={selectStyle}
            >
              <option value="">— Choose your name —</option>
              {roster.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.fullName}
                  {entry.clockedOutAt ? ' (done for today)' : entry.clockedInAt ? ' (clocked in)' : ''}
                </option>
              ))}
            </select>

            {selected && (
              <div style={statusBoxStyle}>
                {selected.clockedInAt && (
                  <p style={statusLineStyle}>Clocked in at {formatTime(selected.clockedInAt)}</p>
                )}
                {selected.clockedOutAt && (
                  <p style={statusLineStyle}>Clocked out at {formatTime(selected.clockedOutAt)}</p>
                )}
                {!selected.clockedInAt && <p style={statusLineStyle}>Not clocked in yet today</p>}
              </div>
            )}

            <div style={buttonRowStyle}>
              <button
                type="button"
                onClick={handleClockIn}
                disabled={!selected || !!selected.clockedInAt || isSubmitting}
                style={{
                  ...clockInBtnStyle,
                  opacity: !selected || !!selected.clockedInAt || isSubmitting ? 0.5 : 1,
                }}
              >
                Clock In
              </button>
              <button
                type="button"
                onClick={handleClockOut}
                disabled={!selected || !selected.clockedInAt || !!selected.clockedOutAt || isSubmitting}
                style={{
                  ...clockOutBtnStyle,
                  opacity:
                    !selected || !selected.clockedInAt || !!selected.clockedOutAt || isSubmitting
                      ? 0.5
                      : 1,
                }}
              >
                Clock Out
              </button>
            </div>

            {message && <p style={messageStyle}>{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#FBF3E7',
  padding: 24,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  borderRadius: 16,
  padding: '32px 28px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  textAlign: 'center',
};

const brandStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#1C4A1C',
  marginBottom: 4,
};

const titleStyle: React.CSSProperties = { fontSize: 22, margin: '0 0 24px', color: '#1A1A1A' };

const mutedStyle: React.CSSProperties = { color: '#888', fontSize: 14 };

const errorStyle: React.CSSProperties = { color: '#b42318', fontSize: 14 };

const labelStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: '#555',
  marginBottom: 8,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  fontSize: 16,
  border: '1px solid #d1d5db',
  borderRadius: 10,
  outline: 'none',
  marginBottom: 16,
};

const statusBoxStyle: React.CSSProperties = {
  background: '#F9FAFB',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 16,
};

const statusLineStyle: React.CSSProperties = { fontSize: 13, color: '#555', margin: 0 };

const buttonRowStyle: React.CSSProperties = { display: 'flex', gap: 12 };

const clockInBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  fontSize: 16,
  fontWeight: 700,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
};

const clockOutBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  fontSize: 16,
  fontWeight: 700,
  background: '#E8621A',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
};

const messageStyle: React.CSSProperties = { marginTop: 16, fontSize: 14, color: '#1C4A1C' };
