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

export interface TestSmsResult {
  success: boolean;
  error: string | null;
  providerResponse: string | null;
  recipient: string;
  sender: string;
  apiKeyConfigured: boolean;
}

export const sendTestSms = async (
  phone: string,
  message?: string,
): Promise<TestSmsResult> => {
  const response = await axiosInstance.post('/notifications/test-sms', {
    phone,
    message: message || undefined,
  });
  return response.data;
};
