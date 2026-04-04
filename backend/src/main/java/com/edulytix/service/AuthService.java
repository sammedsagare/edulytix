package com.edulytix.service;

import com.edulytix.dto.AuthDtos;
import com.edulytix.entity.User;
import com.edulytix.repository.UserRepository;
import com.edulytix.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Business logic for user signup and login.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user.
     * Throws IllegalArgumentException if email is already taken.
     */
    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String token = jwtUtils.generateToken(user.getEmail());
        return new AuthDtos.AuthResponse(token, user.getEmail(), "Signup successful");
    }

    /**
     * Authenticate existing user and return a JWT.
     */
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String email = auth.getName();
        String token = jwtUtils.generateToken(email);
        log.info("User logged in: {}", email);
        return new AuthDtos.AuthResponse(token, email, "Login successful");
    }
}
