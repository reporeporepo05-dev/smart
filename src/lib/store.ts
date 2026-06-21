import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  theme: 'light' | 'dark';
  setAuth: (token: string, username: string) => void;
  logout: () => void;
  toggleTheme: () => void;
}

export const useStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      theme: 'light',
      setAuth: (token, username) => set({ token, username }),
      logout: () => set({ token: null, username: null }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'sms-app-storage',
    }
  )
);
