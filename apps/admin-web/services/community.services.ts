import axiosInstance from './axios';
import { CommunityMember } from '../types/community';

export const getCommunityMembers = async (): Promise<CommunityMember[]> => {
  const response = await axiosInstance.get('/community');
  return response.data;
};
