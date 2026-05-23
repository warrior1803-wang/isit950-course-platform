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
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Manages course-level collaborative content such as announcements,
 * discussion posts, replies, assignments, and enrolment views.
 *
 * <p>The controller supports both instructor-facing management workflows
 * and student-facing participation features within a course context.</p>
 */
@RestController
@RequestMapping("/api/courses/{courseId}")
@RequiredArgsConstructor
public class CourseContentController {

    private final CourseContentService courseContentService;

    /**
     * Returns all announcements visible to enrolled users.
     *
     * <p>Announcements act as instructor-controlled course communication
     * records and are accessible to both students and instructors.</p>
     */
    @GetMapping("/announcements")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAnnouncements(
            @PathVariable Long courseId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Announcements fetched successfully",
                        courseContentService.getAnnouncements(
                                courseId,
                                authentication.getName()
                        )
                )
        );
    }

    /**
     * Creates a new course announcement.
     *
     * <p>Only instructors may publish announcements because they represent
     * official course communication visible to enrolled students.</p>
     */
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
                        courseContentService.createAnnouncement(
                                courseId,
                                request,
                                authentication.getName()
                        )
                )
        );
    }

    /**
     * Updates an existing announcement.
     *
     * <p>The service layer verifies instructor ownership before changes are applied.</p>
     */
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

    /**
     * Returns assignment summaries for a course.
     *
     * <p>The detailed assignment workflow is handled through the dedicated
     * assignment controller, while this endpoint supports overview displays.</p>
     */
    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AssignmentListResponse>>> getAssignments(
            @PathVariable Long courseId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Assignments fetched successfully",
                        courseContentService.getAssignments(
                                courseId,
                                authentication.getName()
                        )
                )
        );
    }

    /**
     * Returns discussion posts for a course forum.
     *
     * <p>The forum is shared between students and instructors to support
     * collaborative learning and question discussion.</p>
     */
    @GetMapping("/posts")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getPosts(
            @PathVariable Long courseId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Posts fetched successfully",
                        courseContentService.getPosts(
                                courseId,
                                authentication.getName()
                        )
                )
        );
    }

    /**
     * Returns a single discussion post together with its replies.
     */
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
                        courseContentService.getPost(
                                courseId,
                                postId,
                                authentication.getName()
                        )
                )
        );
    }

    /**
     * Creates a new discussion post inside the course forum.
     *
     * <p>Membership posting limits are enforced in the service layer. When the
     * limit is exceeded, the frontend receives a specialised payload so it can
     * display membership upgrade prompts.</p>
     */
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
                            courseContentService.createPost(
                                    courseId,
                                    request,
                                    authentication.getName()
                            )
                    )
            );

        } catch (PostLimitException e) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new PostLimitResponse("Post limit reached", true));
        }
    }

    /**
     * Creates a reply under an existing discussion post.
     *
     * <p>Reply creation follows the same membership posting restrictions
     * as standard forum posts.</p>
     */
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
                            courseContentService.createReply(
                                    courseId,
                                    postId,
                                    request,
                                    authentication.getName()
                            )
                    )
            );

        } catch (PostLimitException e) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new PostLimitResponse("Post limit reached", true));
        }
    }

    /**
     * Deletes a discussion post.
     *
     * <p>The backend validates whether the current user owns the post or has
     * instructor-level authority within the course.</p>
     */
    @DeleteMapping("/posts/{postId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            Authentication authentication
    ) {

        courseContentService.deletePost(
                courseId,
                postId,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success("Post deleted", null)
        );
    }

    /**
     * Deletes a reply from a discussion thread.
     */
    @DeleteMapping("/posts/{postId}/replies/{replyId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> deleteReply(
            @PathVariable Long courseId,
            @PathVariable Long postId,
            @PathVariable Long replyId,
            Authentication authentication
    ) {

        courseContentService.deleteReply(
                courseId,
                postId,
                replyId,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success("Reply deleted", null)
        );
    }

    /**
     * Deletes an announcement from the course.
     *
     * <p>Returning HTTP 404 here helps distinguish a missing announcement
     * from an authorisation failure.</p>
     */
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

    /**
     * Returns the student enrolment list for an instructor-owned course.
     *
     * <p>This endpoint supports instructor dashboards and grading workflows
     * where enrolment visibility is required.</p>
     */
    @GetMapping("/enrolments")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<EnrolmentResponse>>> getEnrolments(
            @PathVariable Long courseId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Enrolments fetched successfully",
                        courseContentService.getEnrolments(
                                courseId,
                                authentication.getName()
                        )
                )
        );
    }
}