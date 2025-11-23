package com.codearena.problemservice.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.codearena.problemservice.problem.Difficulty;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.service.ProblemService;
import com.fasterxml.jackson.databind.ObjectMapper;

class ProblemControllerTest {

    private MockMvc mockMvc;
    private ProblemService problemService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        problemService = mock(ProblemService.class);
        ProblemController controller = new ProblemController(problemService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void createProblem_returnsSuccessResponse() throws Exception {
        Problem problem = new Problem();
        problem.setId(1L);
        problem.setTitle("Two Sum");
        problem.setDifficulty(Difficulty.EASY);
        problem.setDescription("desc");
        when(problemService.createProblem(any(Problem.class), anyList())).thenReturn(problem);

        String jsonBody = """
            {
              "title": "Two Sum",
              "difficulty": "EASY",
              "description": "Find two numbers that add to target",
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

        mockMvc.perform(post("/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Two Sum")));
    }

    @Test
    void getAllProblems_returnsList() throws Exception {
        Problem p1 = new Problem();
        p1.setId(1L);
        p1.setTitle("Two Sum");
        p1.setDifficulty(Difficulty.EASY);
        p1.setDescription("desc");

        when(problemService.getAllProblems()).thenReturn(List.of(p1));

        mockMvc.perform(get("/problems"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].title", is("Two Sum")));
    }

    @Test
    void getProblem_returnsSingleProblem() throws Exception {
        Problem p1 = new Problem();
        p1.setId(1L);
        p1.setTitle("Two Sum");
        p1.setDifficulty(Difficulty.EASY);
        p1.setDescription("desc");

        when(problemService.getProblemById(1L)).thenReturn(p1);

        mockMvc.perform(get("/problems/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Two Sum")));
    }
}
