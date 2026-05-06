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

  it('should update movie fields and format budget for owner', async () => {
    repository.findOne?.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-1',
      title: 'Old title',
      description: 'Old description',
      releaseDate: '2014-11-07',
      budget: '1.00',
      imageUrl: null,
      trailer: null,
    });
    repository.save?.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-1',
      title: 'New title',
      description: 'New description',
      releaseDate: '2015-01-01',
      budget: '10.50',
      imageUrl: 'https://cdn.example.com/poster.jpg',
      trailer: 'https://youtube.com/watch?v=123',
    });

    const result = await service.updateByOwner('user-1', 'movie-1', {
      title: 'New title',
      description: 'New description',
      releaseDate: '2015-01-01',
      budget: 10.5,
      imageUrl: 'https://cdn.example.com/poster.jpg',
      trailer: 'https://youtube.com/watch?v=123',
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        budget: '10.50',
        title: 'New title',
        description: 'New description',
        releaseDate: '2015-01-01',
        imageUrl: 'https://cdn.example.com/poster.jpg',
        trailer: 'https://youtube.com/watch?v=123',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        budget: '10.50',
        title: 'New title',
      }),
    );
  });

  it('should deny update when movie belongs to another user', async () => {
    repository.findOne?.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-2',
    });

    await expect(
      service.updateByOwner('user-1', 'movie-1', { title: 'Blocked update' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should remove movie when requester is owner', async () => {
    const movie = {
      id: 'movie-1',
      ownerId: 'user-1',
    };

    repository.findOne?.mockResolvedValue(movie);
    repository.remove?.mockResolvedValue(movie);

    await service.removeByOwner('user-1', 'movie-1');

    expect(repository.remove).toHaveBeenCalledWith(movie);
  });

  it('should deny removal when movie belongs to another user', async () => {
    repository.findOne?.mockResolvedValue({
      id: 'movie-1',
      ownerId: 'user-2',
    });

    await expect(
      service.removeByOwner('user-1', 'movie-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.remove).not.toHaveBeenCalled();
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

  it('should apply genre filter in paginated query', async () => {
    repository.findAndCount?.mockResolvedValue([[], 0]);

    await service.findAllByOwnerWithPagination('user-1', {
      page: 1,
      limit: 10,
      genre: 'Drama',
    });

    const [queryOptions] = repository.findAndCount?.mock.calls[0] as [
      { where?: Record<string, unknown> },
    ];

    expect(queryOptions.where?.ownerId).toBe('user-1');
    expect(queryOptions.where?.genres).toEqual(
      expect.objectContaining({
        _type: 'arrayContains',
        _value: ['Drama'],
      }),
    );
  });
});
