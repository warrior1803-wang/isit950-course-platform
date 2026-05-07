package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.exception.PostLimitException;
import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.AnnouncementRequest;
import com.learningplatform.backend.dto.AnnouncementResponse;
import com.learningplatform.backend.dto.AssignmentListResponse;
import com.learningplatform.backend.dto.EnrolmentResponse;
import com.learningplatform.backend.dto.PostLimitResponse;
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
import org.springframework.web.bind.annotation.PutMapping;

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

    @PutMapping("/announcements/{announcementId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> updateAnnouncement(
            @PathVariable Long courseId,
            @PathVariable Long announcementId,
            @RequestBody AnnouncementRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Announcement updated successfully",
                        courseContentService.updateAnnouncement(
                                courseId,
                                announcementId,
                                request,
                                authentication.getName()
                        )
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
    public ResponseEntity<?> createPost(
            @PathVariable Long courseId,
            @RequestBody PostRequest request,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ApiResponse.success(
                            "Post created successfully",
                            courseContentService.createPost(courseId, request, authentication.getName())
                    )
            );
        } catch (PostLimitException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new PostLimitResponse("Post limit reached", true));
        }
    }

    @PostMapping("/posts/{postId}/replies")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<?> createReply(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            @RequestBody ReplyRequest request,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ApiResponse.success(
                            "Reply created successfully",
                            courseContentService.createReply(courseId, postId, request, authentication.getName())
                    )
            );
        } catch (PostLimitException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new PostLimitResponse("Post limit reached", true));
        }
    }

    @DeleteMapping("/posts/{postId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            Authentication authentication
    ) {
        courseContentService.deletePost(courseId, postId, authentication.getName());
        return ResponseEntity.ok(
                ApiResponse.success("Post deleted", null)
        );
    }

    @DeleteMapping("/posts/{postId}/replies/{replyId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> deleteReply(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            @PathVariable Long replyId,
            Authentication authentication
    ) {
        courseContentService.deleteReply(courseId, postId, replyId, authentication.getName());
        return ResponseEntity.ok(
                ApiResponse.success("Reply deleted", null)
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

    @GetMapping("/enrolments")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<EnrolmentResponse>>> getEnrolments(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Enrolments fetched successfully",
                        courseContentService.getEnrolments(courseId, authentication.getName())
                )
        );
    }
}
