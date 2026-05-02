import { create } from "zustand";
import { getMovies as fetchMovies, getMovieById as fetchMovieById } from "../lib/api";
import type { Movie } from "../types/movies";

interface MoviesState {
  movies: Movie[];
  currentMovie: Movie | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  getMoviesAction: (page?: number, limit?: number, search?: string) => Promise<void>;
  getMovieByIdAction: (id: string) => Promise<void>;
  resetError: () => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
}

export const useMoviesStore = create<MoviesState>((set) => ({
  movies: [],
  currentMovie: null,
  isLoading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  search: "",

  async getMoviesAction(page = 1, limit = 10, search = "") {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchMovies(page, limit, search || undefined);
      set({
        movies: response.data,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        search,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch movies",
        isLoading: false,
      });
    }
  },

  async getMovieByIdAction(id: string) {
    set({ isLoading: true, error: null });
    try {
      const movie = await fetchMovieById(id);
      set({ currentMovie: movie, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch movie",
        isLoading: false,
      });
    }
  },

  resetError: () => set({ error: null }),

  setSearch: (search: string) => set({ search }),

  setPage: (page: number) => set({ page }),
}));
