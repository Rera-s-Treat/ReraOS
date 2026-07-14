'use client';

import { createContext, useContext } from 'react';
import { MeResponse } from '@/lib/api';

interface CurrentUserContextValue {
  user: MeResponse | null;
  isSuperAdmin: boolean;
}

export const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  isSuperAdmin: false,
});

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
