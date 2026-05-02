import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MoviesService } from './movies.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(req.user.sub, createMovieDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.moviesService.findAllByOwner(req.user.sub);
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
