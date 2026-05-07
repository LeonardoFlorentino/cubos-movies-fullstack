import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Movie } from './entities/movie.entity';

@Injectable()
export class ReleaseReminderService {
  private readonly logger = new Logger(ReleaseReminderService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailyReleaseReminders(): Promise<void> {
    const sentCount = await this.sendReleaseRemindersForDate(new Date());
    this.logger.log(`Pending release reminders sent: ${sentCount}`);
  }

  async sendReleaseRemindersForDate(referenceDate: Date): Promise<number> {
    const targetDate = this.getIsoDate(referenceDate);

    const movies = await this.moviesRepository.find({
      where: {
        releaseDate: LessThanOrEqual(targetDate),
        releaseReminderSentAt: IsNull(),
      },
      relations: {
        owner: true,
      },
    });

    let sentCount = 0;

    for (const movie of movies) {
      if (!movie.owner?.email) {
        continue;
      }

      await this.sendReminderEmail(movie);
      movie.releaseReminderSentAt = new Date();
      await this.moviesRepository.save(movie);
      sentCount += 1;
    }

    return sentCount;
  }

  private async sendReminderEmail(movie: Movie): Promise<void> {
    await this.mailService.sendReleaseReminderEmail({
      to: movie.owner.email,
      userName: movie.owner.name,
      movieTitle: movie.title,
      releaseDate: movie.releaseDate,
    });
  }

  private getIsoDate(referenceDate: Date): string {
    const year = referenceDate.getFullYear();
    const month = `${referenceDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${referenceDate.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
