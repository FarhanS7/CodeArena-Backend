package com.codearena.problemservice.controller;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestCaseRequest {

    @NotBlank(message = "Input cannot be empty")
    private String input;

    @NotBlank(message = "Expected output cannot be empty")
    private String expectedOutput;
}
