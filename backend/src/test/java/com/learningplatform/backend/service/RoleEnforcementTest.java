package com.learningplatform.backend.service;

// Role Enforcement
// ----------------
// 401 – enforced by JwtAuthenticationFilter before the service is reached.
//        Simulated here by returning empty from userRepository so the service
//        throws when the user lookup fails.
//
// 403 – SecurityConfig has no per-role URL rules (anyRequest().authenticated() only).
//        The service enforces ownership: callers must be the course's own instructor.
//        A student or a different instructor hitting an instructor-only method is
//        rejected here. Student-only methods (getMySubmission, submitFile) have no
//        service-level role check; an authenticated instructor can call them too —
//        the role separation for those is a frontend/convention concern in the current impl.

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.AssignmentType;
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

class RoleEnforcementTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 403 — student calls instructor-only endpoint
    // The service checks user.id == course.instructor.id; a student's ID never matches,
    // so the call is rejected with a RuntimeException (controller returns 500 today;
    // could be refined to AccessDeniedException → 403 via GlobalExceptionHandler).
    @Test
    void studentCallsInstructorOnlyEndpoint_serviceRejects() {
        System.out.println("[INFO]   CHECK: student calling instructor-only getAssignmentSubmissions is rejected by the service");
        User student = student();
        Assignment assignment = fileAssignment(instructor());  // student.id (1) ≠ instructor.id (2)

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                stub(SubmissionRepository.class)
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                service.getAssignmentSubmissions(1L, 10L, "student@example.com")
        );
        assertTrue(ex.getMessage().contains("not allowed"),
                "expected an 'not allowed' message, got: " + ex.getMessage());
    }

    // 403 — instructor calls getMySubmission (student-only by convention)
    // There is no service-level role guard on getMySubmission; an authenticated
    // instructor can call it. The method returns null when no submission exists,
    // rather than throwing. Role separation for this endpoint relies on the caller.
    @Test
    void instructorCallsStudentEndpoint_serviceHasNoGuard_returnsNull() {
        System.out.println("[INFO]   CHECK: getMySubmission has no role guard — instructor call returns null (no submission found)");
        User instructor = instructor();
        Assignment assignment = fileAssignment(instructor);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(instructor),
                objectMapper,
                noSubmissionRepositoryFor()
        );

        // Service does not throw — returns null because the instructor has no submissions
        assertNull(service.getMySubmission(1L, 10L, "instructor@example.com"));
    }

    // 401 — unauthenticated request (no valid JWT)
    // The JWT filter writes a 401 before the service is called.
    // At the service level the equivalent is: user not found in the repository.
    @Test
    void unknownUserCallsEndpoint_serviceThrowsUserNotFound() {
        System.out.println("[INFO]   CHECK: unknown email (simulating missing/invalid JWT) causes service to throw 'User not found'");
        Assignment assignment = fileAssignment(instructor());

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                emptyUserRepository(),
                objectMapper,
                stub(SubmissionRepository.class)
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                service.getAssignmentSubmissions(1L, 10L, "ghost@example.com")
        );
        assertTrue(ex.getMessage().contains("not found"),
                "expected a 'not found' message, got: " + ex.getMessage());
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

    private Assignment fileAssignment(User instructor) {
        Course course = new Course();
        course.setInstructor(instructor);

        Assignment assignment = new Assignment();
        assignment.setId(10L);
        assignment.setTitle("Essay");
        assignment.setMaxScore(100);
        assignment.setType(AssignmentType.FILE);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setCourse(course);
        return assignment;
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

    private UserRepository emptyUserRepository() {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByEmail" -> Optional.empty();
                    case "toString" -> "EmptyUserRepositoryProxy";
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

    // Returns no submission — used for the instructor-calls-student-endpoint test
    private SubmissionRepository noSubmissionRepositoryFor() {
        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findTopByAssignmentAndStudentOrderBySubmittedAtDesc" -> Optional.empty();
                    case "countByAssignmentAndStudent" -> 0L;
                    case "toString" -> "NoSubmissionRepositoryProxy";
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
