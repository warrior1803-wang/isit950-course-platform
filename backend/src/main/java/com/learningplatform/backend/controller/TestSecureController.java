package com.learningplatform.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestSecureController {

    @GetMapping("/api/secure/test")
    public String secureTest() {
        return "You have accessed a protected endpoint";
    }
}