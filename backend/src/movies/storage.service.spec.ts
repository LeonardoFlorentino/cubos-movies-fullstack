import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { MAX_UPLOAD_BYTES, StorageService } from './storage.service';

const sendMock = jest.fn();
type PutObjectInput = {
  Bucket?: string;
  Key?: string;
  Body?: Buffer;
  ContentType?: string;
};
const putObjectInputs: PutObjectInput[] = [];

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: sendMock,
  })),
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => {
    putObjectInputs.push(input as PutObjectInput);
    return { input };
  }),
}));

type ConfigMap = Record<string, string | undefined>;

const buildConfigService = (values: ConfigMap): ConfigService => {
  return {
    get: jest.fn((key: string, defaultValue?: string) => {
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;
};

const buildFile = (overrides: Partial<Express.Multer.File> = {}) => {
  return {
    buffer: Buffer.from('image-data'),
    originalname: 'poster.png',
    mimetype: 'image/png',
    size: 1024,
    ...overrides,
  } as Express.Multer.File;
};

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMock.mockResolvedValue({});
    putObjectInputs.length = 0;
  });

  it('uploads image to AWS S3 and returns public URL', async () => {
    const service = new StorageService(
      buildConfigService({
        STORAGE_PROVIDER: 's3',
        AWS_S3_BUCKET: 'movies-bucket',
        AWS_ACCESS_KEY_ID: 'aws-key',
        AWS_SECRET_ACCESS_KEY: 'aws-secret',
        AWS_REGION: 'us-east-1',
      }),
    );

    const result = await service.uploadMovieImage('owner-1', buildFile());

    expect(S3Client).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'aws-key',
        secretAccessKey: 'aws-secret',
      },
    });

    const putInput = putObjectInputs[0] as {
      Bucket: string;
      Key: string;
      Body: Buffer;
      ContentType: string;
    };

    expect(putInput.Bucket).toBe('movies-bucket');
    expect(putInput.Key).toMatch(/^movies\/owner-1\/.+\.png$/);
    expect(putInput.ContentType).toBe('image/png');
    expect(putInput.Body).toEqual(Buffer.from('image-data'));
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(result.imageUrl).toBe(
      `https://movies-bucket.s3.us-east-1.amazonaws.com/${putInput.Key}`,
    );
  });

  it('uploads image to R2 and uses configured public base URL', async () => {
    const service = new StorageService(
      buildConfigService({
        STORAGE_PROVIDER: 'r2',
        R2_BUCKET: 'movies-r2',
        R2_ACCESS_KEY_ID: 'r2-key',
        R2_SECRET_ACCESS_KEY: 'r2-secret',
        R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
        R2_PUBLIC_BASE_URL: 'https://cdn.example.com/',
      }),
    );

    const result = await service.uploadMovieImage('owner-2', buildFile());
    const putInput = putObjectInputs[0] as {
      Key: string;
    };

    expect(S3Client).toHaveBeenCalledWith({
      region: 'auto',
      endpoint: 'https://account.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'r2-key',
        secretAccessKey: 'r2-secret',
      },
    });
    expect(result.imageUrl).toBe(`https://cdn.example.com/${putInput.Key}`);
  });

  it('throws bad request when file is missing', async () => {
    const service = new StorageService(buildConfigService({}));

    await expect(service.uploadMovieImage('owner-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws bad request for unsupported mime type', async () => {
    const service = new StorageService(buildConfigService({}));

    await expect(
      service.uploadMovieImage(
        'owner-1',
        buildFile({ mimetype: 'image/gif', originalname: 'poster.gif' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws bad request when file exceeds max upload size', async () => {
    const service = new StorageService(buildConfigService({}));

    await expect(
      service.uploadMovieImage(
        'owner-1',
        buildFile({ size: MAX_UPLOAD_BYTES + 1 }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws internal server error when storage bucket is missing', async () => {
    const service = new StorageService(
      buildConfigService({
        STORAGE_PROVIDER: 's3',
        AWS_ACCESS_KEY_ID: 'aws-key',
        AWS_SECRET_ACCESS_KEY: 'aws-secret',
      }),
    );

    await expect(
      service.uploadMovieImage('owner-1', buildFile()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws internal server error when credentials are missing', async () => {
    const service = new StorageService(
      buildConfigService({
        STORAGE_PROVIDER: 's3',
        AWS_S3_BUCKET: 'movies-bucket',
      }),
    );

    await expect(
      service.uploadMovieImage('owner-1', buildFile()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws internal server error for R2 when endpoint cannot be resolved', async () => {
    const service = new StorageService(
      buildConfigService({
        STORAGE_PROVIDER: 'r2',
        R2_BUCKET: 'movies-r2',
        R2_ACCESS_KEY_ID: 'r2-key',
        R2_SECRET_ACCESS_KEY: 'r2-secret',
      }),
    );

    await expect(
      service.uploadMovieImage('owner-1', buildFile()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws internal server error when upload fails', async () => {
    sendMock.mockRejectedValue(new Error('s3 error'));
    const service = new StorageService(
      buildConfigService({
        STORAGE_PROVIDER: 's3',
        AWS_S3_BUCKET: 'movies-bucket',
        AWS_ACCESS_KEY_ID: 'aws-key',
        AWS_SECRET_ACCESS_KEY: 'aws-secret',
      }),
    );

    await expect(
      service.uploadMovieImage('owner-1', buildFile()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
