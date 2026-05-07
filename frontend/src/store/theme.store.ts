import { create } from "zustand";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "cubos_movies_theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function getSystemTheme(): Theme {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

interface ThemeState {
  theme: Theme;
  initializeTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",

  initializeTheme() {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const theme: Theme =
      stored === "dark" || stored === "light" ? stored : getSystemTheme();

    applyTheme(theme);
    set({ theme });
  },

  setTheme(theme) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyTheme(theme);
    }
    set({ theme });
  },

  toggleTheme() {
    const nextTheme: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
}));
