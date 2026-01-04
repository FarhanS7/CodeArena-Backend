export default () => ({
  port: parseInt(process.env.PORT || '8081', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'execution_db',
  },
  judge0: {
    url: process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com',
    apiKey: process.env.JUDGE0_API_KEY || '',
  },
  problemService: {
    url: process.env.PROBLEM_SERVICE_URL || 'http://localhost:8080',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  },
});
