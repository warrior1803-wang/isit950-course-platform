package com.learningplatform.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestSecureController {

    @GetMapping("/api/secure/test")
    public String secureTest() {
        return "You have accessed a protected endpoint";
    }

    @GetMapping("/api/test/instructor")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public String instructorOnly() {
        return "Only instructor can access";
    }
}