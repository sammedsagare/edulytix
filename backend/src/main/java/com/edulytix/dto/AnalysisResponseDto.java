package com.edulytix.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO returned to the frontend for a single analysis result.
 */
@Data
public class AnalysisResponseDto {
    private Long id;
    private String fileName;
    private String selectedColumn;
    private Integer rowCount;
    private String overallSentiment;
    private Object sentimentDistribution; // parsed JSON map
    private List<String> keywords;
    private String summary;
    private List<String> strengths;
    private List<String> improvementAreas;
    private LocalDateTime createdAt;
}
