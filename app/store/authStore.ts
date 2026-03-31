import { create } from 'zustand';

export interface AuthUser {
  id: string;
  company_id: string;
  employee_id: string;
  role: "admin" | "manager" | "employee" | string;
}

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isRestoring: boolean;
  setAuth: (data: { accessToken: string; user: AuthUser }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isRestoring: false,
  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
