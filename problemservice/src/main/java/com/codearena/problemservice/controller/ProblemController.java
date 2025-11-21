package com.codearena.problemservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.problem.Difficulty;
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

        // Convert DTO → Entity
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
    // SEARCH + FILTER + PAGINATION
    // -------------------------
    @GetMapping("/search")
    public ApiResponse searchProblems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String search) {

        Page<Problem> result = problemService.searchProblems(difficulty, search, page, size);

        return ApiResponse.success(
                Map.of(
                        "items", result.getContent(),
                        "page", result.getNumber(),
                        "size", result.getSize(),
                        "totalItems", result.getTotalElements(),
                        "totalPages", result.getTotalPages()
                )
        );
    }

    // -------------------------
    // GET ONE PROBLEM
    // -------------------------
    @GetMapping("/{id}")
    public ApiResponse getProblem(@PathVariable Long id) {
        return ApiResponse.success(problemService.getProblemById(id));
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
