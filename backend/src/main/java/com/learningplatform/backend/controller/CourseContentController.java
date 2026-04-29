package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.AnnouncementRequest;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}")
@RequiredArgsConstructor
public class CourseContentController {

    private final CourseContentService courseContentService;

    @GetMapping("/announcements")
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

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @PathVariable Long courseId,
            @RequestBody AnnouncementRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Announcement created successfully",
                        courseContentService.createAnnouncement(courseId, request, authentication.getName())
                )
        );
    }

    @GetMapping("/assignments")
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

    @GetMapping("/posts")
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

    @GetMapping("/posts/{postId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Post fetched successfully",
                        courseContentService.getPost(courseId, postId, authentication.getName())
                )
        );
    }

    @PostMapping("/posts")
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

    @PostMapping("/posts/{postId}/replies")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<ReplyResponse>> createReply(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            @RequestBody ReplyRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Reply created successfully",
                        courseContentService.createReply(courseId, postId, request, authentication.getName())
                )
        );
    }

    @DeleteMapping("/announcements/{announcementId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable Long courseId,
            @PathVariable Long announcementId,
            Authentication authentication
    ) {
        boolean deleted = courseContentService.deleteAnnouncement(
                courseId,
                announcementId,
                authentication.getName()
        );

        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Announcement not found"));
        }

        return ResponseEntity.ok(
                ApiResponse.success("Announcement deleted", null)
        );
    }
}
