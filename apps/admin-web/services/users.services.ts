import axiosInstance from './axios';
import { CreateUserPayload, UpdateUserPayload, User } from '../types/user';

export const getUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get('/users');
  return response.data;
};

export const createUser = async (
  payload: CreateUserPayload,
): Promise<User> => {
  const response = await axiosInstance.post('/users', payload);
  return response.data;
};

export const updateUser = async (
  id: string,
  payload: UpdateUserPayload,
): Promise<User> => {
  const response = await axiosInstance.patch(`/users/${id}`, payload);
  return response.data;
};