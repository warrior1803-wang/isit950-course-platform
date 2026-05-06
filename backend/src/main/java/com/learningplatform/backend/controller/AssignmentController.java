package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.exception.ResubmissionLimitException;
import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.AssignmentDetailResponse;
import com.learningplatform.backend.dto.AutoSubmissionResponse;
import com.learningplatform.backend.dto.AutoSubmitRequest;
import com.learningplatform.backend.dto.DeleteMessageResponse;
import com.learningplatform.backend.dto.FileSubmissionResponse;
import com.learningplatform.backend.dto.GradeSubmissionRequest;
import com.learningplatform.backend.dto.InstructorSubmissionDetailResponse;
import com.learningplatform.backend.dto.MySubmissionResponse;
import com.learningplatform.backend.dto.ResubmissionLimitResponse;
import com.learningplatform.backend.dto.UpdateAssignmentRequest;
import com.learningplatform.backend.dto.assignment.AssignmentCreateResponse;
import com.learningplatform.backend.dto.assignment.CreateAssignmentRequest;
import com.learningplatform.backend.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<AssignmentCreateResponse>> createAssignment(
            @PathVariable Long courseId,
            @RequestBody CreateAssignmentRequest request,
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

        return ResponseEntity.ok(ApiResponse.success("Assignment fetched successfully", response));
    }

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

        return ResponseEntity.ok(ApiResponse.success("Assignment updated successfully", response));
    }

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
            return ResponseEntity.status(403)
                    .body(new ResubmissionLimitResponse("Resubmission limit reached", true));
        }
    }

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
                    .body(new ResubmissionLimitResponse("Resubmission limit reached", true));
        }
    }

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

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<List<com.learningplatform.backend.dto.submission.InstructorSubmissionListResponse>> getAssignmentSubmissions(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            Authentication authentication
    ) {
        List<com.learningplatform.backend.dto.submission.InstructorSubmissionListResponse> response = assignmentService.getAssignmentSubmissions(
                courseId,
                assignmentId,
                authentication.getName()
        );

        return ResponseEntity.ok(response);
    }

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