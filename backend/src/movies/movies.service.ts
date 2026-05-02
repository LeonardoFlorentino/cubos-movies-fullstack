import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

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
    const movie = this.moviesRepository.create({
      ...createMovieDto,
      budget: createMovieDto.budget.toFixed(2),
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

  async findOneByOwner(ownerId: string, movieId: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    if (movie.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot access this movie');
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
      movie.releaseDate = updateMovieDto.releaseDate;
    }

    if (typeof updateMovieDto.imageUrl === 'string') {
      movie.imageUrl = updateMovieDto.imageUrl;
    }

    return this.moviesRepository.save(movie);
  }

  async removeByOwner(ownerId: string, movieId: string): Promise<void> {
    const movie = await this.findOneByOwner(ownerId, movieId);
    await this.moviesRepository.remove(movie);
  }
}
