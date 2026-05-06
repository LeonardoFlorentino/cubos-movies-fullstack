export class MovieResponseDto {
  id!: string;
  title!: string;
  description!: string;
  releaseDate!: string;
  genres!: string[];
  durationMinutes!: number | null;
  budget!: number;
  imageUrl!: string | null;
  trailerUrl!: string | null;
  ownerId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedMoviesResponseDto {
  data!: MovieResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
