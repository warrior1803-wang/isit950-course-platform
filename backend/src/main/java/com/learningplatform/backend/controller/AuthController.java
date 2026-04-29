package com.learningplatform.backend.controller;

import com.learningplatform.backend.dto.AuthResponse;
import com.learningplatform.backend.dto.AuthUserResponse;
import com.learningplatform.backend.dto.LoginRequest;
import com.learningplatform.backend.dto.RegisterRequest;
import com.learningplatform.backend.service.AuthService;
import com.learningplatform.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Login successful", response);
    }

    @GetMapping("/me")
    public ApiResponse<AuthUserResponse> getCurrentUser() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        AuthUserResponse response = authService.getCurrentUserResponse(email);

        return ApiResponse.success("User fetched successfully", response);
    }
}