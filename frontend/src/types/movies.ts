export interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  budget: string;
  genres: string[];
  durationMinutes: number | null;
  imageUrl: string | null;
  trailer: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMoviesResponse {
  data: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMoviePayload {
  title: string;
  description: string;
  releaseDate: string;
  budget: number;
  genres?: string[];
  durationMinutes?: number;
  imageUrl?: string;
  trailer?: string;
}

export interface UpdateMoviePayload {
  title?: string;
  description?: string;
  releaseDate?: string;
  budget?: number;
  genres?: string[];
  durationMinutes?: number;
  imageUrl?: string;
  trailer?: string;
}
