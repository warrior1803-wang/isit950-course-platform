package com.learningplatform.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.common.exception.ResubmissionLimitException;
import com.learningplatform.backend.dto.AssignmentDetailResponse;
import com.learningplatform.backend.dto.FileSubmissionResponse;
import com.learningplatform.backend.dto.MySubmissionResponse;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.AssignmentQuestion;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.AssignmentType;
import com.learningplatform.backend.model.enums.QuestionType;
import com.learningplatform.backend.model.enums.SubmissionStatus;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

class AssignmentServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void studentReceivesAssignmentDetailWithoutCorrectAnswers() throws Exception {
        System.out.println("[INFO]   CHECK: student cannot see correctOption or correctAnswer in assignment detail");
        User student = student();

        AssignmentQuestion mcq = new AssignmentQuestion();
        mcq.setQuestionKey("q1");
        mcq.setType(QuestionType.MCQ);
        mcq.setText("What is 2 + 2?");
        mcq.setPoints(5);
        mcq.setOptionsJson(objectMapper.writeValueAsString(List.of("3", "4", "5")));
        mcq.setCorrectOption(1);

        AssignmentQuestion fillin = new AssignmentQuestion();
        fillin.setQuestionKey("q2");
        fillin.setType(QuestionType.FILLIN);
        fillin.setText("The capital of France is ___.");
        fillin.setPoints(5);
        fillin.setCorrectAnswer("Paris");

        Assignment assignment = new Assignment();
        assignment.setId(10L);
        assignment.setTitle("Quiz 1");
        assignment.setMaxScore(10);
        assignment.setType(AssignmentType.AUTO);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.getQuestions().addAll(List.of(mcq, fillin));

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                stub(SubmissionRepository.class)
        );

        AssignmentDetailResponse response = service.getAssignmentDetail(1L, 10L, "student@example.com");

        for (AssignmentDetailResponse.QuestionResponse q : response.getQuestions()) {
            assertNull(q.getCorrectOption(), "student should not see correctOption for " + q.getId());
            assertNull(q.getCorrectAnswer(), "student should not see correctAnswer for " + q.getId());
        }
    }

    @Test
    void studentSubmitsFileAssignment_returnsStatusSubmitted() {
        System.out.println("[INFO]   CHECK: file submission returns status=submitted with the original filename");
        User student = student();
        Assignment assignment = fileAssignment();
        AtomicLong idSeq = new AtomicLong(1);

        SubmissionRepository submissionRepository = submissionRepositoryFor(
                0L,
                null,
                sub -> { sub.setId(idSeq.getAndIncrement()); return sub; }
        );

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        FileSubmissionResponse response = service.submitFileAssignment(
                1L, 10L, fakeFile("essay.pdf", 512), "student@example.com"
        );

        assertEquals("submitted", response.getStatus());
        assertEquals("essay.pdf", response.getFilename());
    }

    @Test
    void studentGetsOwnSubmission_returnsSubmittedRecord() {
        System.out.println("[INFO]   CHECK: student retrieving their own submission gets status and filename back");
        User student = student();
        Assignment assignment = fileAssignment();

        Submission existing = new Submission();
        existing.setId(99L);
        existing.setAssignment(assignment);
        existing.setStudent(student);
        existing.setFilename("essay.pdf");
        existing.setStatus(SubmissionStatus.SUBMITTED);
        existing.setSubmittedAt(LocalDateTime.now());

        SubmissionRepository submissionRepository = submissionRepositoryFor(1L, existing, null);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        MySubmissionResponse response = service.getMySubmission(1L, 10L, "student@example.com");

        assertNotNull(response);
        assertEquals("submitted", response.getStatus());
        assertEquals("essay.pdf", response.getFilename());
    }

    @Test
    void missingAssignmentDetailThrowsNotFoundException() {
        User student = student();

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(null),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                stub(SubmissionRepository.class)
        );

        NotFoundException ex = assertThrows(NotFoundException.class, () ->
                service.getAssignmentDetail(1L, 99999L, "student@example.com")
        );

        assertEquals("Assignment not found", ex.getMessage());
    }

    // The service throws ResubmissionLimitException; the controller maps it to 403 + { upgradeRequired: true }.
    @Test
    void thirdSubmissionThrowsResubmissionLimitException() {
        System.out.println("[INFO]   CHECK: third submission attempt throws ResubmissionLimitException (maps to 403 upgradeRequired)");
        User student = student();
        Assignment assignment = fileAssignment();

        SubmissionRepository submissionRepository = submissionRepositoryFor(3L, null, null);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        assertThrows(ResubmissionLimitException.class, () ->
                service.submitFileAssignment(1L, 10L, fakeFile("third.pdf", 512), "student@example.com")
        );
    }

    @Test
    void freeStudentResponseIncludesFiniteResubmissionPolicy() {
        User student = student("FREE");
        Assignment assignment = fileAssignment(LocalDateTime.now().plusDays(1));
        SubmissionRepository submissionRepository = submissionRepositoryFor(
                null,
                sub -> sub,
                2L,
                3L
        );

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        FileSubmissionResponse response = service.submitFileAssignment(
                1L, 10L, fakeFile("resubmission.pdf", 512), "student@example.com"
        );

        assertEquals(2L, response.getResubmissionsUsed());
        assertEquals(2, response.getResubmissionsLimit());
        assertEquals(Boolean.FALSE, response.getUnlimitedResubmissions());
    }

    @Test
    void memberResponseIncludesUnlimitedResubmissionPolicy() {
        User student = student("MEMBER");
        Assignment assignment = fileAssignment(LocalDateTime.now().plusDays(1));
        SubmissionRepository submissionRepository = submissionRepositoryFor(
                null,
                sub -> sub,
                10L,
                11L
        );

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        FileSubmissionResponse response = service.submitFileAssignment(
                1L, 10L, fakeFile("member.pdf", 512), "student@example.com"
        );

        assertEquals(10L, response.getResubmissionsUsed());
        assertNull(response.getResubmissionsLimit());
        assertEquals(Boolean.TRUE, response.getUnlimitedResubmissions());
    }

    @Test
    void rejectsResubmissionAfterDeadline() {
        User student = student("MEMBER");
        Assignment assignment = fileAssignment(LocalDateTime.now().minusMinutes(1));
        SubmissionRepository submissionRepository = submissionRepositoryFor(2L, null, null);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        assertThrows(BusinessException.class, () ->
                service.submitFileAssignment(1L, 10L, fakeFile("late.pdf", 512), "student@example.com")
        );
    }

    @Test
    void allowsFirstSubmissionAfterDeadline() {
        User student = student("FREE");
        Assignment assignment = fileAssignment(LocalDateTime.now().minusMinutes(1));
        SubmissionRepository submissionRepository = submissionRepositoryFor(
                null,
                sub -> sub,
                0L,
                1L
        );

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepository
        );

        FileSubmissionResponse response = service.submitFileAssignment(
                1L, 10L, fakeFile("first-late.pdf", 512), "student@example.com"
        );

        assertEquals(0L, response.getResubmissionsUsed());
        assertEquals(2, response.getResubmissionsLimit());
        assertEquals(Boolean.FALSE, response.getUnlimitedResubmissions());
    }

    // --- factories ---

    private User student() {
        return student("FREE");
    }

    private User student(String membershipType) {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setRole(UserRole.STUDENT);
        user.setMembershipType(membershipType);
        return user;
    }

    private Assignment fileAssignment() {
        return fileAssignment(null);
    }

    private Assignment fileAssignment(LocalDateTime dueDate) {
        Assignment assignment = new Assignment();
        assignment.setId(10L);
        assignment.setTitle("Essay");
        assignment.setMaxScore(100);
        assignment.setType(AssignmentType.FILE);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setDueDate(dueDate);
        return assignment;
    }

    private MultipartFile fakeFile(String name, long sizeBytes) {
        return (MultipartFile) Proxy.newProxyInstance(
                MultipartFile.class.getClassLoader(),
                new Class[]{MultipartFile.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "getOriginalFilename" -> name;
                    case "getSize" -> sizeBytes;
                    case "toString" -> "FakeFile(" + name + ")";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
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
                    case "findByIdAndCourseId" -> Optional.ofNullable(assignment);
                    case "toString" -> "AssignmentRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    // count       — returned by countByAssignmentAndStudent
    // existing    — returned by findTopByAssignmentAndStudentOrderBySubmittedAtDesc (null = empty)
    // saveFn      — called on save; null means save is not expected
    @FunctionalInterface
    private interface SaveFn {
        Submission apply(Submission s);
    }

    private SubmissionRepository submissionRepositoryFor(long count, Submission existing, SaveFn saveFn) {
        return submissionRepositoryFor(existing, saveFn, count);
    }

    private SubmissionRepository submissionRepositoryFor(Submission existing, SaveFn saveFn, long... counts) {
        AtomicLong countIndex = new AtomicLong();

        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "countByAssignmentAndStudent" -> {
                        int index = (int) Math.min(countIndex.getAndIncrement(), counts.length - 1L);
                        yield counts[index];
                    }
                    case "findTopByAssignmentAndStudentOrderBySubmittedAtDesc" ->
                            existing == null ? Optional.empty() : Optional.of(existing);
                    case "save" -> saveFn != null
                            ? saveFn.apply((Submission) args[0])
                            : unsupported("save");
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
