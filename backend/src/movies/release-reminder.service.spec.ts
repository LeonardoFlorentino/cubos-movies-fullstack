import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import nodemailer from 'nodemailer';
import { Movie } from './entities/movie.entity';
import { ReleaseReminderService } from './release-reminder.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

type MockMovieRepository = {
  find: jest.Mock;
  save: jest.Mock;
};

describe('ReleaseReminderService', () => {
  let service: ReleaseReminderService;
  let moviesRepository: MockMovieRepository;
  const sendMailMock = jest.fn();

  beforeEach(async () => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({});

    (nodemailer.createTransport as jest.Mock).mockReset();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

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
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'MAIL_FROM') {
                return 'no-reply@test.dev';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReleaseReminderService>(ReleaseReminderService);
  });

  it('sends reminders for tomorrow releases and marks movies as reminded', async () => {
    const movie = {
      id: 'movie-1',
      title: 'Arrival',
      releaseDate: '2026-05-04',
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

    const findCallArgs = moviesRepository.find.mock.calls[0] as [
      { where: { releaseDate: string } },
    ];

    expect(findCallArgs[0].where.releaseDate).toBe('2026-05-04');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(moviesRepository.save).toHaveBeenCalledTimes(1);
    expect(movie.releaseReminderSentAt).toBeInstanceOf(Date);
    expect(sentCount).toBe(1);
  });

  it('does not send reminders when movie owner has no email', async () => {
    const movieWithoutEmail = {
      id: 'movie-2',
      title: 'No Mail',
      releaseDate: '2026-05-04',
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

    expect(sendMailMock).not.toHaveBeenCalled();
    expect(moviesRepository.save).not.toHaveBeenCalled();
    expect(sentCount).toBe(0);
  });
});
