import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { getAppErrorDefinition } from '../common/errors/app-error-catalog';

type StorageProvider = 's3' | 'r2';

export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

type UploadedImageFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class StorageService {
  private readonly maxBytes = MAX_UPLOAD_BYTES;
  private readonly allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  constructor(private readonly configService: ConfigService) {}

  async uploadMovieImage(ownerId: string, file?: UploadedImageFile) {
    if (!file) {
      throw new BadRequestException(
        getAppErrorDefinition('MOVIE_IMAGE_REQUIRED'),
      );
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        getAppErrorDefinition('MOVIE_IMAGE_TYPE_INVALID'),
      );
    }

    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        getAppErrorDefinition('MOVIE_IMAGE_TOO_LARGE'),
      );
    }

    const provider = this.getProvider();
    const bucket = this.getBucket(provider);
    const key = this.buildObjectKey(ownerId, file.originalname);
    const client = this.buildClient(provider);

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return {
        imageUrl: this.buildPublicUrl(provider, bucket, key),
      };
    } catch {
      throw new InternalServerErrorException(
        getAppErrorDefinition('STORAGE_UPLOAD_FAILED'),
      );
    }
  }

  private getProvider(): StorageProvider {
    const configured =
      this.configService.get<string>('STORAGE_PROVIDER')?.toLowerCase() ?? 's3';
    return configured === 'r2' ? 'r2' : 's3';
  }

  private getBucket(provider: StorageProvider) {
    const value =
      provider === 'r2'
        ? this.configService.get<string>('R2_BUCKET')
        : this.configService.get<string>('AWS_S3_BUCKET');

    if (!value) {
      throw new InternalServerErrorException(
        getAppErrorDefinition('INTERNAL_SERVER_ERROR'),
      );
    }

    return value;
  }

  private buildClient(provider: StorageProvider) {
    const accessKeyId =
      this.configService.get<string>('R2_ACCESS_KEY_ID') ??
      this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey =
      this.configService.get<string>('R2_SECRET_ACCESS_KEY') ??
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        getAppErrorDefinition('INTERNAL_SERVER_ERROR'),
      );
    }

    if (provider === 'r2') {
      const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
      const endpoint =
        this.configService.get<string>('R2_ENDPOINT') ??
        (accountId
          ? `https://${accountId}.r2.cloudflarestorage.com`
          : undefined);

      if (!endpoint) {
        throw new InternalServerErrorException(
          getAppErrorDefinition('INTERNAL_SERVER_ERROR'),
        );
      }

      return new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  private buildObjectKey(ownerId: string, originalName: string) {
    const suffix = extname(originalName).toLowerCase() || '.jpg';
    return `movies/${ownerId}/${randomUUID()}${suffix}`;
  }

  private buildPublicUrl(
    provider: StorageProvider,
    bucket: string,
    key: string,
  ) {
    const configuredBase =
      provider === 'r2'
        ? this.configService.get<string>('R2_PUBLIC_BASE_URL')
        : this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL');

    if (configuredBase) {
      return `${configuredBase.replace(/\/$/, '')}/${key}`;
    }

    if (provider === 'r2') {
      throw new InternalServerErrorException(
        getAppErrorDefinition('INTERNAL_SERVER_ERROR'),
      );
    }

    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
