export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  status?: string;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  roleId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: UserRole;
}