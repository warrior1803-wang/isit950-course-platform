package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.exception.ResubmissionLimitException;
import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.AssignmentCreateResponse;
import com.learningplatform.backend.dto.AssignmentDetailResponse;
import com.learningplatform.backend.dto.AutoSubmissionResponse;
import com.learningplatform.backend.dto.AutoSubmitRequest;
import com.learningplatform.backend.dto.CreateAssignmentRequest;
import com.learningplatform.backend.dto.DeleteMessageResponse;
import com.learningplatform.backend.dto.FileSubmissionResponse;
import com.learningplatform.backend.dto.GradeSubmissionRequest;
import com.learningplatform.backend.dto.InstructorSubmissionDetailResponse;
import com.learningplatform.backend.dto.InstructorSubmissionListResponse;
import com.learningplatform.backend.dto.MySubmissionResponse;
import com.learningplatform.backend.dto.ResubmissionLimitResponse;
import com.learningplatform.backend.dto.UpdateAssignmentRequest;
import com.learningplatform.backend.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Exposes assignment management and submission workflows.
 *
 * <p>The controller supports both FILE-based assignments and AUTO-graded quiz
 * assignments. Instructor operations are protected through role checks, while
 * student submission endpoints enforce ownership and membership restrictions
 * inside the service layer.</p>
 */
@RestController
@RequestMapping("/api/courses/{courseId}/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * Creates a new assignment inside a course.
     *
     * <p>Only instructors can create assignments. Validation occurs before
     * the request reaches the service layer so invalid assignment structures
     * fail consistently with HTTP 400 responses.</p>
     */
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<AssignmentCreateResponse>> createAssignment(
            @PathVariable Long courseId,
            @Valid @RequestBody CreateAssignmentRequest request,
            Authentication authentication
    ) {

        AssignmentCreateResponse response = assignmentService.createAssignment(
                courseId,
                request,
                authentication.getName()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assignment created successfully", response));
    }

    /**
     * Returns assignment details for either students or instructors.
     *
     * <p>The service layer adjusts the returned data depending on role.
     * For example, students must not receive AUTO assignment answers before
     * submission deadlines.</p>
     */
    @GetMapping("/{assignmentId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<AssignmentDetailResponse>> getAssignmentDetail(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            Authentication authentication
    ) {

        AssignmentDetailResponse response = assignmentService.getAssignmentDetail(
                courseId,
                assignmentId,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success("Assignment fetched successfully", response)
        );
    }

    /**
     * Updates editable assignment fields.
     *
     * <p>The instructor ownership check is delegated to the service layer so
     * business rules remain centralised rather than duplicated across controllers.</p>
     */
    @PutMapping("/{assignmentId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<AssignmentDetailResponse>> updateAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @RequestBody UpdateAssignmentRequest request,
            Authentication authentication
    ) {

        AssignmentDetailResponse response = assignmentService.updateAssignment(
                courseId,
                assignmentId,
                request,
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success("Assignment updated successfully", response)
        );
    }

    /**
     * Deletes an assignment and its dependent submission records.
     *
     * <p>This operation is restricted to the course instructor because deleting
     * an assignment affects grading history and student submission lifecycle data.</p>
     */
    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<DeleteMessageResponse> deleteAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            Authentication authentication
    ) {

        assignmentService.deleteAssignment(
                courseId,
                assignmentId,
                authentication.getName()
        );

        return ResponseEntity.ok(new DeleteMessageResponse("Deleted"));
    }

    /**
     * Handles file-based assignment submissions.
     *
     * <p>The backend validates assignment ownership, submission rules,
     * membership resubmission limits, and file size restrictions before
     * persisting the submission.</p>
     */
    @PostMapping(
            value = "/{assignmentId}/submit",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFileAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {

        try {

            FileSubmissionResponse response = assignmentService.submitFileAssignment(
                    courseId,
                    assignmentId,
                    file,
                    authentication.getName()
            );

            return ResponseEntity.ok(response);

        } catch (ResubmissionLimitException e) {

            // Membership-restricted resubmission limits return a dedicated payload
            // so the frontend can trigger upgrade prompts instead of generic errors.
            return ResponseEntity.status(403)
                    .body(new ResubmissionLimitResponse(
                            "Resubmission limit reached",
                            true
                    ));
        }
    }

    /**
     * Handles AUTO assignment submissions using JSON answers.
     *
     * <p>The service layer performs automatic grading immediately after submission
     * and returns a detailed grading breakdown to the student.</p>
     */
    @PostMapping(
            value = "/{assignmentId}/submit",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitAutoAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @RequestBody AutoSubmitRequest request,
            Authentication authentication
    ) {

        try {

            AutoSubmissionResponse response = assignmentService.submitAutoAssignment(
                    courseId,
                    assignmentId,
                    request,
                    authentication.getName()
            );

            return ResponseEntity.ok(response);

        } catch (ResubmissionLimitException e) {

            return ResponseEntity.status(403)
                    .body(new ResubmissionLimitResponse(
                            "Resubmission limit reached",
                            true
                    ));
        }
    }

    /**
     * Returns the authenticated student's own submission.
     *
     * <p>Students cannot access submissions belonging to other users, even if they
     * know the submission identifier.</p>
     */
    @GetMapping("/{assignmentId}/submissions/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MySubmissionResponse> getMySubmission(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            Authentication authentication
    ) {

        MySubmissionResponse response = assignmentService.getMySubmission(
                courseId,
                assignmentId,
                authentication.getName()
        );

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Returns all submissions for an instructor-owned assignment.
     *
     * <p>The list response is intentionally lighter than the detailed grading
     * endpoint to reduce unnecessary payload size in instructor dashboards.</p>
     */
    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<List<InstructorSubmissionListResponse>> getAssignmentSubmissions(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            Authentication authentication
    ) {

        List<InstructorSubmissionListResponse> response =
                assignmentService.getAssignmentSubmissions(
                        courseId,
                        assignmentId,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Returns full submission details for instructor review and grading.
     *
     * <p>For AUTO assignments, the response may include grading breakdowns,
     * overridden scores, and answer comparisons used during moderation.</p>
     */
    @GetMapping("/{assignmentId}/submissions/{submissionId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<InstructorSubmissionDetailResponse> getSubmissionDetailForInstructor(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @PathVariable Long submissionId,
            Authentication authentication
    ) {

        InstructorSubmissionDetailResponse response =
                assignmentService.getSubmissionDetailForInstructor(
                        courseId,
                        assignmentId,
                        submissionId,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Applies instructor grading or grading overrides to a submission.
     *
     * <p>FILE assignments are graded manually, while AUTO assignments may
     * receive instructor override adjustments after automatic marking.</p>
     */
    @PutMapping("/{assignmentId}/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<InstructorSubmissionDetailResponse> gradeSubmission(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @PathVariable Long submissionId,
            @RequestBody GradeSubmissionRequest request,
            Authentication authentication
    ) {

        InstructorSubmissionDetailResponse response =
                assignmentService.gradeSubmission(
                        courseId,
                        assignmentId,
                        submissionId,
                        request,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }
}