import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { MoviesService } from './movies.service';

type MockRepo<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: MockRepo<Movie>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should create a movie with owner id', async () => {
    repository.create?.mockReturnValue({
      title: 'Interstellar',
      ownerId: 'user-1',
    });
    repository.save?.mockResolvedValue({
      id: 'movie-1',
      title: 'Interstellar',
      ownerId: 'user-1',
    });

    const result = await service.create('user-1', {
      title: 'Interstellar',
      description: 'Space movie',
      releaseDate: '2014-11-07',
      budget: 165000000,
      imageUrl: 'https://example.com/poster.jpg',
    });

    expect(result).toEqual({
      id: 'movie-1',
      title: 'Interstellar',
      ownerId: 'user-1',
    });
    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw not found when movie does not exist', async () => {
    repository.findOne?.mockResolvedValue(null);

    await expect(
      service.findOneByOwner('user-1', 'movie-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw forbidden when movie belongs to another user', async () => {
    repository.findOne?.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-2',
    });

    await expect(
      service.findOneByOwner('user-1', 'movie-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should return paginated movies with search', async () => {
    const mockMovies = [
      { id: 'movie-1', title: 'Interstellar', ownerId: 'user-1' },
      { id: 'movie-2', title: 'Inception', ownerId: 'user-1' },
    ];

    repository.findAndCount?.mockResolvedValue([mockMovies, 2]);

    const result = await service.findAllByOwnerWithPagination('user-1', {
      page: 1,
      limit: 10,
      search: 'Inter',
    });

    expect(result).toEqual({
      data: mockMovies,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(repository.findAndCount).toHaveBeenCalled();
  });
});
