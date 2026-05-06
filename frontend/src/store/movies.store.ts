import { create } from "zustand";
import {
  getMovies as fetchMovies,
  getMovieById as fetchMovieById,
  createMovie as apiCreateMovie,
  deleteMovie as apiDeleteMovie,
} from "../lib/api";
import type { Movie, CreateMoviePayload } from "../types/movies";

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
  genre: string;
  getMoviesAction: (
    page?: number,
    limit?: number,
    search?: string,
    genre?: string,
  ) => Promise<void>;
  getMovieByIdAction: (id: string) => Promise<void>;
  createMovieAction: (payload: CreateMoviePayload) => Promise<boolean>;
  deleteMovieAction: (id: string) => Promise<void>;
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
  genre: "",

  async getMoviesAction(page = 1, limit = 10, search = "", genre = "") {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchMovies(
        page,
        limit,
        search || undefined,
        genre || undefined,
      );
      set({
        movies: response.data,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        search,
        genre,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch movies",
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
  async createMovieAction(payload) {
    set({ isLoading: true, error: null });
    try {
      await apiCreateMovie(payload);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create movie",
        isLoading: false,
      });
      return false;
    }
  },

  async deleteMovieAction(id) {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteMovie(id);
      set((state) => ({
        movies: state.movies.filter((m) => m.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete movie",
        isLoading: false,
      });
    }
  },
}));
