import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "../user/user.entity";

export const ormconfig = (): TypeOrmModuleOptions => ({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true, // dev only
  entities: [User],
});
