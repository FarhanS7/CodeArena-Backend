package com.codearena.problemservice.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

import com.codearena.problemservice.problem.Problem;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic topic;
    private final ObjectMapper objectMapper;

    public void indexProblem(Problem problem) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("event", "PROBLEM_CREATED");
            
            Map<String, Object> data = new HashMap<>();
            data.put("id", problem.getId());
            data.put("title", problem.getTitle());
            data.put("description", problem.getDescription());
            data.put("difficulty", problem.getDifficulty().toString());
            data.put("published", problem.isPublished());
            data.put("tags", problem.getTags());
            
            message.put("data", data);
            
            redisTemplate.convertAndSend(topic.getTopic(), message);
        } catch (Exception e) {
            System.err.println("Failed to publish problem event: " + e.getMessage());
        }
    }

    public void deleteProblem(Long id) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("event", "PROBLEM_DELETED");
            message.put("data", Map.of("id", id));
            
            redisTemplate.convertAndSend(topic.getTopic(), message);
        } catch (Exception e) {
            System.err.println("Failed to publish delete event: " + e.getMessage());
        }
    }

    // This method is now deprecated as we want to use the SearchService (NestJS)
    public java.util.List<java.util.Map<String, Object>> searchProblems(String query) {
        return java.util.List.of();
    }
}
