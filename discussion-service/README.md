# Discussion Service

A NestJS microservice for handling user discussions and comments.

## Prerequisites

- Node.js (v18+)
- PostgreSQL

## Configuration

Configure the service via `.env` file or environment variables.

- `PORT`: Service port (default 8082 likely)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (discussion_db)
- `JWT_SECRET`: Shared secret for auth

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
