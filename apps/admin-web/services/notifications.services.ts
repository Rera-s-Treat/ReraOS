import axiosInstance from './axios';
import { AppNotification } from '../types/notification';

export const getNotifications = async (
  unreadOnly = false,
  limit = 50,
): Promise<AppNotification[]> => {
  const response = await axiosInstance.get('/notifications', {
    params: { unreadOnly: unreadOnly || undefined, limit },
  });
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response.data.count;
};

export const markNotificationRead = async (id: string): Promise<AppNotification> => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosInstance.patch('/notifications/read-all');
};
