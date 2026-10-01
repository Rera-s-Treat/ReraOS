export type JournalStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export interface JournalPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  coverImage?: string | null;
  status: JournalStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalPostFormPayload {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  status?: JournalStatus;
  coverImage?: File;
  removeCoverImage?: boolean;
}

export type CommentStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED';

export interface JournalComment {
  id: string;
  authorName: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  post: { title: string; slug: string };
}
