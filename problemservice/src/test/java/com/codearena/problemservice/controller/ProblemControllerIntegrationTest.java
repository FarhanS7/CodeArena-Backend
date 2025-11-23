package com.codearena.problemservice.controller;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.repository.ProblemRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // ignore Spring Security filters in this test
@Testcontainers
class ProblemControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("problemservice_test")
            .withUsername("test")
            .withPassword("test");

@DynamicPropertySource
static void registerPgProps(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);

    registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
}


    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createAndFetchProblem_success() throws Exception {
        String requestJson = """
            {
              "title": "Two Sum IT",
              "difficulty": "EASY",
              "description": "Integration test problem",
              "exampleInput": "2 7 11 15, target=9",
              "exampleOutput": "[0,1]",
              "timeLimit": 2000,
              "memoryLimit": 256,
              "tags": ["array", "hash-table"],
              "isPublic": true,
              "testCases": [
                { "input": "2 7 11 15, target=9", "expectedOutput": "[0,1]" }
              ]
            }
            """;

        // Create
        mockMvc.perform(post("/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Two Sum IT")));

        // Verify it’s stored
        Problem p = problemRepository.findAll().stream()
                .filter(pr -> "Two Sum IT".equals(pr.getTitle()))
                .findFirst()
                .orElseThrow();

        // Fetch via API
        mockMvc.perform(get("/problems/" + p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Two Sum IT")))
                .andExpect(jsonPath("$.data.difficulty", is("EASY")));
    }
}
