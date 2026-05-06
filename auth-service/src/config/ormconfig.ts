import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "../user/user.entity";

export const ormconfig = (): TypeOrmModuleOptions => ({
  type: "postgres",
  url: process.env.DATABASE_URL,
  host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
  port: !process.env.DATABASE_URL ? parseInt(process.env.DB_PORT) : undefined,
  username: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
  password: !process.env.DATABASE_URL ? process.env.DB_PASS : undefined,
  database: !process.env.DATABASE_URL ? process.env.DB_NAME : undefined,
  synchronize: true, // dev only
  entities: [User],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
