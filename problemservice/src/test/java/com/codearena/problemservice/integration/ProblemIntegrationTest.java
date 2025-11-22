package com.codearena.problemservice.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.codearena.problemservice.problem.Difficulty;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.repository.ProblemRepository;

@Testcontainers
@SpringBootTest
class ProblemIntegrationTest {

    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("postgres")
            .withPassword("postgres");

    static {
        postgres.start();
    }

    @Autowired
    private ProblemRepository problemRepository;

    @DynamicPropertySource
    static void registerPgProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    void testCreateProblem() {
        Problem problem = new Problem();
        problem.setTitle("Binary Search");
        problem.setDifficulty(Difficulty.MEDIUM);
        problem.setDescription("Test description");

        Problem saved = problemRepository.save(problem);

        assertNotNull(saved.getId());
        assertEquals("Binary Search", saved.getTitle());
    }
}
