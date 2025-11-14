import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import envConfig from "./config/env.config";
import { ormconfig } from "./config/ormconfig";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
    TypeOrmModule.forRootAsync({
      useFactory: ormconfig,
    }),
    UserModule,
  ],
})
export class AppModule {}
