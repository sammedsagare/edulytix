package com.edulytix.backend.controllers;

import com.edulytix.backend.dto.FeedbackRequestDTO;
import com.edulytix.backend.service.AiClientService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final AiClientService aiClientService;

    public FeedbackController(AiClientService aiClientService) {
        this.aiClientService = aiClientService;
    }

    @PostMapping
    public Map<String, Object> receiveFeedback(@RequestBody FeedbackRequestDTO request) {
        return aiClientService.analyzeFeedback(request.getText());
    }
}
