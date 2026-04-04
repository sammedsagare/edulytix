package com.edulytix.controller;

import com.edulytix.dto.AnalysisResponseDto;
import com.edulytix.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Protected REST controller for CSV upload/analysis and history retrieval.
 * All endpoints require a valid Bearer JWT token.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class FeedbackController {

    private final FeedbackService feedbackService;

    /**
     * POST /api/columns
     * Accepts a CSV and returns its header columns for the user to pick from.
     */
    @PostMapping("/columns")
    public ResponseEntity<?> getColumns(@RequestParam("file") MultipartFile file) {
        try {
            List<String> columns = feedbackService.getColumns(file);
            return ResponseEntity.ok(columns);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Could not read columns: " + e.getMessage()));
        }
    }

    /**
     * POST /api/upload
     * Full analysis pipeline: parse CSV → AI → persist → return results.
     *
     * @param file       the uploaded CSV file
     * @param column     the name of the feedback column to analyse
     * @param userDetails injected from JWT SecurityContext
     */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("column") String column,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("Upload request from user={} file={} column={}",
                    userDetails.getUsername(), file.getOriginalFilename(), column);

            AnalysisResponseDto result = feedbackService.analyze(file, column, userDetails.getUsername());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Analysis failed", e);
            return ResponseEntity.internalServerError()
                    .body(new ErrorResponse("Analysis failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/history
     * Returns all past analyses for the authenticated user, newest first.
     */
    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResponseDto>> history(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AnalysisResponseDto> history = feedbackService.getHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

    record ErrorResponse(String error) {}
}
