import { create } from "zustand";
import { login, register } from "../lib/api";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types/auth";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  loginAction: (payload: LoginPayload) => Promise<void>;
  registerAction: (payload: RegisterPayload) => Promise<void>;
  logoutAction: () => void;
}

const TOKEN_KEY = "cubos_movies_token";

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  isLoading: false,
  error: null,
  async loginAction(payload) {
    set({ isLoading: true, error: null });
    try {
      const response = await login(payload);
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      set({
        token: response.accessToken,
        user: response.user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  },
  async registerAction(payload) {
    set({ isLoading: true, error: null });
    try {
      const response = await register(payload);
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      set({
        token: response.accessToken,
        user: response.user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      });
    }
  },
  logoutAction() {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, error: null });
  },
}));
