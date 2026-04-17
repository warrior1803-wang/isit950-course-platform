package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.AnnouncementResponse;
import com.learningplatform.backend.dto.AssignmentListResponse;
import com.learningplatform.backend.dto.PostRequest;
import com.learningplatform.backend.dto.PostResponse;
import com.learningplatform.backend.dto.ReplyRequest;
import com.learningplatform.backend.dto.ReplyResponse;
import com.learningplatform.backend.service.CourseContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CourseContentController {

    private final CourseContentService courseContentService;

    @GetMapping("/api/announcements/{courseId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAnnouncements(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Announcements fetched successfully",
                        courseContentService.getAnnouncements(courseId, authentication.getName())
                )
        );
    }

    @GetMapping("/api/assignments/{courseId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AssignmentListResponse>>> getAssignments(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Assignments fetched successfully",
                        courseContentService.getAssignments(courseId, authentication.getName())
                )
        );
    }

    @GetMapping("/api/forum/{courseId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getPosts(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Posts fetched successfully",
                        courseContentService.getPosts(courseId, authentication.getName())
                )
        );
    }

    @PostMapping("/api/forum/{courseId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @PathVariable Long courseId,
            @RequestBody PostRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Post created successfully",
                        courseContentService.createPost(courseId, request, authentication.getName())
                )
        );
    }

    @PostMapping("/api/forum/posts/{postId}/replies")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<ReplyResponse>> createReply(
            @PathVariable Long postId,
            @RequestBody ReplyRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Reply created successfully",
                        courseContentService.createReply(postId, request, authentication.getName())
                )
        );
    }
}
