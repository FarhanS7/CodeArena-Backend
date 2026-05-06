import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { EnvValidator, EnvValidationRule } from "./common/utils/env-validation.util";
import { CorsConfig } from "../shared-config/cors.config";

dotenv.config({ path: ".env.local" });

const envValidationRules: EnvValidationRule[] = [
  {
    key: "PORT",
    required: false,
    defaultValue: "3100",
    description: "Port to run the auth service on",
  },
  {
    key: "DB_HOST",
    required: true,
    description: "Database host (e.g., localhost or db.example.com)",
  },
  {
    key: "DB_PORT",
    required: true,
    description: "Database port (e.g., 5432)",
  },
  {
    key: "DB_USER",
    required: true,
    description: "Database username",
  },
  {
    key: "DB_PASS",
    required: true,
    description: "Database password",
  },
  {
    key: "DB_NAME",
    required: true,
    description: "Database name (e.g., auth_db)",
  },
  {
    key: "JWT_SECRET",
    required: true,
    description:
      "Secret key for JWT signing (min 32 characters, use strong random string)",
  },
  {
    key: "JWT_REFRESH_SECRET",
    required: false,
    defaultValue: "refresh-secret-key",
    description: "Secret key for JWT refresh token signing",
  },
];

async function bootstrap() {
  EnvValidator.validate(envValidationRules);

  const logger = new Logger("AuthService");
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.use(cookieParser());

  // Use standardized CORS configuration (Issue #2 FIX)
  app.enableCors(CorsConfig.getOptions());

  const port = process.env.PORT || 3100;
  await app.listen(port);
  logger.log(`Running on port ${port}`);
}
bootstrap().catch((error) => {
  console.error("Failed to start Auth Service:", error.message);
  process.exit(1);
});
