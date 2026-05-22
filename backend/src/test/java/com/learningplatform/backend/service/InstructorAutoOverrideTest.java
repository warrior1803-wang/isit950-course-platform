package com.learningplatform.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.dto.GradeSubmissionRequest;
import com.learningplatform.backend.dto.InstructorSubmissionDetailResponse;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.AssignmentType;
import com.learningplatform.backend.model.enums.SubmissionStatus;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

// Instructor Grading Flow — AUTO Override
class InstructorAutoOverrideTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void instructorOverridesScore_overrideFieldsSetAndAutoGradedPreserved() {
        System.out.println("[INFO]   CHECK: overriding AUTO submission sets overriddenScore/Reason/By and preserves autoGraded=true");
        User instructor = instructor();
        Assignment assignment = autoAssignment(instructor);

        Submission sub = gradedAutoSubmission(assignment, student());
        sub.setId(99L);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(instructor),
                objectMapper,
                submissionRepositoryFor(sub)
        );

        GradeSubmissionRequest request = new GradeSubmissionRequest();
        request.setOverriddenScore(9);
        request.setOverrideReason("Partial credit for working shown");

        InstructorSubmissionDetailResponse result =
                service.gradeSubmission(1L, 10L, 99L, request, "instructor@example.com");

        assertEquals(9, sub.getOverriddenScore());
        assertEquals("Partial credit for working shown", sub.getOverrideReason());
        assertEquals(instructor.getName(), sub.getOverriddenBy());
        assertTrue(result.getAutoGraded(), "autoGraded must stay true for an AUTO graded submission");
    }

    @Test
    void overriddenScoreAboveMaxScore_throwsBusinessException() {
        System.out.println("[INFO]   CHECK: overriddenScore > maxScore throws BusinessException (maps to 400)");
        User instructor = instructor();
        Assignment assignment = autoAssignment(instructor);  // maxScore = 10

        Submission sub = gradedAutoSubmission(assignment, student());
        sub.setId(99L);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(instructor),
                objectMapper,
                submissionRepositoryFor(sub)
        );

        GradeSubmissionRequest request = new GradeSubmissionRequest();
        request.setOverriddenScore(11);  // exceeds maxScore of 10

        assertThrows(BusinessException.class, () ->
                service.gradeSubmission(1L, 10L, 99L, request, "instructor@example.com")
        );
    }

    // --- factories ---

    private User instructor() {
        User user = new User();
        user.setId(2L);
        user.setEmail("instructor@example.com");
        user.setName("Professor Smith");
        user.setRole(UserRole.INSTRUCTOR);
        return user;
    }

    private User student() {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setName("Jane Student");
        user.setRole(UserRole.STUDENT);
        user.setMembershipType("FREE");
        return user;
    }

    private Assignment autoAssignment(User instructor) {
        Course course = new Course();
        course.setInstructor(instructor);

        Assignment assignment = new Assignment();
        assignment.setId(10L);
        assignment.setTitle("Quiz 1");
        assignment.setMaxScore(10);
        assignment.setType(AssignmentType.AUTO);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setCourse(course);
        return assignment;
    }

    private Submission gradedAutoSubmission(Assignment assignment, User student) {
        Submission sub = new Submission();
        sub.setAssignment(assignment);
        sub.setStudent(student);
        sub.setStatus(SubmissionStatus.GRADED);
        sub.setScore(8);
        sub.setSubmittedAt(LocalDateTime.now());
        return sub;
    }

    // --- repository helpers ---

    private UserRepository userRepositoryFor(User user) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByEmail" -> Optional.of(user);
                    case "toString" -> "UserRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    private AssignmentRepository assignmentRepositoryFor(Assignment assignment) {
        return (AssignmentRepository) Proxy.newProxyInstance(
                AssignmentRepository.class.getClassLoader(),
                new Class[]{AssignmentRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdAndCourseId" -> Optional.of(assignment);
                    case "toString" -> "AssignmentRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    // gradeSubmission (AUTO) calls findByIdAndAssignment twice (grade + inner detail call) and save once
    private SubmissionRepository submissionRepositoryFor(Submission submission) {
        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByIdAndAssignment" -> Optional.of(submission);
                    case "save" -> args[0];
                    case "toString" -> "SubmissionRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    @SuppressWarnings("unchecked")
    private <T> T stub(Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class[]{type},
                (proxy, method, args) -> switch (method.getName()) {
                    case "toString" -> type.getSimpleName() + "Stub";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    private Object unsupported(String methodName) {
        throw new UnsupportedOperationException("Unexpected repository call: " + methodName);
    }
}
