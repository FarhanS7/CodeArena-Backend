import { registerAs } from "@nestjs/config";

export default registerAs("env", () => ({
  port: parseInt(process.env.PORT) || 3001,
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
}));
