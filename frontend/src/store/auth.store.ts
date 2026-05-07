import { create } from "zustand";
import { getErrorMessage } from "../lib/api-error";
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
        error: getErrorMessage(error, "Nao foi possivel entrar agora."),
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
        error: getErrorMessage(error, "Nao foi possivel criar sua conta."),
      });
    }
  },
  logoutAction() {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, error: null });
  },
}));
