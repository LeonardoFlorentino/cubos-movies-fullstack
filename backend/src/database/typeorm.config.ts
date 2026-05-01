import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: Number(configService.get<string>('DB_PORT', '5432')),
    username: configService.get<string>('DB_USER', 'cubos'),
    password: configService.get<string>('DB_PASSWORD', 'cubos'),
    database: configService.get<string>('DB_NAME', 'cubos_movies'),
    autoLoadEntities: true,
    synchronize: false,
  }),
};
