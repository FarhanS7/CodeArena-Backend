package com.codearena.problemservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.problem.Problem;
import com.codearena.problemservice.response.ApiResponse;
import com.codearena.problemservice.service.ProblemService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/problems")
public class ProblemController {

    private final ProblemService problemService;

    public ProblemController(ProblemService problemService) {
        this.problemService = problemService;
    }

    // -------------------------
    // CREATE PROBLEM
    // -------------------------
    @PostMapping
    public ApiResponse createProblem(@Valid @RequestBody ProblemRequest request) {

        Problem problem = new Problem();
        problem.setTitle(request.getTitle());
        problem.setDifficulty(request.getDifficulty());
        problem.setDescription(request.getDescription());
        problem.setExampleInput(request.getExampleInput());
        problem.setExampleOutput(request.getExampleOutput());

        List<TestCase> testCases = request.getTestCases().stream()
                .map(tc -> {
                    TestCase testCase = new TestCase();
                    testCase.setInput(tc.getInput());
                    testCase.setExpectedOutput(tc.getExpectedOutput());
                    return testCase;
                })
                .toList();

        Problem created = problemService.createProblem(problem, testCases);

        return ApiResponse.success(created);
    }

    // -------------------------
    // GET ALL PROBLEMS
    // -------------------------
    @GetMapping
    public ApiResponse getAllProblems() {
        return ApiResponse.success(problemService.getAllProblems());
    }

    // -------------------------
    // GET ONE PROBLEM
    // -------------------------
    @GetMapping("/{id}")
    public ApiResponse getProblem(@PathVariable Long id) {
        return ApiResponse.success(problemService.getProblemById(id));
    }

    // -------------------------
    // UPDATE PROBLEM
    // -------------------------
    @PutMapping("/{id}")
    public ApiResponse updateProblem(
            @PathVariable Long id,
            @Valid @RequestBody ProblemUpdateRequest request
    ) {
        Problem updated = problemService.updateProblem(id, request);
        return ApiResponse.success(updated);
    }

    // -------------------------
    // DELETE PROBLEM
    // -------------------------
    @DeleteMapping("/{id}")
    public ApiResponse deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
        return ApiResponse.success("Problem deleted successfully");
    }
}
