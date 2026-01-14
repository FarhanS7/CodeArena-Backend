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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "Problems", description = "Problem CRUD & Search API")
@RestController
@RequestMapping("/problems")
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
@lombok.extern.slf4j.Slf4j
public class ProblemController {

    private final ProblemService problemService;

    public ProblemController(ProblemService problemService) {
        this.problemService = problemService;
    }

    // -------------------------
    // CREATE PROBLEM
    // -------------------------
    @Operation(
    summary = "Create a new coding problem",
    description = "Creates a problem along with metadata and test cases"
)
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

    // -----------------------
    // GET ALL PROBLEMS (PAGINATED)
    // -----------------------
    @Operation(
        summary = "Get all problems (paginated)",
        description = "Returns a paginated list of all public coding problems"
    )
    @GetMapping
    public ApiResponse getAllProblems(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size
    ) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ApiResponse.success(problemService.getAllProblems(pageable));
    }

    // -------------------------
    // GET ONE PROBLEM
    // -------------------------
    @Operation(
    summary = "Get problem by ID",
    description = "Fetch full problem data including metadata"
)
    @GetMapping("/{id}")
    public ApiResponse getProblem(@PathVariable Long id) {
        log.info("Received request for problem ID: {}", id);
        return ApiResponse.success(problemService.getProblemById(id));
    }

    // -------------------------
    // UPDATE PROBLEM
    // -------------------------
    @Operation(
    summary = "Update problem",
    description = "Update the problem and its test cases"
)
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
@Operation(
    summary = "Delete problem",
    description = "Deletes the problem and its test cases"
)
    @DeleteMapping("/{id}")
    public ApiResponse deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
        return ApiResponse.success("Problem deleted successfully");
    }
}
