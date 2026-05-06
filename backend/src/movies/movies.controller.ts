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
import { UpdateMovieDto } from './dto/update-movie.dto';
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
  create(@Req() req: RequestWithUser, @Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(req.user.sub, createMovieDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser, @Query() paginationDto: PaginationDto) {
    return this.moviesService.findAllByOwnerWithPagination(
      req.user.sub,
      paginationDto,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.moviesService.findOneByOwner(req.user.sub, id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.moviesService.updateByOwner(req.user.sub, id, updateMovieDto);
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
