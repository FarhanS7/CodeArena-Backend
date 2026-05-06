import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { HealthModule } from './health/health.module';
import { SavedProblem } from './entities/saved-problem.entity';
import { SearchHistory } from './entities/search-history.entity';
import { SearchPreset } from './entities/search-preset.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([SavedProblem, SearchHistory, SearchPreset]),
    HealthModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class AppModule {}
