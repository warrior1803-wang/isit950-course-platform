package com.learningplatform.backend.controller;

import com.learningplatform.backend.dto.CourseProgressResponse;
import com.learningplatform.backend.dto.MyProgressResponse;
import com.learningplatform.backend.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/{courseId}/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        CourseProgressResponse response =
                progressService.getCourseProgress(courseId, authentication.getName());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MyProgressResponse> getMyProgress(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        MyProgressResponse response =
                progressService.getMyProgress(courseId, authentication.getName());

        return ResponseEntity.ok(response);
    }
}