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
const TOKEN_KEY = "cubos_movies_token";

type RawMovie = {
  id: string;
  title: string;
  description: string;
  releaseDate?: string;
  release_date?: string;
  budget: string | number;
  genres?: string[] | null;
  durationMinutes?: number | null;
  duration_minutes?: number | null;
  imageUrl?: string | null;
  image_url?: string | null;
  trailer?: string | null;
  trailerUrl?: string | null;
  trailer_url?: string | null;
  ownerId?: string;
  owner_id?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function normalizeMovie(raw: RawMovie): Movie {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    releaseDate: raw.releaseDate ?? raw.release_date ?? "",
    budget: String(raw.budget ?? "0"),
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    durationMinutes: raw.durationMinutes ?? raw.duration_minutes ?? null,
    imageUrl: raw.imageUrl ?? raw.image_url ?? null,
    trailer: raw.trailer ?? raw.trailerUrl ?? raw.trailer_url ?? null,
    ownerId: raw.ownerId ?? raw.owner_id ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
  };
}

function normalizePaginatedMoviesResponse(payload: {
  data: RawMovie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}): PaginatedMoviesResponse {
  return {
    data: payload.data.map(normalizeMovie),
    total: payload.total,
    page: payload.page,
    limit: payload.limit,
    totalPages: payload.totalPages,
  };
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token =
    localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("accessToken");

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
  genre?: string,
) {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (search) {
    params.append("search", search);
  }
  if (genre) {
    params.append("genre", genre);
  }

  return request<{
    data: RawMovie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/movies?${params.toString()}`).then(normalizePaginatedMoviesResponse);
}

export function getMovieById(id: string) {
  return request<RawMovie>(`/movies/${id}`).then(normalizeMovie);
}

export function createMovie(payload: CreateMoviePayload) {
  return request<RawMovie>("/movies", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(normalizeMovie);
}

export function updateMovie(id: string, payload: UpdateMoviePayload) {
  return request<RawMovie>(`/movies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then(normalizeMovie);
}

export function deleteMovie(id: string) {
  return request<{ message: string }>(`/movies/${id}`, {
    method: "DELETE",
  });
}

export async function uploadMovieImage(file: File) {
  const token =
    localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("accessToken");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/movies/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("Imagem muito grande. Tamanho máximo: 5MB.");
    }

    const message = await response.text();
    throw new Error(message || "Image upload failed");
  }

  return (await response.json()) as { imageUrl: string };
}
