export type CommunityTown = 'OGIJO' | 'ITAOLUWO' | 'SHIMAWA' | 'ODONGUYAN' | 'LUKOSI';

export type CommunityMenuInterest = 'SMALL_CHOPS' | 'FINGER_FOODS' | 'PASTA' | 'DRINKS';

export interface CommunityMember {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  town: CommunityTown;
  menuInterest?: CommunityMenuInterest | null;
  welcomeSentAt?: string | null;
  welcomeSendError?: string | null;
  createdAt: string;
  updatedAt: string;
}
