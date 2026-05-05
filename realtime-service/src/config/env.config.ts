export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
});
