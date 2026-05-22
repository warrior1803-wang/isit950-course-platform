package com.learningplatform.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.dto.GradeSubmissionRequest;
import com.learningplatform.backend.dto.InstructorSubmissionDetailResponse;
import com.learningplatform.backend.dto.InstructorSubmissionListResponse;
import com.learningplatform.backend.dto.MySubmissionResponse;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

// Instructor Grading Flow — FILE Assignment
class InstructorGradingFlowTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void instructorGetsSubmissionList_allItemsHaveValidStatus() {
        System.out.println("[INFO]   CHECK: submission list returns entries with status 'pending' or 'graded'");
        User instructor = instructor();
        User student = student();
        Assignment assignment = fileAssignment(instructor);

        Submission pending = submission(assignment, student, "draft.pdf", SubmissionStatus.SUBMITTED, null, null);
        pending.setId(1L);
        Submission graded = submission(assignment, student, "final.pdf", SubmissionStatus.GRADED, 85, "Great work");
        graded.setId(2L);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(instructor),
                objectMapper,
                submissionListRepositoryFor(List.of(pending, graded))
        );

        List<InstructorSubmissionListResponse> list =
                service.getAssignmentSubmissions(1L, 10L, "instructor@example.com");

        assertEquals(2, list.size());
        for (InstructorSubmissionListResponse item : list) {
            assertTrue(
                    item.getStatus().equals("pending") || item.getStatus().equals("graded"),
                    "unexpected status: " + item.getStatus()
            );
        }
    }

    @Test
    void instructorGetsSubmissionDetail_includesFilenameAndIsNotAutoGraded() {
        System.out.println("[INFO]   CHECK: FILE submission detail includes filename and autoGraded=false");
        User instructor = instructor();
        User student = student();
        Assignment assignment = fileAssignment(instructor);

        Submission sub = submission(assignment, student, "report.pdf", SubmissionStatus.SUBMITTED, null, null);
        sub.setId(99L);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(instructor),
                objectMapper,
                submissionDetailRepositoryFor(sub)
        );

        InstructorSubmissionDetailResponse detail =
                service.getSubmissionDetailForInstructor(1L, 10L, 99L, "instructor@example.com");

        assertEquals("report.pdf", detail.getFilename());
        assertFalse(detail.getAutoGraded());
    }

    @Test
    void instructorGradesSubmission_scoreAndFeedbackPersisted() {
        System.out.println("[INFO]   CHECK: grading a FILE submission persists score, feedback, and status=GRADED");
        User instructor = instructor();
        User student = student();
        Assignment assignment = fileAssignment(instructor);

        Submission sub = submission(assignment, student, "essay.pdf", SubmissionStatus.SUBMITTED, null, null);
        sub.setId(99L);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(instructor),
                objectMapper,
                submissionDetailRepositoryFor(sub)
        );

        GradeSubmissionRequest request = new GradeSubmissionRequest();
        request.setScore(80);
        request.setFeedback("Well done");

        service.gradeSubmission(1L, 10L, 99L, request, "instructor@example.com");

        assertEquals(SubmissionStatus.GRADED, sub.getStatus());
        assertEquals(80, sub.getScore());
        assertEquals("Well done", sub.getFeedback());
    }

    @Test
    void studentSeesScoreAndFeedbackAfterGrading() {
        System.out.println("[INFO]   CHECK: student's GET /submissions/me shows score and feedback after instructor grades");
        User student = student();
        Assignment assignment = fileAssignment(instructor());

        Submission graded = submission(assignment, student, "essay.pdf", SubmissionStatus.GRADED, 80, "Well done");
        graded.setId(99L);

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                studentSubmissionRepositoryFor(graded, 1L)
        );

        MySubmissionResponse response = service.getMySubmission(1L, 10L, "student@example.com");

        assertNotNull(response);
        assertEquals("graded", response.getStatus());
        assertEquals(80, response.getScore());
        assertEquals("Well done", response.getFeedback());
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

    private Submission submission(Assignment assignment, User student, String filename,
                                  SubmissionStatus status, Integer score, String feedback) {
        Submission sub = new Submission();
        sub.setAssignment(assignment);
        sub.setStudent(student);
        sub.setFilename(filename);
        sub.setStatus(status);
        sub.setScore(score);
        sub.setFeedback(feedback);
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

    // getAssignmentSubmissions — needs findByAssignmentOrderBySubmittedAtDesc
    private SubmissionRepository submissionListRepositoryFor(List<Submission> submissions) {
        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByAssignmentOrderBySubmittedAtDesc" -> submissions;
                    case "toString" -> "SubmissionRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    // getSubmissionDetailForInstructor + gradeSubmission — needs findByIdAndAssignment + save
    private SubmissionRepository submissionDetailRepositoryFor(Submission submission) {
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

    // getMySubmission — needs findTopByAssignmentAndStudentOrderBySubmittedAtDesc + countByAssignmentAndStudent
    private SubmissionRepository studentSubmissionRepositoryFor(Submission submission, long count) {
        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findTopByAssignmentAndStudentOrderBySubmittedAtDesc" -> Optional.of(submission);
                    case "countByAssignmentAndStudent" -> count;
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
