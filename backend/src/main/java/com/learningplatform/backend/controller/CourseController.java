package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.response.ApiResponse;
import com.learningplatform.backend.dto.CourseBrowseResponse;
import com.learningplatform.backend.dto.CourseDetailResponse;
import com.learningplatform.backend.dto.CourseRequest;
import com.learningplatform.backend.dto.CourseResponse;
import com.learningplatform.backend.dto.MaterialResponse;
import com.learningplatform.backend.dto.StudentSummaryResponse;
import com.learningplatform.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Handles course lifecycle operations including enrolment,
 * material management, and course browsing.
 *
 * <p>The controller separates instructor-only management workflows
 * from student participation workflows through role-based guards.</p>
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * Returns courses visible to the authenticated user.
     *
     * <p>Students normally receive enrolled courses, while instructors
     * receive courses they manage.</p>
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses(
            Authentication authentication
    ) {

        List<CourseResponse> courses =
                courseService.getCoursesForCurrentUser(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Courses fetched successfully", courses)
        );
    }

    /**
     * Creates a new course owned by the authenticated instructor.
     *
     * <p>Validation rules are enforced through the request DTO before
     * the course creation workflow reaches the service layer.</p>
     */
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication
    ) {

        CourseResponse response =
                courseService.createCourse(request, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created successfully", response));
    }

    /**
     * Returns detailed course information including metadata
     * required by the frontend course page.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getCourseDetail(
            @PathVariable Long id
    ) {

        CourseDetailResponse courseDetail =
                courseService.getCourseDetail(id);

        return ResponseEntity.ok(
                ApiResponse.success("Course fetched successfully", courseDetail)
        );
    }

    /**
     * Updates editable course fields.
     *
     * <p>The service layer verifies that the authenticated instructor
     * owns the target course before modifications are applied.</p>
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request,
            Authentication authentication
    ) {

        CourseResponse response =
                courseService.updateCourse(id, request, authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Course updated successfully", response)
        );
    }

    /**
     * Enrols the authenticated student into a course.
     *
     * <p>The backend prevents duplicate enrolment records and enforces
     * course-level business rules centrally inside the service layer.</p>
     */
    @PostMapping("/{id}/enrol")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CourseResponse>> enrolCourse(
            @PathVariable Long id,
            Authentication authentication
    ) {

        CourseResponse response =
                courseService.enrolCourse(id, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enrolled successfully", response));
    }

    /**
     * Deletes a course owned by the instructor.
     *
     * <p>Removing a course may also remove dependent entities such as
     * enrolments, assignments, materials, and discussion content.</p>
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable Long id,
            Authentication authentication
    ) {

        courseService.deleteCourse(id, authentication.getName());

        return ResponseEntity.noContent().build();
    }

    /**
     * Removes the authenticated student from a course enrolment.
     */
    @DeleteMapping("/{id}/enrol")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> unenrolCourse(
            @PathVariable Long id,
            Authentication authentication
    ) {

        courseService.unenrolCourse(id, authentication.getName());

        return ResponseEntity.noContent().build();
    }

    /**
     * Returns enrolled students for an instructor-owned course.
     *
     * <p>This endpoint supports instructor dashboards, grading workflows,
     * and enrolment management interfaces.</p>
     */
    @GetMapping("/{id}/students")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<StudentSummaryResponse>>> getCourseEnrolments(
            @PathVariable Long id,
            Authentication authentication
    ) {

        List<StudentSummaryResponse> students =
                courseService.getCourseEnrolments(id, authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Enrolments fetched successfully", students)
        );
    }

    /**
     * Uploads learning materials into a course section.
     *
     * <p>Only instructors can manage course materials because uploaded
     * resources become visible to enrolled students.</p>
     */
    @PostMapping("/{id}/materials")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<MaterialResponse>> uploadMaterial(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("section") String section,
            Authentication authentication
    ) {

        MaterialResponse response =
                courseService.uploadMaterial(
                        id,
                        file,
                        section,
                        authentication.getName()
                );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Material uploaded successfully", response));
    }

    /**
     * Returns uploaded learning materials for a course.
     */
    @GetMapping("/{id}/materials")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<MaterialResponse>>> getCourseMaterials(
            @PathVariable Long id,
            Authentication authentication
    ) {

        List<MaterialResponse> materials =
                courseService.getCourseMaterials(id, authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Materials fetched successfully", materials)
        );
    }

    /**
     * Deletes a course material resource.
     *
     * <p>The service layer validates instructor ownership and removes
     * both database metadata and underlying file references.</p>
     */
    @DeleteMapping("/{id}/materials/{materialId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long id,
            @PathVariable Long materialId,
            Authentication authentication
    ) {

        courseService.deleteMaterial(id, materialId, authentication.getName());

        return ResponseEntity.noContent().build();
    }

    /**
     * Returns discoverable courses for student browsing.
     *
     * <p>The browse view is separate from enrolled-course views so students
     * can discover available courses before enrolment.</p>
     */
    @GetMapping("/browse")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseBrowseResponse>>> browseCourses(
            Authentication authentication
    ) {

        List<CourseBrowseResponse> courses =
                courseService.browseCourses(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Browse courses fetched successfully", courses)
        );
    }
}