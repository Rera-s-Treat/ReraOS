import axiosInstance from './axios';
import {
  CreateEventPayload,
  RerraEvent,
  UpdateEventPayload,
  UpdateRsvpPayload,
} from '../types/event';

export const getEvents = async (): Promise<RerraEvent[]> => {
  const response = await axiosInstance.get('/events');
  return response.data;
};

export const getEventById = async (id: string): Promise<RerraEvent> => {
  const response = await axiosInstance.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (payload: CreateEventPayload): Promise<RerraEvent> => {
  const response = await axiosInstance.post('/events', payload);
  return response.data;
};

export const updateEvent = async (
  id: string,
  payload: UpdateEventPayload,
): Promise<RerraEvent> => {
  const response = await axiosInstance.patch(`/events/${id}`, payload);
  return response.data;
};

export const updateRsvp = async (
  eventId: string,
  rsvpId: string,
  payload: UpdateRsvpPayload,
) => {
  const response = await axiosInstance.patch(
    `/events/${eventId}/rsvps/${rsvpId}`,
    payload,
  );
  return response.data;
};
