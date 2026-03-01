package com.codearena.problemservice.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.codearena.problemservice.BaseIntegrationTest;
import com.codearena.problemservice.problem.Difficulty;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.repository.ProblemRepository;

class ProblemIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ProblemRepository problemRepository;

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
