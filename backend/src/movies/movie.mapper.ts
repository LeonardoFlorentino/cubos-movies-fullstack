import {
  MovieResponseDto,
  PaginatedMoviesResponseDto,
} from './dto/movie-response.dto';
import { Movie } from './entities/movie.entity';
import { PaginatedResponse } from './types/paginated-response';

export function toMovieResponseDto(movie: Movie): MovieResponseDto {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    releaseDate: movie.releaseDate,
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    durationMinutes:
      typeof movie.durationMinutes === 'number' ? movie.durationMinutes : null,
    budget: Number(movie.budget),
    imageUrl: movie.imageUrl,
    trailerUrl: movie.trailer,
    ownerId: movie.ownerId,
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
  };
}

export function toPaginatedMoviesResponseDto(
  payload: PaginatedResponse<Movie>,
): PaginatedMoviesResponseDto {
  return {
    data: payload.data.map(toMovieResponseDto),
    total: payload.total,
    page: payload.page,
    limit: payload.limit,
    totalPages: payload.totalPages,
  };
}
