import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    roleId: string;
    status: string;
  };
}

export interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function getMe(token: string): Promise<MeResponse> {
  const response = await api.get<MeResponse>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function logout(token: string) {
  const response = await api.post(
    '/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function getUsers(token: string): Promise<UserListItem[]> {
  const response = await api.get<UserListItem[]>('/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
