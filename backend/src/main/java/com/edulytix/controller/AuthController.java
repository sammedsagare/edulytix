package com.edulytix.controller;

import com.edulytix.dto.AuthDtos;
import com.edulytix.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication: signup and login.
 * These endpoints are public (no JWT required).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/signup
     * Registers a new user and returns a JWT token.
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody AuthDtos.SignupRequest request) {
        try {
            AuthDtos.AuthResponse response = authService.signup(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/auth/login
     * Authenticates a user and returns a JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        try {
            AuthDtos.AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid email or password"));
        }
    }

    // Simple error wrapper
    record ErrorResponse(String error) {}
}
