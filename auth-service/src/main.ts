import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";

dotenv.config({ path: ".env.local" });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.use(cookieParser());

  app.enableCors({
    origin: "http://localhost:3000", // your frontend
    credentials: true, // allow cookies
  });

  await app.listen(process.env.PORT || 3100);
}
bootstrap();
