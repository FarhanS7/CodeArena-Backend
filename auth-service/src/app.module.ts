import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import envConfig from "./config/env.config";
import { ormconfig } from "./config/ormconfig";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60, // time window (60 seconds)
        limit: 5, // max 5 requests per minute
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
    TypeOrmModule.forRootAsync({
      useFactory: ormconfig,
    }),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
