package com.edulytix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Shared DTOs for authentication requests and responses. */
public class AuthDtos {

    @Data
    public static class SignupRequest {
        @NotBlank @Email
        private String email;

        @NotBlank @Size(min = 6, max = 100)
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String email;
        private String message;

        public AuthResponse(String token, String email, String message) {
            this.token   = token;
            this.email   = email;
            this.message = message;
        }
    }
}
