package com.learningplatform.lms.auth.controller;

import com.learningplatform.lms.auth.dto.AuthResponse;
import com.learningplatform.lms.auth.dto.LoginRequest;
import com.learningplatform.lms.auth.dto.RegisterRequest;
import com.learningplatform.lms.auth.service.AuthService;
import com.learningplatform.lms.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ApiResponse.success("User registered successfully", response);
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Login successful", response);
    }
}