export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
});
