export interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  budget: string;
  imageUrl: string | null;
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
  imageUrl?: string;
}

export interface UpdateMoviePayload {
  title?: string;
  description?: string;
  releaseDate?: string;
  budget?: number;
  imageUrl?: string;
}
