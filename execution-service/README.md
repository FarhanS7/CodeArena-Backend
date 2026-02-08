# Execution Service

A NestJS microservice for executing code submissions via Judge0.

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis
- Judge0 instance (or RapidAPI key)

## Configuration

Configure the service via `.env` file (copy from `.env.example`):

```env
PORT=8081
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=execution_db
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key
PROBLEM_SERVICE_URL=http://localhost:8080
JWT_SECRET=your-secret-key
```

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Testing

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e
```
