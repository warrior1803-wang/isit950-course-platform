package com.learningplatform.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.dto.AssignmentDetailResponse;
import com.learningplatform.backend.dto.AutoSubmissionResponse;
import com.learningplatform.backend.dto.AutoSubmitRequest;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.AssignmentQuestion;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.AssignmentType;
import com.learningplatform.backend.model.enums.QuestionType;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

// Student Submission Flow — AUTO Assignment
class AutoAssignmentSubmissionTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void studentReceivesQuestionsWithoutCorrectAnswers() throws Exception {
        System.out.println("[INFO]   CHECK: student cannot see correctOption or correctAnswer in AUTO assignment detail");
        User student = student();
        Assignment assignment = autoAssignment(mcqQuestion(), fillinQuestion());

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
    void studentSubmitsAnswers_responseIsGradedWithBreakdownPerQuestion() throws Exception {
        System.out.println("[INFO]   CHECK: submitting answers returns status=graded with one breakdown item per question");
        User student = student();
        Assignment assignment = autoAssignment(mcqQuestion(), fillinQuestion());

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepositoryFor(0L)
        );

        AutoSubmitRequest request = new AutoSubmitRequest();
        request.setAnswers(Map.of("q1", 1, "q2", "Paris"));

        AutoSubmissionResponse response = service.submitAutoAssignment(1L, 10L, request, "student@example.com");

        assertEquals("graded", response.getStatus());
        assertTrue(response.getAutoGraded());
        assertNotNull(response.getBreakdown());
        assertEquals(2, response.getBreakdown().size());
    }

    @Test
    void allCorrectAnswers_eachBreakdownItemAwardsFullPoints() throws Exception {
        System.out.println("[INFO]   CHECK: correct answers award full points for each breakdown item");
        User student = student();
        Assignment assignment = autoAssignment(mcqQuestion(), fillinQuestion());

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepositoryFor(0L)
        );

        AutoSubmitRequest request = new AutoSubmitRequest();
        request.setAnswers(Map.of("q1", 1, "q2", "Paris"));  // both correct

        AutoSubmissionResponse response = service.submitAutoAssignment(1L, 10L, request, "student@example.com");

        assertEquals(assignment.getMaxScore(), response.getScore());
        for (AutoSubmissionResponse.BreakdownItem item : response.getBreakdown()) {
            assertEquals(item.getMaxPoints(), item.getPointsAwarded(),
                    "expected full points for " + item.getQuestionId());
        }
    }

    @Test
    void allWrongAnswers_eachBreakdownItemAwardsZeroPoints() throws Exception {
        System.out.println("[INFO]   CHECK: incorrect answers award 0 points for each breakdown item");
        User student = student();
        Assignment assignment = autoAssignment(mcqQuestion(), fillinQuestion());

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepositoryFor(0L)
        );

        AutoSubmitRequest request = new AutoSubmitRequest();
        request.setAnswers(Map.of("q1", 0, "q2", "London"));  // wrong MCQ index, wrong city

        AutoSubmissionResponse response = service.submitAutoAssignment(1L, 10L, request, "student@example.com");

        assertEquals(0, response.getScore());
        for (AutoSubmissionResponse.BreakdownItem item : response.getBreakdown()) {
            assertEquals(0, item.getPointsAwarded(),
                    "expected 0 points for " + item.getQuestionId());
        }
    }

    @Test
    void scoreMatchesSumOfBreakdownPointsAwarded() throws Exception {
        System.out.println("[INFO]   CHECK: response score equals the sum of pointsAwarded across all breakdown items");
        User student = student();
        Assignment assignment = autoAssignment(mcqQuestion(), fillinQuestion());  // 5pts each

        AssignmentService service = new AssignmentService(
                assignmentRepositoryFor(assignment),
                stub(CourseRepository.class),
                userRepositoryFor(student),
                objectMapper,
                submissionRepositoryFor(0L)
        );

        AutoSubmitRequest request = new AutoSubmitRequest();
        request.setAnswers(Map.of("q1", 1, "q2", "London"));  // q1 correct (5pts), q2 wrong (0pts)

        AutoSubmissionResponse response = service.submitAutoAssignment(1L, 10L, request, "student@example.com");

        int sumFromBreakdown = response.getBreakdown().stream()
                .mapToInt(AutoSubmissionResponse.BreakdownItem::getPointsAwarded)
                .sum();
        assertEquals(sumFromBreakdown, response.getScore());
        assertEquals(5, response.getScore());
    }

    // --- factories ---

    private User student() {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setRole(UserRole.STUDENT);
        user.setMembershipType("FREE");
        return user;
    }

    private AssignmentQuestion mcqQuestion() throws Exception {
        AssignmentQuestion q = new AssignmentQuestion();
        q.setQuestionKey("q1");
        q.setType(QuestionType.MCQ);
        q.setText("Which option is correct?");
        q.setPoints(5);
        q.setOptionsJson(objectMapper.writeValueAsString(List.of("Wrong", "Correct", "Also wrong")));
        q.setCorrectOption(1);
        return q;
    }

    private AssignmentQuestion fillinQuestion() {
        AssignmentQuestion q = new AssignmentQuestion();
        q.setQuestionKey("q2");
        q.setType(QuestionType.FILLIN);
        q.setText("The capital of France is ___.");
        q.setPoints(5);
        q.setCorrectAnswer("Paris");
        return q;
    }

    private Assignment autoAssignment(AssignmentQuestion... questions) {
        Assignment assignment = new Assignment();
        assignment.setId(10L);
        assignment.setTitle("Quiz 1");
        assignment.setMaxScore(0);
        for (AssignmentQuestion q : questions) assignment.setMaxScore(assignment.getMaxScore() + q.getPoints());
        assignment.setType(AssignmentType.AUTO);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.getQuestions().addAll(List.of(questions));
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

    private SubmissionRepository submissionRepositoryFor(long count) {
        return (SubmissionRepository) Proxy.newProxyInstance(
                SubmissionRepository.class.getClassLoader(),
                new Class[]{SubmissionRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "countByAssignmentAndStudent" -> count;
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
