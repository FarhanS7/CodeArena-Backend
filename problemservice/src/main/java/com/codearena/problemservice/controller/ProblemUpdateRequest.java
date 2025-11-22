package com.codearena.problemservice.controller;

import java.util.List;

import com.codearena.problemservice.problem.Difficulty;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProblemUpdateRequest {

    @NotBlank
    private String title;

    private Difficulty difficulty;

    @NotBlank
    private String description;

    private String exampleInput;
    private String exampleOutput;

    private List<TestCaseRequest> testCases;

    @Getter
    @Setter
    public static class TestCaseRequest {
        private Long id; // null = new test case
        private String input;
        private String expectedOutput;
    }
}
