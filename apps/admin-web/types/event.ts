export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';

export type RsvpAttendanceStatus = 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';

export interface EventRsvp {
  id: string;
  eventId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  numberAttending: number;
  dietaryNote?: string | null;
  hearAboutUs?: string | null;
  interests: string[];
  attendanceStatus: RsvpAttendanceStatus;
  feedback?: string | null;
  feedbackRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RerraEvent {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  bodyText?: string | null;
  eventDate?: string | null;
  location?: string | null;
  capacity?: number | null;
  rsvpOpen: boolean;
  status: EventStatus;
  interestOptions: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { rsvps: number };
  rsvps?: EventRsvp[];
}

export interface CreateEventPayload {
  title: string;
  slug: string;
  description?: string;
  bodyText?: string;
  eventDate?: string;
  location?: string;
  capacity?: number;
  rsvpOpen?: boolean;
  status?: EventStatus;
  interestOptions?: string[];
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface UpdateRsvpPayload {
  attendanceStatus?: RsvpAttendanceStatus;
  feedback?: string;
  feedbackRating?: number;
}
