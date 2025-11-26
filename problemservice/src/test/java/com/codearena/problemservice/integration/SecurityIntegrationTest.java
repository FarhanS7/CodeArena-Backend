package com.codearena.problemservice.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Collections;
import java.util.Date;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.codearena.problemservice.controller.ProblemRequest;
import com.codearena.problemservice.controller.TestCaseRequest;
import com.codearena.problemservice.problem.Difficulty;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private final String JWT_SECRET = "supersecretkeythatshouldbechangedinproduction";

    private String generateToken(String username, String role) {
        Key key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setSubject("123")
                .claim("username", username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 15))
                .signWith(key)
                .compact();
    }

    @Test
    void publicEndpoint_ShouldBeAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/problems"))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_ShouldReturn403_WhenNoToken() throws Exception {
        ProblemRequest request = new ProblemRequest();
        request.setTitle("Test Problem");
        request.setDescription("Desc");
        request.setDifficulty(Difficulty.EASY);
        request.setExampleInput("1");
        request.setExampleOutput("1");
        request.setTestCases(Collections.emptyList());

        mockMvc.perform(post("/problems")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedEndpoint_ShouldReturn403_WhenUserRole() throws Exception {
        String token = generateToken("user", "USER");
        
        ProblemRequest request = new ProblemRequest();
        request.setTitle("Test Problem");
        request.setDescription("Desc");
        request.setDifficulty(Difficulty.EASY);
        request.setExampleInput("1");
        request.setExampleOutput("1");
        request.setTestCases(Collections.emptyList());

        mockMvc.perform(post("/problems")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedEndpoint_ShouldReturn200_WhenAdminRole() throws Exception {
        String token = generateToken("admin", "ADMIN");

        ProblemRequest request = new ProblemRequest();
        request.setTitle("Admin Problem");
        request.setDescription("This is a valid description that is long enough.");
        request.setDifficulty(Difficulty.HARD);
        request.setExampleInput("1");
        request.setExampleOutput("1");
        
        TestCaseRequest tc = new TestCaseRequest();
        tc.setInput("1");
        tc.setExpectedOutput("1");
        request.setTestCases(Collections.singletonList(tc));

        mockMvc.perform(post("/problems")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
