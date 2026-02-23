package com.edulytix.backend.controllers;

import com.edulytix.backend.dto.ColumnSelectionDTO;
import com.edulytix.backend.service.AiClientService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final AiClientService aiClientService;

    private List<Map<String, String>> cachedRows = new ArrayList<>();
    private List<String> headers = new ArrayList<>();

    public FeedbackController(AiClientService aiClientService) {
        this.aiClientService = aiClientService;
    }

    // 1️⃣ Extract columns only
    @PostMapping("/columns")
    public Map<String, Object> extractColumns(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        cachedRows.clear();
        headers.clear();

        BufferedReader reader =
                new BufferedReader(new InputStreamReader(file.getInputStream()));

        String headerLine = reader.readLine();
        if (headerLine == null) {
            return Map.of("columns", List.of());
        }

        headers = Arrays.asList(headerLine.split(","));

        String line;
        while ((line = reader.readLine()) != null) {
            String[] values = line.split(",");
            Map<String, String> row = new HashMap<>();

            for (int i = 0; i < headers.size() && i < values.length; i++) {
                row.put(headers.get(i), values[i]);
            }

            cachedRows.add(row);
        }

        return Map.of("columns", headers);
    }

    // 2️⃣ Analyze selected column
    @PostMapping("/batch")
    public Map<String, Object> analyzeSelectedColumn(
            @RequestBody ColumnSelectionDTO selection
    ) {

        String columnName = selection.getColumnName();

        List<String> feedbacks = new ArrayList<>();

        for (Map<String, String> row : cachedRows) {
            if (row.containsKey(columnName)) {
                feedbacks.add(row.get(columnName));
            }
        }

        return aiClientService.analyzeBatch(feedbacks);
    }
}