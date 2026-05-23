package com.learningplatform.backend.controller;

import com.learningplatform.backend.dto.CourseProgressResponse;
import com.learningplatform.backend.dto.MyProgressResponse;
import com.learningplatform.backend.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Exposes progress tracking endpoints for courses and submissions.
 *
 * <p>The platform provides different progress views depending on role.
 * Instructors receive aggregated course-level analytics, while students
 * receive their own assignment and completion progress.</p>
 */
@RestController
@RequestMapping("/api/courses/{courseId}/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * Returns aggregated progress information for an instructor-owned course.
     *
     * <p>The response may include completion rates, submission counts,
     * grading progress, and student participation statistics.</p>
     */
    @GetMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            Authentication authentication
    ) {

        CourseProgressResponse response =
                progressService.getCourseProgress(
                        courseId,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Returns the authenticated student's personal course progress.
     *
     * <p>This endpoint supports student dashboards that display assignment
     * completion state, submission history, and grading outcomes.</p>
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MyProgressResponse> getMyProgress(
            @PathVariable Long courseId,
            Authentication authentication
    ) {

        MyProgressResponse response =
                progressService.getMyProgress(
                        courseId,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }
}