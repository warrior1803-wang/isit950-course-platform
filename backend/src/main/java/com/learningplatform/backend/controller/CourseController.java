package com.learningplatform.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @GetMapping
    public String getCourses() {
        return "Course list";
    }

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public String createCourse() {
        return "Course created";
    }
}