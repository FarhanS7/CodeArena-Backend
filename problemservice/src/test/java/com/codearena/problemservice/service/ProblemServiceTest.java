package com.codearena.problemservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.codearena.problemservice.controller.ProblemUpdateRequest;
import com.codearena.problemservice.exception.DuplicateTitleException;
import com.codearena.problemservice.exception.ProblemNotFoundException;
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
    void setUp() {
        problemRepository = mock(ProblemRepository.class);
        testCaseRepository = mock(TestCaseRepository.class);
        problemService = new ProblemService(problemRepository, testCaseRepository);
    }

    @Test
    void createProblem_succeeds_whenTitleIsUnique() {
        Problem problem = new Problem();
        problem.setTitle("Two Sum");
        problem.setDifficulty(Difficulty.EASY);
        problem.setDescription("Find two numbers that add up to target.");

        TestCase tc1 = new TestCase();
        tc1.setInput("2 7 11 15, target=9");
        tc1.setExpectedOutput("[0,1]");

        when(problemRepository.existsByTitle("Two Sum")).thenReturn(false);
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> {
            Problem saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        Problem saved = problemService.createProblem(problem, List.of(tc1));

        assertThat(saved.getId()).isEqualTo(1L);
        verify(problemRepository).existsByTitle("Two Sum");
        verify(problemRepository).save(any(Problem.class));
        verify(testCaseRepository).save(any(TestCase.class));
    }

    @Test
    void createProblem_throwsWhenTitleDuplicate() {
        Problem problem = new Problem();
        problem.setTitle("Two Sum");

        when(problemRepository.existsByTitle("Two Sum")).thenReturn(true);

        assertThatThrownBy(() -> problemService.createProblem(problem, List.of()))
                .isInstanceOf(DuplicateTitleException.class);
    }

    @Test
    void getProblemById_returnsProblemWhenExists() {
        Problem problem = new Problem();
        problem.setId(1L);
        problem.setTitle("Two Sum");

        when(problemRepository.findById(1L)).thenReturn(Optional.of(problem));

        Problem result = problemService.getProblemById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Two Sum");
    }

    @Test
    void getProblemById_throwsWhenNotFound() {
        when(problemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> problemService.getProblemById(999L))
                .isInstanceOf(ProblemNotFoundException.class);
    }

    @Test
    void deleteProblem_deletesTestCasesAndProblem() {
        Problem problem = new Problem();
        problem.setId(1L);

        TestCase tc = new TestCase();
        tc.setId(10L);
        problem.setTestCases(List.of(tc));

        when(problemRepository.findById(1L)).thenReturn(Optional.of(problem));

        problemService.deleteProblem(1L);

        verify(testCaseRepository).deleteAll(problem.getTestCases());
        verify(problemRepository).deleteById(1L);
    }

    @Test
    void updateProblem_updatesMetadataOnly_whenNoTestCasesProvided() {
        Problem existing = new Problem();
        existing.setId(1L);
        existing.setTitle("Old title");
        existing.setDifficulty(Difficulty.EASY);
        existing.setDescription("Old description");

        when(problemRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProblemUpdateRequest request = new ProblemUpdateRequest();
        request.setTitle("New title");
        request.setDifficulty(Difficulty.MEDIUM);
        request.setDescription("New description");
        // no testCases → only metadata

        Problem updated = problemService.updateProblem(1L, request);

        assertThat(updated.getTitle()).isEqualTo("New title");
        assertThat(updated.getDifficulty()).isEqualTo(Difficulty.MEDIUM);
        assertThat(updated.getDescription()).isEqualTo("New description");
        verify(testCaseRepository, never()).delete(any());
    }

    @Test
    void updateProblem_addsNewTestCase_whenIdIsNull() {
        Problem problem = new Problem();
        problem.setId(1L);

        when(problemRepository.findById(1L)).thenReturn(Optional.of(problem));
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProblemUpdateRequest.TestCaseRequest tcReq = new ProblemUpdateRequest.TestCaseRequest();
        tcReq.setInput("1 2 3");
        tcReq.setExpectedOutput("6");

        ProblemUpdateRequest request = new ProblemUpdateRequest();
        request.setTestCases(List.of(tcReq));

        problemService.updateProblem(1L, request);

        ArgumentCaptor<TestCase> tcCaptor = ArgumentCaptor.forClass(TestCase.class);
        verify(testCaseRepository).save(tcCaptor.capture());

        TestCase savedTc = tcCaptor.getValue();
        assertThat(savedTc.getProblem()).isEqualTo(problem);
        assertThat(savedTc.getInput()).isEqualTo("1 2 3");
        assertThat(savedTc.getExpectedOutput()).isEqualTo("6");
    }
}
