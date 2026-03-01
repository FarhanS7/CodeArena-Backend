package com.codearena.problemservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codearena.problemservice.model.TestCase;
import com.codearena.problemservice.response.ApiResponse;
import com.codearena.problemservice.service.ProblemService;

@RestController
@RequestMapping("/admin/problems")
public class AdminTestCaseController {

    private final ProblemService problemService;

    public AdminTestCaseController(ProblemService problemService) {
        this.problemService = problemService;
    }

    // ------------------------------
    // CREATE TEST CASE for a problem
    // ------------------------------
    @PostMapping("/{problemId}/testcases")
    public ApiResponse addTestCase(
            @PathVariable Long problemId,
            @RequestBody TestCase dto
    ) {
        TestCase saved = problemService.addTestCase(problemId, dto);
        return ApiResponse.success(saved);
    }

    // ------------------------------
    // GET HIDDEN TEST CASES
    // ------------------------------
    @GetMapping("/{problemId}/testcases")
    public ApiResponse getTestCases(
            @PathVariable Long problemId
    ) {
        List<TestCase> tests = problemService.getTestCases(problemId);
        return ApiResponse.success(tests);
    }

    // ------------------------------
    // DELETE TEST CASE
    // ------------------------------
    @DeleteMapping("/testcases/{testCaseId}")
    public ApiResponse deleteTestCase(
            @PathVariable Long testCaseId
    ) {
        problemService.deleteTestCase(testCaseId);
        return ApiResponse.success("Test case deleted");
    }
}
