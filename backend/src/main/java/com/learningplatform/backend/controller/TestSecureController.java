package com.learningplatform.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lightweight endpoints used during security configuration testing.
 *
 * <p>These routes help verify JWT authentication and role-based
 * access control behaviour during backend integration testing.</p>
 */
@RestController
public class TestSecureController {

    /**
     * Verifies that authenticated requests can access protected endpoints.
     */
    @GetMapping("/api/secure/test")
    public String secureTest() {
        return "You have accessed a protected endpoint";
    }

    /**
     * Verifies instructor-only role restrictions.
     *
     * <p>The endpoint is intentionally simple because its purpose is
     * validating Spring Security configuration rather than business logic.</p>
     */
    @GetMapping("/api/test/instructor")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public String instructorOnly() {
        return "Only instructor can access";
    }
}