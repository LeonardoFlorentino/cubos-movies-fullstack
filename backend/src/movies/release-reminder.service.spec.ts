import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from '../mail/mail.service';
import { Movie } from './entities/movie.entity';
import { ReleaseReminderService } from './release-reminder.service';

type MockMovieRepository = {
  find: jest.Mock;
  save: jest.Mock;
};

describe('ReleaseReminderService', () => {
  let service: ReleaseReminderService;
  let moviesRepository: MockMovieRepository;
  const mailServiceMock = {
    sendReleaseReminderEmail: jest.fn(),
  };

  beforeEach(async () => {
    mailServiceMock.sendReleaseReminderEmail.mockReset();
    mailServiceMock.sendReleaseReminderEmail.mockResolvedValue(undefined);

    moviesRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReleaseReminderService,
        {
          provide: getRepositoryToken(Movie),
          useValue: moviesRepository,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReleaseReminderService>(ReleaseReminderService);
  });

  it('sends reminders for same-day releases and marks movies as reminded', async () => {
    const movie = {
      id: 'movie-1',
      title: 'Arrival',
      releaseDate: '2026-05-03',
      releaseReminderSentAt: null,
      owner: {
        name: 'Leona',
        email: 'leona@example.com',
      },
    } as Movie;

    moviesRepository.find.mockResolvedValue([movie]);
    moviesRepository.save.mockResolvedValue(movie);

    const sentCount = await service.sendReleaseRemindersForDate(
      new Date('2026-05-03T12:00:00.000Z'),
    );

    expect(moviesRepository.find).toHaveBeenCalledTimes(1);
    expect(mailServiceMock.sendReleaseReminderEmail).toHaveBeenCalledWith({
      to: 'leona@example.com',
      userName: 'Leona',
      movieTitle: 'Arrival',
      releaseDate: '2026-05-03',
    });
    expect(moviesRepository.save).toHaveBeenCalledTimes(1);
    expect(movie.releaseReminderSentAt).toBeInstanceOf(Date);
    expect(sentCount).toBe(1);
  });

  it('does not send reminders when movie owner has no email', async () => {
    const movieWithoutEmail = {
      id: 'movie-2',
      title: 'No Mail',
      releaseDate: '2026-05-03',
      releaseReminderSentAt: null,
      owner: {
        name: 'No Email User',
        email: '',
      },
    } as Movie;

    moviesRepository.find.mockResolvedValue([movieWithoutEmail]);

    const sentCount = await service.sendReleaseRemindersForDate(
      new Date('2026-05-03T12:00:00.000Z'),
    );

    expect(mailServiceMock.sendReleaseReminderEmail).not.toHaveBeenCalled();
    expect(moviesRepository.save).not.toHaveBeenCalled();
    expect(sentCount).toBe(0);
  });
});
