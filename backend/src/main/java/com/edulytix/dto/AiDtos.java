package com.edulytix.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/** DTOs for communication with the FastAPI AI microservice. */
public class AiDtos {

    @Data
    public static class AiRequest {
        private List<String> feedbacks;
    }

    @Data
    public static class AiResponse {
        private String overall_sentiment;
        private Map<String, Double> sentiment_distribution;
        private List<String> top_keywords;
        private String summary;
        private List<String> strengths;
        private List<String> improvement_areas;
    }
}
