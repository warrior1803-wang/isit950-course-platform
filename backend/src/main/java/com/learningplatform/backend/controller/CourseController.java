package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.response.ApiResponse;
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

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses(Authentication authentication) {
        List<CourseResponse> courses = courseService.getCoursesForCurrentUser(authentication.getName());

        return ResponseEntity.ok(ApiResponse.success("Courses fetched successfully", courses));
    }

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication
    ) {

        CourseResponse response = courseService.createCourse(request, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getCourseDetail(@PathVariable Long id) {
        CourseDetailResponse courseDetail = courseService.getCourseDetail(id);

        return ResponseEntity.ok(ApiResponse.success("Course fetched successfully", courseDetail));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request,
            Authentication authentication
    ) {
        CourseResponse response = courseService.updateCourse(id, request, authentication.getName());

        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", response));
    }

    @PostMapping("/{id}/enrol")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CourseResponse>> enrolCourse(
            @PathVariable Long id,
            Authentication authentication
    ) {
        CourseResponse response = courseService.enrolCourse(id, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enrolled successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable Long id,
            Authentication authentication
    ) {
        courseService.deleteCourse(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/enrol")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> unenrolCourse(
            @PathVariable Long id,
            Authentication authentication
    ) {
        courseService.unenrolCourse(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/enrolments")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<StudentSummaryResponse>>> getCourseEnrolments(
            @PathVariable Long id,
            Authentication authentication
    ) {
        List<StudentSummaryResponse> students = courseService.getCourseEnrolments(id, authentication.getName());

        return ResponseEntity.ok(ApiResponse.success("Enrolments fetched successfully", students));
    }

    @PostMapping("/{id}/materials")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<MaterialResponse>> uploadMaterial(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("section") String section,
            Authentication authentication
    ) {
        MaterialResponse response = courseService.uploadMaterial(id, file, section, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Material uploaded successfully", response));
    }

    @GetMapping("/{id}/materials")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<MaterialResponse>>> getCourseMaterials(
            @PathVariable Long id,
            Authentication authentication
    ) {
        List<MaterialResponse> materials = courseService.getCourseMaterials(id, authentication.getName());

        return ResponseEntity.ok(ApiResponse.success("Materials fetched successfully", materials));
    }

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
}