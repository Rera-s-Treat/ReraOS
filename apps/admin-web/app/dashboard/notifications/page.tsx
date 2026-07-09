'use client';

import { useEffect, useState } from 'react';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.services';
import { AppNotification, NotificationCategory } from '@/types/notification';

const categoryOptions: NotificationCategory[] = ['ORDER', 'PAYMENT', 'INVENTORY', 'SYSTEM'];

function categoryBadgeStyle(category: NotificationCategory): React.CSSProperties {
  const colors: Record<NotificationCategory, { background: string; color: string }> = {
    ORDER: { background: '#eff6ff', color: '#1d4ed8' },
    PAYMENT: { background: '#fef6e7', color: '#b45309' },
    INVENTORY: { background: '#fef3f2', color: '#b42318' },
    SYSTEM: { background: '#f3f4f6', color: '#374151' },
  };

  return {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    ...colors[category],
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | ''>('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getNotifications(unreadOnly, 200);
      setNotifications(data);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  const filtered = categoryFilter
    ? notifications.filter((n) => n.category === categoryFilter)
    : notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as NotificationCategory | '')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-(--color-brand-orange)"
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="rounded-md bg-(--color-brand-green) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Mark all read
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No notifications found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start justify-between gap-4 px-6 py-4 ${
                  notification.isRead ? '' : 'bg-(--color-brand-pale-orange)'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span style={categoryBadgeStyle(notification.category)}>
                      {notification.category}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
