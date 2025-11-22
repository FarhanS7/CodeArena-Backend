package com.codearena.problemservice.controller;

import java.util.List;

import com.codearena.problemservice.problem.Difficulty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProblemRequest {

    @NotBlank(message = "Title cannot be empty")
    private String title;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotBlank(message = "Description cannot be empty")
    @Size(min = 20, message = "Description must be at least 20 characters")
    private String description;

    private String exampleInput;
    private String exampleOutput;

    @Valid
    @NotNull(message = "Test cases must not be null")
    @Size(min = 1, message = "At least one test case is required")
    private List<TestCaseRequest> testCases;
}
