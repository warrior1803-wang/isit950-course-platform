package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.ConflictException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.dto.CourseBrowseResponse;
import com.learningplatform.backend.dto.CourseDetailResponse;
import com.learningplatform.backend.dto.CourseRequest;
import com.learningplatform.backend.dto.CourseResponse;
import com.learningplatform.backend.dto.InstructorSummaryResponse;
import com.learningplatform.backend.dto.MaterialResponse;
import com.learningplatform.backend.dto.StudentSummaryResponse;
import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Enrolment;
import com.learningplatform.backend.model.Material;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.EnrolmentRepository;
import com.learningplatform.backend.repository.MaterialRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
/**
 * Handles course lifecycle operations including enrolment,
 * material management, and instructor-owned course workflows.
 *
 * <p>The service centralises permission checks and course-related
 * business rules for both students and instructors.</p>
 */
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final MaterialRepository materialRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;
    /**
     * Creates a new course owned by the authenticated instructor.
     */
    public CourseResponse createCourse(CourseRequest request, String userEmail) {
        // Course codes must remain unique so students can reliably
        // identify and enrol in the correct course.
        if (courseRepository.existsByCode(request.getCode())) {
            throw new ConflictException("Course code already exists");
        }

        User instructor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = new Course();
        course.setName(request.getName());
        course.setCode(request.getCode());
        course.setDescription(request.getDescription());
        course.setSchedule(request.getSchedule());
        course.setLocation(request.getLocation());
        course.setInstructor(instructor);

        Course savedCourse = courseRepository.save(course);

        return toCourseResponse(savedCourse);
    }
    /**
     * Returns courses relevant to the authenticated user.
     *
     * <p>Instructors receive owned courses, while students
     * receive enrolled courses.</p>
     */
    public List<CourseResponse> getCoursesForCurrentUser(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        List<CourseResponse> result = new ArrayList<>();

        if (currentUser.getRole() == UserRole.INSTRUCTOR) {
            List<Course> courses = courseRepository.findByInstructor(currentUser);

            for (Course course : courses) {
                result.add(toCourseResponse(course));
            }

            return result;
        }

        if (currentUser.getRole() == UserRole.STUDENT) {
            List<Enrolment> enrolments = enrolmentRepository.findByStudent(currentUser);

            for (Enrolment enrolment : enrolments) {
                Course course = enrolment.getCourse();
                result.add(toCourseResponse(course));
            }

            return result;
        }

        throw new BusinessException("Invalid user role");
    }

    public CourseDetailResponse getCourseDetail(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        long materialsCount = materialRepository.countByCourse(course);
        long enrolmentCount = enrolmentRepository.countByCourse(course);
        long assignmentCount = assignmentRepository.countByCourse(course);
        long pendingCount = submissionRepository.countByAssignmentCourseAndScoreIsNull(course);
        return new CourseDetailResponse(
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getDescription(),
                course.getSchedule(),
                course.getLocation(),
                course.getCreatedAt(),
                course.getInstructor().getId(),
                course.getInstructor().getName(),
                materialsCount,
                enrolmentCount,
                assignmentCount,
                pendingCount
        );
    }
    /**
     * Updates editable course information for an instructor-owned course.
     */
    @Transactional
    public CourseResponse updateCourse(Long courseId, CourseRequest request, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        if (courseRepository.existsByCodeAndIdNot(request.getCode(), courseId)) {
            throw new ConflictException("Course code already exists");
        }

        course.setName(request.getName());
        course.setCode(request.getCode());
        course.setDescription(request.getDescription());
        course.setSchedule(request.getSchedule());
        course.setLocation(request.getLocation());

        Course updatedCourse = courseRepository.save(course);

        return toCourseResponse(updatedCourse);
    }

    /**
     * Deletes a course together with dependent enrolment
     * and material relationships.
     */
    @Transactional
    public void deleteCourse(Long courseId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        // Ownership validation prevents instructors from modifying
        // courses belonging to other teaching staff.
        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        enrolmentRepository.deleteByCourse(course);
        materialRepository.deleteByCourse(course);
        courseRepository.delete(course);
    }

    /**
     * Enrols a student into a course.
     */
    public CourseResponse enrolCourse(Long courseId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (currentUser.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can enrol in courses");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        // Duplicate enrolments are blocked to preserve consistent
        // course participation records.
        if (enrolmentRepository.existsByStudentAndCourse(currentUser, course)) {
            throw new ConflictException("Already enrolled in this course");
        }

        Enrolment enrolment = new Enrolment();
        enrolment.setStudent(currentUser);
        enrolment.setCourse(course);

        enrolmentRepository.save(enrolment);

        return toCourseResponse(course);
    }

    @Transactional
    public void unenrolCourse(Long courseId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (currentUser.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can unenrol from courses");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (!enrolmentRepository.existsByStudentAndCourse(currentUser, course)) {
            throw new NotFoundException("Enrolment not found");
        }

        enrolmentRepository.deleteByStudentAndCourse(currentUser, course);
    }

    public List<StudentSummaryResponse> getCourseEnrolments(Long courseId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        List<Enrolment> enrolments = enrolmentRepository.findByCourse(course);
        List<StudentSummaryResponse> result = new ArrayList<>();

        for (Enrolment enrolment : enrolments) {
            User student = enrolment.getStudent();
            String membershipType = student.getMembershipType() == null
                    ? "FREE"
                    : student.getMembershipType();

            result.add(new StudentSummaryResponse(
                    student.getId(),
                    student.getName(),
                    student.getEmail(),
                    new StudentSummaryResponse.MembershipSummary(membershipType)
            ));
        }

        return result;
    }

    /**
     * Uploads course learning materials for enrolled students.
     *
     * <p>Uploaded files are stored on the server filesystem while
     * metadata is persisted in the relational database.</p>
     */
    @Transactional
    public MaterialResponse uploadMaterial(Long courseId, MultipartFile file, String section, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is required");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            // UUID-based filenames reduce collision risk between uploads
            // with identical original filenames.
            String storedFilename = UUID.randomUUID() + "_" + originalFilename;

            Path targetPath = uploadPath.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Material material = new Material();
            material.setCourse(course);
            material.setFilename(originalFilename);
            material.setUrl("/uploads/" + storedFilename);
            material.setSize(file.getSize());
            material.setSection(section);

            Material savedMaterial = materialRepository.save(material);

            return toMaterialResponse(savedMaterial);

        } catch (IOException e) {
            throw new BusinessException("Failed to upload file");
        }
    }

    /**
     * Returns learning materials accessible to the current user.
     */
    public List<MaterialResponse> getCourseMaterials(Long courseId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (currentUser.getRole() == UserRole.INSTRUCTOR) {
            if (!course.getInstructor().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You do not own this course");
            }
        } else if (currentUser.getRole() == UserRole.STUDENT) {
            if (!enrolmentRepository.existsByStudentAndCourse(currentUser, course)) {
                throw new AccessDeniedException("You are not enrolled in this course");
            }
        } else {
            throw new BusinessException("Invalid user role");
        }

        List<Material> materials = materialRepository.findByCourse(course);
        List<MaterialResponse> result = new ArrayList<>();

        for (Material material : materials) {
            result.add(toMaterialResponse(material));
        }

        return result;
    }

    @Transactional
    public void deleteMaterial(Long courseId, Long materialId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        Material material = materialRepository.findByIdAndCourse(materialId, course)
                .orElseThrow(() -> new NotFoundException("Material not found"));

        try {
            if (material.getUrl() != null && material.getUrl().startsWith("/uploads/")) {
                String storedFilename = material.getUrl().replace("/uploads/", "");
                Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(storedFilename);
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            throw new BusinessException("Failed to delete file");
        }

        materialRepository.delete(material);
    }

    /**
     * Returns discoverable courses for student browsing and enrolment.
     */
    public List<CourseBrowseResponse> browseCourses(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (currentUser.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can browse courses");
        }

        List<Course> courses = courseRepository.findAll();
        List<CourseBrowseResponse> result = new ArrayList<>();

        for (Course course : courses) {
            long enrolledCount = enrolmentRepository.countByCourse(course);
            boolean isEnrolled = enrolmentRepository.existsByStudentAndCourse(currentUser, course);

            result.add(new CourseBrowseResponse(
                    course.getId(),
                    course.getName(),
                    course.getCode(),
                    course.getDescription(),
                    new InstructorSummaryResponse(
                            course.getInstructor().getId(),
                            course.getInstructor().getName()
                    ),
                    enrolledCount,
                    isEnrolled
            ));
        }

        return result;
    }

    private CourseResponse toCourseResponse(Course course) {
        long materialsCount = materialRepository.countByCourse(course);
        long enrolmentCount = enrolmentRepository.countByCourse(course);
        long assignmentCount = assignmentRepository.countByCourse(course);
        long pendingCount = submissionRepository.countByAssignmentCourseAndScoreIsNull(course);

        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getDescription(),
                course.getSchedule(),
                course.getLocation(),
                course.getCreatedAt(),
                course.getInstructor().getId(),
                course.getInstructor().getName(),
                enrolmentCount,
                materialsCount,
                assignmentCount,
                pendingCount
        );
    }

    private MaterialResponse toMaterialResponse(Material material) {
        return new MaterialResponse(
                material.getId(),
                material.getFilename(),
                material.getUrl(),
                material.getSize(),
                material.getSection(),
                material.getUploadedAt()
        );
    }
}