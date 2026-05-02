import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";
import type {
  Movie,
  PaginatedMoviesResponse,
  CreateMoviePayload,
  UpdateMoviePayload,
} from "../types/movies";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

export function login(payload: LoginPayload) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Movies API
export function getMovies(
  page: number = 1,
  limit: number = 10,
  search?: string,
) {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (search) {
    params.append("search", search);
  }

  return request<PaginatedMoviesResponse>(`/movies?${params.toString()}`);
}

export function getMovieById(id: string) {
  return request<Movie>(`/movies/${id}`);
}

export function createMovie(payload: CreateMoviePayload) {
  return request<Movie>("/movies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMovie(id: string, payload: UpdateMoviePayload) {
  return request<Movie>(`/movies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMovie(id: string) {
  return request<{ message: string }>(`/movies/${id}`, {
    method: "DELETE",
  });
}
