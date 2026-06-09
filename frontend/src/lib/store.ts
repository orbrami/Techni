import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { Language } from '@/i18n/translations';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture?: string;
  grade: string;
  gradeChangesLeft: number;
  bio?: string;
  isVerified: boolean;
  isBanned: boolean;
  role: 'student' | 'admin';
  followers: string[];
  following: string[];
  language: Language;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  language: Language;
  isAdminMode: boolean;
  adminToken: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setLanguage: (lang: Language) => void;
  setAdminMode: (active: boolean, token?: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      language: 'he',
      isAdminMode: false,
      adminToken: null,

      setAuth: (user, token) => {
        Cookies.set('token', token, { expires: 30, secure: true, sameSite: 'strict' });
        set({ user, token, language: user.language || 'he' });
      },

      setUser: (user) => set({ user }),

      setLanguage: (lang) => set({ language: lang }),

      setAdminMode: (active, token) => {
        if (!active) {
          set({ isAdminMode: false, adminToken: null });
        } else {
          set({ isAdminMode: true, adminToken: token || null });
        }
      },

      logout: () => {
        Cookies.remove('token');
        set({ user: null, token: null, isAdminMode: false, adminToken: null });
      },

      isAuthenticated: () => {
        const state = get();
        return !!(state.user && state.token);
      },
    }),
    {
      name: 'techni-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        language: state.language,
        // DO NOT persist adminMode - it must reset on refresh
      }),
    }
  )
);
