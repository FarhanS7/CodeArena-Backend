# Code Execution Service

A microservice for executing user-submitted code securely using the Judge0 API.

## Features

- ✅ Multi-language support (JavaScript, Python, Java, C++, C, TypeScript)
- ✅ Secure code execution via Judge0 sandbox
- ✅ Test case validation
- ✅ Submission tracking and history
- ✅ User statistics (acceptance rate, problems solved)
- ✅ RESTful API with validation
- ✅ PostgreSQL database integration

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Code Execution**: Judge0 API (RapidAPI)
- **Validation**: class-validator

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Judge0 API Key (get from [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce))

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT`: Service port (default: 8081)
- `DB_*`: PostgreSQL connection details
- `JUDGE0_API_KEY`: Your RapidAPI Judge0 key
- `PROBLEM_SERVICE_URL`: URL of problem service

### 3. Database Setup

Create database:
```sql
CREATE DATABASE execution_db;
```

The tables will be auto-created on first run (TypeORM synchronize).

### 4. Run the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Base URL: `http://localhost:8081/api`

#### Health Check
```
GET /health
```

#### Create Submission
```
POST /submissions
Content-Type: application/json

{
  "userId": 1,
  "problemId": 1,
  "language": "javascript",
  "sourceCode": "console.log('Hello World');"
}
```

#### Get Submission Status
```
GET /submissions/:id
```

#### Get User Submissions
```
GET /submissions/user/:userId
```

#### Get User Statistics
```
GET /submissions/user/:userId/stats
```

#### Get Problem Submissions
```
GET /submissions/problem/:problemId
```

## Supported Languages

| Language | Code | Judge0 ID |
|----------|------|-----------|
| JavaScript (Node.js) | `javascript` | 63 |
| Python 3 | `python` | 71 |
| Java | `java` | 62 |
| C++ (GCC) | `cpp` | 54 |
| C (GCC) | `c` | 50 |
| TypeScript | `typescript` | 74 |

## Submission Status Flow

```
PENDING → PROCESSING → ACCEPTED/WRONG_ANSWER/ERROR
```

Possible statuses:
- `PENDING`: Submitted, waiting for processing
- `PROCESSING`: Currently executing
- `ACCEPTED`: All test cases passed
- `WRONG_ANSWER`: Some test cases failed
- `TIME_LIMIT_EXCEEDED`: Code took too long
- `MEMORY_LIMIT_EXCEEDED`: Used too much memory
- `RUNTIME_ERROR`: Code crashed during execution
- `COMPILATION_ERROR`: Code failed to compile
- `INTERNAL_ERROR`: System error

## How It Works

1. User submits code via POST `/submissions`
2. Service creates submission record with status `PENDING`
3. Service fetches problem and test cases from Problem Service
4. Service executes code against each test case using Judge0 API
5. Results are aggregated and stored
6. Submission status updated to final result
7. User polls GET `/submissions/:id` for results

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker

```bash
# Build image
docker build -t execution-service .

# Run container
docker run -p 8081:8081 --env-file .env execution-service
```

## Judge0 API Limits

Free tier limitations:
- 50 requests/day
- 1 request/second

For production, consider:
- Paid RapidAPI plan
- Self-hosted Judge0 instance
- Alternative execution engines

## Security Considerations

- Code execution happens in isolated Judge0 sandbox
- Input validation on all endpoints
- Resource limits enforced (time, memory)
- No direct code evaluation
- Database parameterized queries

## License

MIT
