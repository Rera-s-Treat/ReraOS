import axiosInstance from './axios';

export interface ForgotPasswordResponse {
  message: string;
}

export const forgotPassword = async (
  email: string,
): Promise<ForgotPasswordResponse> => {
  const response = await axiosInstance.post('/auth/forgot-password', {
    email,
  });
  return response.data;
};

export interface ResetPasswordResponse {
  message: string;
}

export const resetPassword = async (
  token: string,
  password: string,
): Promise<ResetPasswordResponse> => {
  const response = await axiosInstance.post('/auth/reset-password', {
    token,
    password,
  });
  return response.data;
};
