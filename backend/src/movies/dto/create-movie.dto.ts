import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  releaseDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget!: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;
}
