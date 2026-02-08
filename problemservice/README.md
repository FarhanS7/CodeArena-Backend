# Problem Service

A Spring Boot microservice for managing coding problems and test cases.

## Prerequisites

- Java 17+
- Maven
- PostgreSQL (Database: `auth_db` as per application.properties, though likely should be `problem_db`)

## Configuration

The service is configured via `src/main/resources/application.properties`.

- **Port**: 8080 (implied default)
- **Database**: `jdbc:postgresql://localhost:5433/auth_db`
- **Username/Password**: `postgres` / `postgres`

## Build & Run

```bash
# Build (skipping tests if Docker is not available)
./mvnw clean install -DskipTests

# Run
./mvnw spring-boot:run
```

## API

Check the Swagger UI at `http://localhost:8080/swagger-ui.html` (if enabled) or explore the code in `src/main/java/com/codearena/problemservice/controller`.
