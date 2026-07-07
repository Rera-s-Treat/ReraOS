import axiosInstance from './axios';
import {
  Customer,
  CustomerDetail,
  CustomerFilters,
  UpdateCustomerPayload,
} from '../types/customer';

export const getCustomers = async (
  filters?: CustomerFilters,
): Promise<Customer[]> => {
  const response = await axiosInstance.get('/customers', { params: filters });
  return response.data;
};

export const getCustomerDetail = async (
  phone: string,
): Promise<CustomerDetail> => {
  const response = await axiosInstance.get(`/customers/${phone}`);
  return response.data;
};

export const updateCustomer = async (
  phone: string,
  payload: UpdateCustomerPayload,
): Promise<Customer> => {
  const response = await axiosInstance.patch(`/customers/${phone}`, payload);
  return response.data;
};
