package com.edulytix.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.*;

@Service
public class AiClientService {

    private final RestTemplate restTemplate;

    public AiClientService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> analyzeFeedback(String text) {

        String url = "http://localhost:8000/analyze";

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("text", text);

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, requestBody, Map.class);

            Map<String, Object> body = response.getBody();

            if (body == null) {
                throw new RuntimeException("Empty response from AI service");
            }

            String sentiment = body.getOrDefault("sentiment", "Neutral").toString();

            List<String> keywords =
                    body.get("keywords") instanceof List
                            ? (List<String>) body.get("keywords")
                            : List.of();

            return Map.of(
                    "sentiment", sentiment,
                    "keywords", keywords
            );

        } catch (Exception e) {
            e.printStackTrace();

            // fallback so frontend never crashes
            return Map.of(
                    "sentiment", "Neutral",
                    "keywords", List.of()
            );
        }
    }
}