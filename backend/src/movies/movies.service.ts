import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getAppErrorDefinition } from '../common/errors/app-error-catalog';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Movie } from './entities/movie.entity';
import { PaginatedResponse } from './types/paginated-response';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
  ) {}

  async create(
    ownerId: string,
    createMovieDto: CreateMovieDto,
  ): Promise<Movie> {
    const normalizedGenres =
      createMovieDto.genres
        ?.map((genre) => genre.trim())
        .filter((genre) => genre.length > 0) ?? [];

    const movie = this.moviesRepository.create({
      ...createMovieDto,
      budget: createMovieDto.budget.toFixed(2),
      genres: normalizedGenres,
      durationMinutes: createMovieDto.durationMinutes ?? null,
      ownerId,
    });

    return this.moviesRepository.save(movie);
  }

  findAllByOwner(ownerId: string): Promise<Movie[]> {
    return this.moviesRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByOwnerWithPagination(
    ownerId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Movie>> {
    const { page = 1, limit = 10, search, genre } = paginationDto;
    const skip = (page - 1) * limit;

    const normalizedSearch =
      typeof search === 'string' ? search.trim().toLowerCase() : '';
    const normalizedGenre = typeof genre === 'string' ? genre.trim() : '';

    const query = this.moviesRepository
      .createQueryBuilder('movie')
      .where('movie.owner_id = :ownerId', { ownerId })
      .orderBy('movie.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (normalizedSearch) {
      query.andWhere('LOWER(movie.title) LIKE :search', {
        search: `%${normalizedSearch}%`,
      });
    }

    if (normalizedGenre) {
      query.andWhere(':genre = ANY(movie.genres)', {
        genre: normalizedGenre,
      });
    }

    const [data, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOneByOwner(ownerId: string, movieId: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException(getAppErrorDefinition('RESOURCE_NOT_FOUND'));
    }

    if (movie.ownerId !== ownerId) {
      throw new ForbiddenException(getAppErrorDefinition('ACCESS_FORBIDDEN'));
    }

    return movie;
  }

  async updateByOwner(
    ownerId: string,
    movieId: string,
    updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    const movie = await this.findOneByOwner(ownerId, movieId);

    if (typeof updateMovieDto.budget === 'number') {
      movie.budget = updateMovieDto.budget.toFixed(2);
    }

    if (typeof updateMovieDto.title === 'string') {
      movie.title = updateMovieDto.title;
    }

    if (typeof updateMovieDto.description === 'string') {
      movie.description = updateMovieDto.description;
    }

    if (typeof updateMovieDto.releaseDate === 'string') {
      if (movie.releaseDate !== updateMovieDto.releaseDate) {
        movie.releaseReminderSentAt = null;
      }
      movie.releaseDate = updateMovieDto.releaseDate;
    }

    if (typeof updateMovieDto.imageUrl === 'string') {
      movie.imageUrl = updateMovieDto.imageUrl;
    }

    if (typeof updateMovieDto.trailer === 'string') {
      movie.trailer = updateMovieDto.trailer;
    }

    if (Array.isArray(updateMovieDto.genres)) {
      movie.genres = updateMovieDto.genres
        .map((genre) => genre.trim())
        .filter((genre) => genre.length > 0);
    }

    if (typeof updateMovieDto.durationMinutes === 'number') {
      movie.durationMinutes = updateMovieDto.durationMinutes;
    }

    return this.moviesRepository.save(movie);
  }

  async removeByOwner(ownerId: string, movieId: string): Promise<void> {
    const movie = await this.findOneByOwner(ownerId, movieId);
    await this.moviesRepository.remove(movie);
  }
}
