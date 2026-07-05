import axiosInstance from './axios';
import { Role } from '../types/role';

export const getRoles = async (): Promise<Role[]> => {
  const response = await axiosInstance.get('/roles');
  return response.data;
};