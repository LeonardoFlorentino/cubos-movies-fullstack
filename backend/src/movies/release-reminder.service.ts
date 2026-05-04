import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import nodemailer, { type Transporter } from 'nodemailer';
import { IsNull, Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';

@Injectable()
export class ReleaseReminderService {
  private readonly logger = new Logger(ReleaseReminderService.name);
  private transporter: Transporter | null = null;

  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyReleaseReminders(): Promise<void> {
    const sentCount = await this.sendReleaseRemindersForDate(new Date());
    this.logger.log(`Daily release reminders sent: ${sentCount}`);
  }

  async sendReleaseRemindersForDate(referenceDate: Date): Promise<number> {
    const targetDate = this.getNextDayIsoDate(referenceDate);

    const movies = await this.moviesRepository.find({
      where: {
        releaseDate: targetDate,
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
    const transporter = this.getTransporter();
    const from = this.configService.get<string>(
      'MAIL_FROM',
      'no-reply@cubosmovies.local',
    );

    await transporter.sendMail({
      from,
      to: movie.owner.email,
      subject: `Reminder: "${movie.title}" releases tomorrow`,
      text: [
        `Hello ${movie.owner.name},`,
        '',
        `This is a reminder that "${movie.title}" will be released on ${movie.releaseDate}.`,
        '',
        'Have a great movie day!',
        'Cubos Movies Team',
      ].join('\n'),
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return this.transporter;
    }

    this.logger.warn(
      'SMTP variables not fully configured. Using JSON transport for email reminders.',
    );
    this.transporter = nodemailer.createTransport({ jsonTransport: true });
    return this.transporter;
  }

  private getNextDayIsoDate(referenceDate: Date): string {
    const nextDay = new Date(referenceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const year = nextDay.getFullYear();
    const month = `${nextDay.getMonth() + 1}`.padStart(2, '0');
    const day = `${nextDay.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
