import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const ormConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: !process.env.DATABASE_URL ? process.env.DB_HOST || 'localhost' : undefined,
  port: !process.env.DATABASE_URL ? parseInt(process.env.DB_PORT || '5432', 10) : undefined,
  username: !process.env.DATABASE_URL ? process.env.DB_USERNAME || 'postgres' : undefined,
  password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD || 'postgres' : undefined,
  database: !process.env.DATABASE_URL ? process.env.DB_DATABASE || 'execution_db' : undefined,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-create tables in development
  logging: process.env.NODE_ENV !== 'production',
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
