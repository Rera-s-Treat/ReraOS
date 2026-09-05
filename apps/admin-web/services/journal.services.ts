import axiosInstance from './axios';
import { JournalPost, JournalPostFormPayload } from '../types/journal';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const getJournalImageUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

export const getJournalPosts = async (): Promise<JournalPost[]> => {
  const response = await axiosInstance.get('/journal');
  return response.data;
};

export const getJournalPostById = async (id: string): Promise<JournalPost> => {
  const response = await axiosInstance.get(`/journal/${id}`);
  return response.data;
};

function buildFormData(payload: JournalPostFormPayload): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('slug', payload.slug);
  if (payload.excerpt) formData.append('excerpt', payload.excerpt);
  formData.append('body', payload.body);
  if (payload.status) formData.append('status', payload.status);
  if (payload.coverImage) formData.append('coverImage', payload.coverImage);
  if (payload.removeCoverImage) formData.append('removeCoverImage', 'true');
  return formData;
}

export const createJournalPost = async (
  payload: JournalPostFormPayload,
): Promise<JournalPost> => {
  const response = await axiosInstance.post('/journal', buildFormData(payload));
  return response.data;
};

export const updateJournalPost = async (
  id: string,
  payload: JournalPostFormPayload,
): Promise<JournalPost> => {
  const response = await axiosInstance.patch(`/journal/${id}`, buildFormData(payload));
  return response.data;
};

export const deleteJournalPost = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/journal/${id}`);
};
