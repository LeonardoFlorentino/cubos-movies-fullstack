import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMovieDto } from './dto/create-movie.dto';
import {
  MovieResponseDto,
  PaginatedMoviesResponseDto,
} from './dto/movie-response.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import {
  toMovieResponseDto,
  toPaginatedMoviesResponseDto,
} from './movie.mapper';
import { PaginationDto } from './dto/pagination.dto';
import { MoviesService } from './movies.service';
import { MAX_UPLOAD_BYTES, StorageService } from './storage.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_UPLOAD_BYTES,
      },
    }),
  )
  uploadImage(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadMovieImage(req.user.sub, file);
  }

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() createMovieDto: CreateMovieDto,
  ): Promise<MovieResponseDto> {
    const movie = await this.moviesService.create(req.user.sub, createMovieDto);
    return toMovieResponseDto(movie);
  }

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMoviesResponseDto> {
    const paginated = await this.moviesService.findAllByOwnerWithPagination(
      req.user.sub,
      paginationDto,
    );
    return toPaginatedMoviesResponseDto(paginated);
  }

  @Get(':id')
  async findOne(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MovieResponseDto> {
    const movie = await this.moviesService.findOneByOwner(req.user.sub, id);
    return toMovieResponseDto(movie);
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    const movie = await this.moviesService.updateByOwner(
      req.user.sub,
      id,
      updateMovieDto,
    );
    return toMovieResponseDto(movie);
  }

  @Delete(':id')
  async remove(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.moviesService.removeByOwner(req.user.sub, id);
    return { message: 'Movie deleted successfully' };
  }
}
