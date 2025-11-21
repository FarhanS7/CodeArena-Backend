package com.codearena.problemservice.controller;

import java.util.List;

import org.hibernate.validator.constraints.NotEmpty;

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
    @Size(min = 10, message = "Description must be at least 10 characters long")
    private String description;

    private String exampleInput;
    private String exampleOutput;

    @Valid
    @NotEmpty(message = "Problem must have at least 1 test case")
    private List<TestCaseRequest> testCases;
}
