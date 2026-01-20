package com.codearena.problemservice.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.codearena.problemservice.problem.Problem;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Config;
import com.meilisearch.sdk.Index;
import com.meilisearch.sdk.json.JacksonJsonHandler;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ObjectMapper objectMapper;
    private Client client;
    private final String indexName = "problems";

    @Value("${meilisearch.host:http://meilisearch:7700}")
    private String host;

    @Value("${meilisearch.apiKey:masterKey123}")
    private String apiKey;

    @PostConstruct
    public void init() {
        this.client = new Client(
            new Config(
                host, 
                apiKey, 
                new JacksonJsonHandler(objectMapper)
            )
        );
    }

    public void indexProblem(Problem problem) {
        try {
            Index index = client.index(indexName);
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", problem.getId());
            doc.put("title", problem.getTitle());
            doc.put("description", problem.getDescription());
            doc.put("difficulty", problem.getDifficulty().toString());
            
            // Meilisearch addDocuments expects a JSON string
            String jsonDocuments = objectMapper.writeValueAsString(new Map[]{doc});
            index.addDocuments(jsonDocuments);
        } catch (Exception e) {
            // Log error but don't break main flow
            System.err.println("Failed to index problem in Meilisearch: " + e.getMessage());
        }
    }

    public void deleteProblem(Long id) {
        try {
            client.index(indexName).deleteDocument(id.toString());
        } catch (Exception e) {
            System.err.println("Failed to delete problem from Meilisearch: " + e.getMessage());
        }
    }

    public java.util.List<java.util.Map<String, Object>> searchProblems(String query) {
        try {
            return client.index(indexName).search(query).getHits();
        } catch (Exception e) {
            throw new RuntimeException("Search failed: " + e.getMessage());
        }
    }
}
