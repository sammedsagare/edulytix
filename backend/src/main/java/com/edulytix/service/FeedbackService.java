package com.edulytix.service;

import com.edulytix.dto.AiDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import com.edulytix.dto.AnalysisResponseDto;
import com.edulytix.entity.FeedbackAnalysis;
import com.edulytix.entity.User;
import com.edulytix.repository.FeedbackAnalysisRepository;
import com.edulytix.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates CSV parsing → AI service call → result persistence.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final RestTemplate aiRestTemplate;

@Value("${ai.service.url}")
private String aiServiceUrl;
    private final ObjectMapper objectMapper;

    private static final int MAX_ROWS = 2000;

    /**
     * Parse the uploaded CSV, extract the selected column, call the AI service,
     * persist the result, and return the DTO.
     */
    public AnalysisResponseDto analyze(MultipartFile file, String columnName, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        // 1. Parse CSV
        List<String> feedbackTexts = extractColumn(file, columnName);
        if (feedbackTexts.isEmpty()) {
            throw new IllegalArgumentException("No data found in column: " + columnName);
        }

        log.info("Extracted {} rows from column '{}' in file '{}'",
                feedbackTexts.size(), columnName, file.getOriginalFilename());

        // 2. Call AI service
        AiDtos.AiRequest aiRequest = new AiDtos.AiRequest();
        aiRequest.setFeedbacks(feedbackTexts);

        AiDtos.AiResponse aiResponse = aiRestTemplate.postForObject(
        aiServiceUrl + "/analyze-batch",
        aiRequest,
        AiDtos.AiResponse.class
);

        if (aiResponse == null) {
            throw new RuntimeException("AI service returned null response");
        }

        // 3. Persist to DB
        FeedbackAnalysis analysis = buildEntity(user, file, columnName, feedbackTexts.size(), aiResponse);
        analysisRepository.save(analysis);
        log.info("Analysis saved with id={} for user={}", analysis.getId(), userEmail);

        // 4. Map to DTO
        return toDto(analysis, aiResponse);
    }

    /**
     * Return the analysis history for the authenticated user.
     */
    public List<AnalysisResponseDto> getHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        return analysisRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::entityToDto)
                .toList();
    }

    /**
     * Return the headers (column names) of an uploaded CSV without storing anything.
     */
    public List<String> getColumns(MultipartFile file) {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {
            return new ArrayList<>(parser.getHeaderNames());
        } catch (Exception e) {
            throw new RuntimeException("Failed to read CSV headers: " + e.getMessage(), e);
        }
    }

    // Private helpers

    private List<String> extractColumn(MultipartFile file, String columnName) {
        List<String> rows = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                if (rows.size() >= MAX_ROWS) break;
                if (record.isMapped(columnName)) {
                    String val = record.get(columnName).trim();
                    if (!val.isEmpty()) rows.add(val);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("CSV parsing error: " + e.getMessage(), e);
        }
        return rows;
    }

    private FeedbackAnalysis buildEntity(User user, MultipartFile file,
                                         String column, int rowCount,
                                         AiDtos.AiResponse ai) {
        try {
            return FeedbackAnalysis.builder()
                    .user(user)
                    .fileName(file.getOriginalFilename())
                    .selectedColumn(column)
                    .rowCount(rowCount)
                    .overallSentiment(ai.getOverall_sentiment())
                    .sentimentDistribution(objectMapper.writeValueAsString(ai.getSentiment_distribution()))
                    .keywords(objectMapper.writeValueAsString(ai.getTop_keywords()))
                    .summary(ai.getSummary())
                    .strengths(objectMapper.writeValueAsString(ai.getStrengths()))
                    .improvementAreas(objectMapper.writeValueAsString(ai.getImprovement_areas()))
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize AI response: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private AnalysisResponseDto toDto(FeedbackAnalysis entity, AiDtos.AiResponse ai) {
        AnalysisResponseDto dto = new AnalysisResponseDto();
        dto.setId(entity.getId());
        dto.setFileName(entity.getFileName());
        dto.setSelectedColumn(entity.getSelectedColumn());
        dto.setRowCount(entity.getRowCount());
        dto.setOverallSentiment(ai.getOverall_sentiment());
        dto.setSentimentDistribution(ai.getSentiment_distribution());
        dto.setKeywords(ai.getTop_keywords());
        dto.setSummary(ai.getSummary());
        dto.setStrengths(ai.getStrengths());
        dto.setImprovementAreas(ai.getImprovement_areas());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    @SuppressWarnings("unchecked")
    private AnalysisResponseDto entityToDto(FeedbackAnalysis entity) {
        AnalysisResponseDto dto = new AnalysisResponseDto();
        dto.setId(entity.getId());
        dto.setFileName(entity.getFileName());
        dto.setSelectedColumn(entity.getSelectedColumn());
        dto.setRowCount(entity.getRowCount());
        dto.setOverallSentiment(entity.getOverallSentiment());
        dto.setCreatedAt(entity.getCreatedAt());

        try {
            if (entity.getSentimentDistribution() != null)
                dto.setSentimentDistribution(objectMapper.readValue(entity.getSentimentDistribution(), Map.class));
            if (entity.getKeywords() != null)
                dto.setKeywords(objectMapper.readValue(entity.getKeywords(), List.class));
            if (entity.getSummary() != null)
                dto.setSummary(entity.getSummary());
            if (entity.getStrengths() != null)
                dto.setStrengths(objectMapper.readValue(entity.getStrengths(), List.class));
            if (entity.getImprovementAreas() != null)
                dto.setImprovementAreas(objectMapper.readValue(entity.getImprovementAreas(), List.class));
        } catch (Exception e) {
            log.warn("Failed to deserialize JSON fields for analysis id={}: {}", entity.getId(), e.getMessage());
        }
        return dto;
    }
}
