package com.codearena.problemservice.response;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiResponse {

    private boolean success;
    private String message;
    private Object data;
    private List<String> errors;

    // -------------------------------
    // SUCCESS RESPONSE
    // -------------------------------
    public static ApiResponse success(Object data) {
        ApiResponse r = new ApiResponse();
        r.success = true;
        r.data = data;
        return r;
    }

    // -------------------------------
    // SIMPLE ERROR
    // -------------------------------
    public static ApiResponse error(String message) {
        ApiResponse r = new ApiResponse();
        r.success = false;
        r.message = message;
        return r;
    }

    // -------------------------------
    // ERROR WITH LIST OF ERRORS
    // -------------------------------
    public static ApiResponse error(String message, List<String> errors) {
        ApiResponse r = new ApiResponse();
        r.success = false;
        r.message = message;
        r.errors = errors;
        return r;
    }

    // -------------------------------
    // ERROR WITH ANY ERROR OBJECT
    // -------------------------------
    public static ApiResponse errorObject(String message, Object errors) {
        ApiResponse r = new ApiResponse();
        r.success = false;
        r.message = message;
        r.errors = (errors instanceof List<?> list)
                ? list.stream().map(Object::toString).toList()
                : List.of(errors.toString());
        return r;
    }
}
