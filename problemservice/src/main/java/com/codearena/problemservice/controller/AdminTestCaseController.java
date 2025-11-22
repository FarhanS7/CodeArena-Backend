package com.codearena.problemservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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

    // --- Simple admin key check ---
    private void checkAdmin(String key) {
        if (key == null || !key.equals("MY_ADMIN_KEY_123")) {
            throw new RuntimeException("Unauthorized admin access");
        }
    }

    // ------------------------------
    // CREATE TEST CASE for a problem
    // ------------------------------
    @PostMapping("/{problemId}/testcases")
    public ApiResponse addTestCase(
            @RequestHeader("X-ADMIN-KEY") String adminKey,
            @PathVariable Long problemId,
            @RequestBody TestCase dto
    ) {
        checkAdmin(adminKey);

        TestCase saved = problemService.addTestCase(problemId, dto);
        return ApiResponse.success(saved);
    }

    // ------------------------------
    // GET HIDDEN TEST CASES
    // ------------------------------
    @GetMapping("/{problemId}/testcases")
    public ApiResponse getTestCases(
            @RequestHeader("X-ADMIN-KEY") String adminKey,
            @PathVariable Long problemId
    ) {
        checkAdmin(adminKey);

        List<TestCase> tests = problemService.getTestCases(problemId);
        return ApiResponse.success(tests);
    }

    // ------------------------------
    // DELETE TEST CASE
    // ------------------------------
    @DeleteMapping("/testcases/{testCaseId}")
    public ApiResponse deleteTestCase(
            @RequestHeader("X-ADMIN-KEY") String adminKey,
            @PathVariable Long testCaseId
    ) {
        checkAdmin(adminKey);

        problemService.deleteTestCase(testCaseId);
        return ApiResponse.success("Test case deleted");
    }
}
