package com.codearena.problemservice.exception;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import com.codearena.problemservice.response.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse handleValidationError(MethodArgumentNotValidException ex) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getDefaultMessage())
                .collect(Collectors.toList());

        return ApiResponse.error("Validation failed", errors);
    }

    // Handle generic exceptions
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse handleRuntime(RuntimeException ex) {
        return ApiResponse.error(ex.getMessage());
    }
}
