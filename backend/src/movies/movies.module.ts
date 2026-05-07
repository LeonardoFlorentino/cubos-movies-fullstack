import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { Movie } from './entities/movie.entity';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { ReleaseReminderService } from './release-reminder.service';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie]), MailModule],
  controllers: [MoviesController],
  providers: [MoviesService, ReleaseReminderService, StorageService],
  exports: [MoviesService],
})
export class MoviesModule {}
