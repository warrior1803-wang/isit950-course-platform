package com.learningplatform.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.ResubmissionLimitException;
import com.learningplatform.backend.dto.FileSubmissionResponse;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.AssignmentType;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AssignmentServiceTest {

    @Test
    void rejectsFreeStudentAfterTwoResubmissions() {
        User student = student("FREE");
        Assignment assignment = fileAssignment(LocalDateTime.now().plusDays(1));
        AssignmentService service = service(student, assignment, 3L);

        assertThrows(
                ResubmissionLimitException.class,
                () -> service.submitFileAssignment(10L, 20L, file(), student.getEmail())
        );
    }

    @Test
    void allowsFreeStudentSecondResubmissionBeforeDeadline() {
        User student = student("FREE");
        Assignment assignment = fileAssignment(LocalDateTime.now().plusDays(1));
        AssignmentService service = service(student, assignment, 2L, 3L);

        FileSubmissionResponse response =
                service.submitFileAssignment(10L, 20L, file(), student.getEmail());

        assertEquals(2L, response.getResubmissionsUsed());
        assertEquals(2, response.getResubmissionsLimit());
        assertEquals(Boolean.FALSE, response.getUnlimitedResubmissions());
    }

    @Test
    void allowsMemberUnlimitedResubmissionsBeforeDeadline() {
        User student = student("MEMBER");
        Assignment assignment = fileAssignment(LocalDateTime.now().plusDays(1));
        AssignmentService service = service(student, assignment, 10L, 11L);

        FileSubmissionResponse response =
                service.submitFileAssignment(10L, 20L, file(), student.getEmail());

        assertEquals(10L, response.getResubmissionsUsed());
        assertNull(response.getResubmissionsLimit());
        assertEquals(Boolean.TRUE, response.getUnlimitedResubmissions());
    }

    @Test
    void rejectsResubmissionAfterDeadline() {
        User student = student("MEMBER");
        Assignment assignment = fileAssignment(LocalDateTime.now().minusMinutes(1));
        AssignmentService service = service(student, assignment, 2L);

        assertThrows(
                BusinessException.class,
                () -> service.submitFileAssignment(10L, 20L, file(), student.getEmail())
        );
    }

    @Test
    void allowsFirstSubmissionAfterDeadline() {
        User student = student("FREE");
        Assignment assignment = fileAssignment(LocalDateTime.now().minusMinutes(1));
        AssignmentService service = service(student, assignment, 0L, 1L);

        FileSubmissionResponse response =
                service.submitFileAssignment(10L, 20L, file(), student.getEmail());

        assertEquals(0L, response.getResubmissionsUsed());
        assertEquals(2, response.getResubmissionsLimit());
        assertEquals(Boolean.FALSE, response.getUnlimitedResubmissions());
    }

    private AssignmentService service(User student, Assignment assignment, long... submissionCounts) {
        return new AssignmentService(
                assignmentRepositoryFor(assignment),
                emptyRepository(CourseRepository.class),
                userRepositoryFor(student),
                new ObjectMapper(),
                submissionRepositoryFor(submissionCounts)
        );
    }

    private User student(String membershipType) {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setRole(UserRole.STUDENT);
        user.setMembershipType(membershipType);
        return user;
    }

    private Assignment fileAssignment(LocalDateTime dueDate) {
        Assignment assignment = new Assignment();
        assignment.setId(20L);
        assignment.setType(AssignmentType.FILE);
        assignment.setDueDate(dueDate);
        assignment.setMaxScore(100);
        return assignment;
    }

    private MockMultipartFile file() {
        return new MockMultipartFile(
                "file",
                "submission.pdf",
                "application/pdf",
                "content".getBytes()
        );
    }

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

    private SubmissionRepository submissionRepositoryFor(long... counts) {
        AtomicInteger countIndex = new AtomicInteger();

        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "countByAssignmentAndStudent" -> {
                        int index = Math.min(countIndex.getAndIncrement(), counts.length - 1);
                        yield counts[index];
                    }
                    case "save" -> args[0];
                    case "toString" -> "SubmissionRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    @SuppressWarnings("unchecked")
    private <T> T emptyRepository(Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class[]{type},
                (proxy, method, args) -> switch (method.getName()) {
                    case "toString" -> type.getSimpleName() + "Proxy";
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
