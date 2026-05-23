package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.AuthResponse;
import com.learningplatform.backend.dto.AuthUserResponse;
import com.learningplatform.backend.dto.LoginRequest;
import com.learningplatform.backend.dto.RegisterRequest;
import com.learningplatform.backend.dto.UpdateProfileRequest;
import com.learningplatform.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Handles authentication and current-user profile operations.
 *
 * <p>The controller exposes endpoints for registration, login, and profile
 * management. Authentication itself is stateless and backed by JWT tokens,
 * so authenticated requests rely on the Spring Security context rather than
 * traditional HTTP sessions.</p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registers a new platform user and immediately returns an authentication token.
     *
     * <p>Validation is performed before the service layer executes so malformed
     * registration requests fail consistently with HTTP 400 responses.</p>
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        AuthResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    /**
     * Authenticates a user and returns a signed JWT token.
     *
     * <p>The returned token is later attached to protected requests through the
     * Authorization header by the frontend API client.</p>
     */
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        AuthResponse response = authService.login(request);

        return ApiResponse.success("Login successful", response);
    }

    /**
     * Returns profile information for the currently authenticated user.
     *
     * <p>The authenticated identity is retrieved from the Spring Security context,
     * which was populated earlier by the JWT authentication filter.</p>
     */
    @GetMapping("/me")
    public ApiResponse<AuthUserResponse> getCurrentUser() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        AuthUserResponse response = authService.getCurrentUserResponse(email);

        return ApiResponse.success("User fetched successfully", response);
    }

    /**
     * Updates editable profile fields for the authenticated user.
     *
     * <p>The update flow supports partial profile changes while still enforcing
     * validation rules defined in the request DTO.</p>
     */
    @PutMapping("/me")
    public ApiResponse<AuthUserResponse> updateCurrentUser(
            @Valid @RequestBody UpdateProfileRequest request
    ) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        AuthUserResponse response = authService.updateCurrentUser(email, request);

        return ApiResponse.success("Profile updated successfully", response);
    }
}