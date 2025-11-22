package com.codearena.problemservice.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.codearena.problemservice.exception.DuplicateTitleException;
import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.problem.Difficulty;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.repository.ProblemRepository;
import com.codearena.problemservice.repository.TestCaseRepository;

class ProblemServiceTest {

    private ProblemRepository problemRepository;
    private TestCaseRepository testCaseRepository;
    private ProblemService problemService;

    @BeforeEach
    void setup() {
        problemRepository = mock(ProblemRepository.class);
        testCaseRepository = mock(TestCaseRepository.class);
        problemService = new ProblemService(problemRepository, testCaseRepository);
    }

    @Test
    void createProblem_success() {
        Problem problem = new Problem();
        problem.setTitle("Two Sum");
        problem.setDifficulty(Difficulty.EASY);
        problem.setDescription("Solve two sum...");
        
        List<TestCase> testCases = List.of(new TestCase());

        when(problemRepository.existsByTitle("Two Sum")).thenReturn(false);
        when(problemRepository.save(problem)).thenReturn(problem);

        Problem created = problemService.createProblem(problem, testCases);

        assertNotNull(created);
        verify(problemRepository, times(1)).save(problem);
        verify(testCaseRepository, times(1)).save(any(TestCase.class));
    }

    @Test
    void createProblem_duplicateTitle_throwsException() {
        Problem problem = new Problem();
        problem.setTitle("Two Sum");

        when(problemRepository.existsByTitle("Two Sum")).thenReturn(true);

        assertThrows(DuplicateTitleException.class, () ->
                problemService.createProblem(problem, List.of())
        );
    }
}
