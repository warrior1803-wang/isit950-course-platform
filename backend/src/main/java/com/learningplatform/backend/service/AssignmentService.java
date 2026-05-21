package com.learningplatform.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.ResubmissionLimitException;
import com.learningplatform.backend.dto.AssignmentCreateResponse;
import com.learningplatform.backend.dto.AssignmentDetailResponse;
import com.learningplatform.backend.dto.AutoSubmissionResponse;
import com.learningplatform.backend.dto.AutoSubmitRequest;
import com.learningplatform.backend.dto.CreateAssignmentRequest;
import com.learningplatform.backend.dto.FileSubmissionResponse;
import com.learningplatform.backend.dto.GradeSubmissionRequest;
import com.learningplatform.backend.dto.InstructorSubmissionDetailResponse;
import com.learningplatform.backend.dto.MySubmissionResponse;
import com.learningplatform.backend.dto.UpdateAssignmentRequest;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.AssignmentQuestion;
import com.learningplatform.backend.model.Course;
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
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SubmissionRepository submissionRepository;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper,
            SubmissionRepository submissionRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public AssignmentCreateResponse createAssignment(
            Long courseId,
            CreateAssignmentRequest request,
            String instructorEmail
    ) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.getInstructor().getEmail().equals(instructorEmail)) {
            throw new RuntimeException("You are not allowed to create assignments for this course");
        }

        AssignmentType type = request.getType() == null
                ? AssignmentType.FILE
                : request.getType();

        validateCreateAssignmentRequest(request, type);

        Assignment assignment = new Assignment();
        assignment.setCourse(course);
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxScore(request.getMaxScore());
        assignment.setFileSizeLimitMb(request.getFileSizeLimitMb());
        assignment.setType(type);

        if (type == AssignmentType.AUTO) {
            for (CreateAssignmentRequest.QuestionRequest q : request.getQuestions()) {
                AssignmentQuestion question = new AssignmentQuestion();
                question.setQuestionKey(q.getId());
                question.setType(q.getType());
                question.setText(q.getText());
                question.setPoints(q.getPoints());
                question.setCorrectOption(q.getCorrectOption());
                question.setCorrectAnswer(q.getCorrectAnswer());
                question.setAssignment(assignment);

                if (q.getOptions() != null) {
                    try {
                        question.setOptionsJson(objectMapper.writeValueAsString(q.getOptions()));
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to process question options");
                    }
                }

                assignment.getQuestions().add(question);
            }
        }

        Assignment saved = assignmentRepository.save(assignment);

        return new AssignmentCreateResponse(
                saved.getId(),
                saved.getTitle(),
                saved.getDueDate(),
                saved.getMaxScore(),
                saved.getFileSizeLimitMb(),
                saved.getType(),
                saved.getQuestions() == null ? 0 : saved.getQuestions().size(),
                saved.getCreatedAt()
        );
    }

    public AssignmentDetailResponse getAssignmentDetail(
            Long courseId,
            Long assignmentId,
            String userEmail
    ) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        boolean isInstructor = currentUser.getRole() == UserRole.INSTRUCTOR;
        boolean isStudent = currentUser.getRole() == UserRole.STUDENT;

        if (isInstructor) {
            if (!assignment.getCourse().getInstructor().getId().equals(currentUser.getId())) {
                throw new RuntimeException("You are not allowed to view this assignment");
            }
        }

        if (isStudent) {
            // Sprint 5 当前先放行。
        }

        if (assignment.getType() == AssignmentType.FILE) {
            return buildFileAssignmentDetailResponse(assignment);
        }

        return buildAssignmentDetailResponse(assignment, isInstructor);
    }

    @Transactional
    public AssignmentDetailResponse updateAssignment(
            Long courseId,
            Long assignmentId,
            UpdateAssignmentRequest request,
            String instructorEmail
    ) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("You are not allowed to update this assignment");
        }

        if (request.getTitle() != null) {
            if (request.getTitle().isBlank()) {
                throw new RuntimeException("Title cannot be blank");
            }
            assignment.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            assignment.setDescription(request.getDescription());
        }

        if (request.getDueDate() != null) {
            assignment.setDueDate(request.getDueDate());
        }

        if (request.getMaxScore() != null) {
            if (request.getMaxScore() <= 0) {
                throw new RuntimeException("Max score must be greater than 0");
            }
            assignment.setMaxScore(request.getMaxScore());
        }

        if (assignment.getType() == AssignmentType.FILE) {
            if (request.getQuestions() != null) {
                throw new RuntimeException("FILE assignments cannot have questions");
            }

            Assignment saved = assignmentRepository.save(assignment);
            return buildFileAssignmentDetailResponse(saved);
        }

        if (assignment.getType() == AssignmentType.AUTO) {
            if (request.getQuestions() != null) {
                validateUpdateQuestions(request, assignment.getMaxScore());

                assignment.getQuestions().clear();

                for (UpdateAssignmentRequest.QuestionRequest q : request.getQuestions()) {
                    AssignmentQuestion question = new AssignmentQuestion();
                    question.setQuestionKey(q.getId());
                    question.setType(q.getType());
                    question.setText(q.getText());
                    question.setPoints(q.getPoints());
                    question.setCorrectOption(q.getCorrectOption());
                    question.setCorrectAnswer(q.getCorrectAnswer());
                    question.setAssignment(assignment);

                    if (q.getOptions() != null) {
                        try {
                            question.setOptionsJson(objectMapper.writeValueAsString(q.getOptions()));
                        } catch (Exception e) {
                            throw new RuntimeException("Failed to process question options");
                        }
                    }

                    assignment.getQuestions().add(question);
                }
            }

            Assignment saved = assignmentRepository.save(assignment);
            return buildAssignmentDetailResponse(saved, true);
        }

        throw new RuntimeException("Unsupported assignment type");
    }

    private AssignmentDetailResponse buildFileAssignmentDetailResponse(Assignment assignment) {
        return new AssignmentDetailResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getDueDate(),
                assignment.getMaxScore(),
                assignment.getFileSizeLimitMb(),
                assignment.getCreatedAt(),
                assignment.getType(),
                null,
                null
        );
    }

    private AssignmentDetailResponse buildAssignmentDetailResponse(
            Assignment assignment,
            boolean includeCorrectAnswers
    ) {
        List<AssignmentDetailResponse.QuestionResponse> questionResponses = new ArrayList<>();

        for (AssignmentQuestion q : assignment.getQuestions()) {
            List<String> options = parseOptions(q.getOptionsJson());

            Integer correctOption = includeCorrectAnswers ? q.getCorrectOption() : null;
            String correctAnswer = includeCorrectAnswers ? q.getCorrectAnswer() : null;

            questionResponses.add(new AssignmentDetailResponse.QuestionResponse(
                    q.getQuestionKey(),
                    q.getType(),
                    q.getText(),
                    q.getPoints(),
                    options,
                    correctOption,
                    correctAnswer
            ));
        }

        return new AssignmentDetailResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getDueDate(),
                assignment.getMaxScore(),
                assignment.getFileSizeLimitMb(),
                assignment.getCreatedAt(),
                assignment.getType(),
                questionResponses.size(),
                questionResponses
        );
    }

    private List<String> parseOptions(String optionsJson) {
        if (optionsJson == null) {
            return null;
        }

        try {
            return objectMapper.readValue(
                    optionsJson,
                    new TypeReference<List<String>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse question options");
        }
    }

    private void validateCreateAssignmentRequest(
            CreateAssignmentRequest request,
            AssignmentType type
    ) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("Title is required");
        }

        if (request.getDueDate() == null) {
            throw new RuntimeException("Due date is required");
        }

        if (request.getMaxScore() == null || request.getMaxScore() <= 0) {
            throw new RuntimeException("Max score must be greater than 0");
        }

        if (request.getFileSizeLimitMb() != null && request.getFileSizeLimitMb() <= 0) {
            throw new RuntimeException("File size limit must be greater than 0");
        }

        if (type == AssignmentType.AUTO) {
            if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
                throw new RuntimeException("Questions are required for AUTO assignments");
            }

            int totalPoints = 0;

            for (CreateAssignmentRequest.QuestionRequest q : request.getQuestions()) {
                validateQuestionForCreate(q);
                totalPoints += q.getPoints();
            }

            if (totalPoints != request.getMaxScore()) {
                throw new RuntimeException("Total question points must equal max score");
            }
        }
    }

    private void validateQuestionForCreate(CreateAssignmentRequest.QuestionRequest q) {
        if (q.getId() == null || q.getId().isBlank()) {
            throw new RuntimeException("Question id is required");
        }

        if (q.getType() == null) {
            throw new RuntimeException("Question type is required");
        }

        if (q.getText() == null || q.getText().isBlank()) {
            throw new RuntimeException("Question text is required");
        }

        if (q.getPoints() == null || q.getPoints() <= 0) {
            throw new RuntimeException("Question points must be greater than 0");
        }

        validateQuestionAnswerFields(q.getType(), q.getOptions(), q.getCorrectOption(), q.getCorrectAnswer());
    }

    private void validateUpdateQuestions(
            UpdateAssignmentRequest request,
            Integer maxScore
    ) {
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new RuntimeException("Questions cannot be empty for AUTO assignments");
        }

        int totalPoints = 0;

        for (UpdateAssignmentRequest.QuestionRequest q : request.getQuestions()) {
            validateQuestionForUpdate(q);
            totalPoints += q.getPoints();
        }

        if (maxScore == null || totalPoints != maxScore) {
            throw new RuntimeException("Total question points must equal max score");
        }
    }

    private void validateQuestionForUpdate(UpdateAssignmentRequest.QuestionRequest q) {
        if (q.getId() == null || q.getId().isBlank()) {
            throw new RuntimeException("Question id is required");
        }

        if (q.getType() == null) {
            throw new RuntimeException("Question type is required");
        }

        if (q.getText() == null || q.getText().isBlank()) {
            throw new RuntimeException("Question text is required");
        }

        if (q.getPoints() == null || q.getPoints() <= 0) {
            throw new RuntimeException("Question points must be greater than 0");
        }

        validateQuestionAnswerFields(q.getType(), q.getOptions(), q.getCorrectOption(), q.getCorrectAnswer());
    }

    private void validateQuestionAnswerFields(
            QuestionType type,
            List<String> options,
            Integer correctOption,
            String correctAnswer
    ) {
        if (type == QuestionType.MCQ) {
            if (options == null || options.isEmpty()) {
                throw new RuntimeException("Options are required for MCQ questions");
            }

            if (correctOption == null ||
                    correctOption < 0 ||
                    correctOption >= options.size()) {
                throw new RuntimeException("Correct option is invalid");
            }
        }

        if (type == QuestionType.FILLIN || type == QuestionType.UNIQUE) {
            if (correctAnswer == null || correctAnswer.isBlank()) {
                throw new RuntimeException("Correct answer is required for FILLIN or UNIQUE questions");
            }
        }
    }

    @Transactional
    public void deleteAssignment(
            Long courseId,
            Long assignmentId,
            String instructorEmail
    ) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("You are not allowed to delete this assignment");
        }

        submissionRepository.deleteByAssignment(assignment);
        assignmentRepository.delete(assignment);
    }

    @Transactional
    public FileSubmissionResponse submitFileAssignment(
            Long courseId,
            Long assignmentId,
            MultipartFile file,
            String studentEmail
    ) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getType() != AssignmentType.FILE) {
            throw new RuntimeException("This assignment does not accept file submissions");
        }

        Integer fileSizeLimitMb = assignment.getFileSizeLimitMb();

        if (fileSizeLimitMb != null) {
            long maxBytes = (long) fileSizeLimitMb * 1024 * 1024;

            if (file.getSize() > maxBytes) {
                throw new BusinessException(
                        "File exceeds the "
                                + fileSizeLimitMb
                                + "MB limit for this assignment"
                );
            }
        }

        enforceResubmissionLimit(assignment, student);

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setFilename(file.getOriginalFilename());
        submission.setStatus(SubmissionStatus.SUBMITTED);

        Submission saved = submissionRepository.save(submission);

        return new FileSubmissionResponse(
                saved.getId(),
                saved.getFilename(),
                saved.getSubmittedAt(),
                "submitted"
        );
    }

    @Transactional
    public AutoSubmissionResponse submitAutoAssignment(
            Long courseId,
            Long assignmentId,
            AutoSubmitRequest request,
            String studentEmail
    ) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getType() != AssignmentType.AUTO) {
            throw new RuntimeException("This assignment does not accept auto submissions");
        }

        if (request.getAnswers() == null) {
            throw new RuntimeException("Answers are required");
        }

        enforceResubmissionLimit(assignment, student);

        int totalScore = 0;
        List<AutoSubmissionResponse.BreakdownItem> breakdown = new ArrayList<>();

        for (AssignmentQuestion question : assignment.getQuestions()) {

            Object submittedAnswer = request.getAnswers().get(question.getQuestionKey());

            boolean correct = isAnswerCorrect(question, submittedAnswer);

            int earnedPoints = correct ? question.getPoints() : 0;

            totalScore += earnedPoints;

            String studentAnswer =
                    submittedAnswer == null
                            ? null
                            : submittedAnswer.toString();

            String correctAnswer;

            if (question.getType() == QuestionType.MCQ) {
                correctAnswer =
                        question.getCorrectOption() == null
                                ? null
                                : question.getCorrectOption().toString();
            } else {
                correctAnswer = question.getCorrectAnswer();
            }

            breakdown.add(new AutoSubmissionResponse.BreakdownItem(
                    question.getQuestionKey(),
                    question.getText(),
                    studentAnswer,
                    correctAnswer,
                    correct,
                    earnedPoints,
                    question.getPoints()
            ));
        }

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setScore(totalScore);

        try {
            submission.setAnswersJson(objectMapper.writeValueAsString(request.getAnswers()));
            submission.setBreakdownJson(objectMapper.writeValueAsString(breakdown));
        } catch (Exception e) {
            throw new RuntimeException("Failed to save auto submission");
        }

        Submission saved = submissionRepository.save(submission);

        return new AutoSubmissionResponse(
                saved.getId(),
                saved.getSubmittedAt(),
                "graded",
                true,
                totalScore,
                assignment.getMaxScore(),
                breakdown
        );
    }

    private boolean isAnswerCorrect(AssignmentQuestion question, Object submittedAnswer) {
        if (submittedAnswer == null) {
            return false;
        }

        if (question.getType() == QuestionType.MCQ) {
            try {
                Integer answerIndex;

                if (submittedAnswer instanceof Number number) {
                    answerIndex = number.intValue();
                } else {
                    answerIndex = Integer.parseInt(submittedAnswer.toString());
                }

                return answerIndex.equals(question.getCorrectOption());
            } catch (Exception e) {
                return false;
            }
        }

        if (question.getType() == QuestionType.FILLIN || question.getType() == QuestionType.UNIQUE) {
            String submitted = submittedAnswer.toString().trim();
            String correct = question.getCorrectAnswer() == null
                    ? ""
                    : question.getCorrectAnswer().trim();

            return submitted.equalsIgnoreCase(correct);
        }

        return false;
    }

    private void enforceResubmissionLimit(Assignment assignment, User student) {
        long submissionCount = submissionRepository.countByAssignmentAndStudent(assignment, student);

        if (submissionCount >= 2) {
            throw new ResubmissionLimitException();
        }
    }

    public MySubmissionResponse getMySubmission(
            Long courseId,
            Long assignmentId,
            String studentEmail
    ) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Submission submission = submissionRepository
                .findTopByAssignmentAndStudentOrderBySubmittedAtDesc(assignment, student)
                .orElse(null);

        if (submission == null) {
            return null;
        }

        long used = submissionRepository.countByAssignmentAndStudent(assignment, student);

        boolean autoGraded = assignment.getType() == AssignmentType.AUTO
                && submission.getStatus() == SubmissionStatus.GRADED;

        List<AutoSubmissionResponse.BreakdownItem> breakdown = null;

        String breakdownJson = submission.getBreakdownJson();

        if (autoGraded && breakdownJson != null && !breakdownJson.isBlank()) {
            try {
                breakdown = objectMapper.readValue(
                        breakdownJson,
                        new TypeReference<List<AutoSubmissionResponse.BreakdownItem>>() {}
                );
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse submission breakdown", e);
            }
        }

        return new MySubmissionResponse(
                submission.getId(),
                submission.getFilename(),
                submission.getSubmittedAt(),
                submission.getScore(),
                assignment.getMaxScore(),
                submission.getFeedback(),
                submission.getStatus().name().toLowerCase(),
                autoGraded,
                breakdown,
                used,
                2
        );
    }

    public List<com.learningplatform.backend.dto.InstructorSubmissionListResponse> getAssignmentSubmissions(
            Long courseId,
            Long assignmentId,
            String instructorEmail
    ) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("You are not allowed to view submissions for this assignment");
        }

        List<Submission> submissions = submissionRepository.findByAssignmentOrderBySubmittedAtDesc(assignment);

        List<com.learningplatform.backend.dto.InstructorSubmissionListResponse> responses = new ArrayList<>();

        for (Submission submission : submissions) {
            boolean autoGraded = assignment.getType() == AssignmentType.AUTO
                    && submission.getStatus() == SubmissionStatus.GRADED;

            String status = submission.getStatus() == SubmissionStatus.GRADED
                    ? "graded"
                    : "pending";

            responses.add(new com.learningplatform.backend.dto.InstructorSubmissionListResponse(
                    submission.getId(),
                    new com.learningplatform.backend.dto.InstructorSubmissionListResponse.StudentInfo(
                            submission.getStudent().getId(),
                            submission.getStudent().getName()
                    ),
                    submission.getFilename(),
                    submission.getSubmittedAt(),
                    submission.getScore(),
                    submission.getFeedback(),
                    status,
                    autoGraded
            ));
        }

        return responses;
    }

    public InstructorSubmissionDetailResponse getSubmissionDetailForInstructor(
            Long courseId,
            Long assignmentId,
            Long submissionId,
            String instructorEmail
    ) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(assignmentId, courseId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("You are not allowed to view this submission");
        }

        Submission submission = submissionRepository.findByIdAndAssignment(submissionId, assignment)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        boolean autoGraded = assignment.getType() == AssignmentType.AUTO
                && submission.getStatus() == SubmissionStatus.GRADED;

        List<InstructorSubmissionDetailResponse.BreakdownItem> breakdown = null;

        if (assignment.getType() == AssignmentType.AUTO) {
            breakdown = buildInstructorSubmissionBreakdown(assignment, submission);
        }

        return new InstructorSubmissionDetailResponse(
                submission.getId(),
                new InstructorSubmissionDetailResponse.StudentInfo(
                        submission.getStudent().getId(),
                        submission.getStudent().getName(),
                        submission.getStudent().getEmail()
                ),
                submission.getSubmittedAt(),
                autoGraded,
                submission.getScore(),
                assignment.getMaxScore(),
                submission.getFilename(),
                null,
                submission.getFeedback(),
                breakdown,
                submission.getOverriddenScore(),
                submission.getOverriddenBy(),
                submission.getOverrideReason()
        );
    }

    private List<InstructorSubmissionDetailResponse.BreakdownItem> buildInstructorSubmissionBreakdown(
            Assignment assignment,
            Submission submission
    ) {
        Map<String, Object> answers = parseAnswers(submission.getAnswersJson());

        List<InstructorSubmissionDetailResponse.BreakdownItem> breakdown = new ArrayList<>();

        for (AssignmentQuestion question : assignment.getQuestions()) {
            Object rawAnswer = answers.get(question.getQuestionKey());

            boolean correct = isAnswerCorrect(question, rawAnswer);
            int earnedPoints = correct ? question.getPoints() : 0;

            String studentAnswer = rawAnswer == null ? null : rawAnswer.toString();

            String correctAnswer;
            if (question.getType() == QuestionType.MCQ) {
                correctAnswer = question.getCorrectOption() == null
                        ? null
                        : question.getCorrectOption().toString();
            } else {
                correctAnswer = question.getCorrectAnswer();
            }

            breakdown.add(new InstructorSubmissionDetailResponse.BreakdownItem(
                    question.getQuestionKey(),
                    question.getText(),
                    question.getType(),
                    studentAnswer,
                    correctAnswer,
                    correct,
                    earnedPoints,
                    question.getPoints()
            ));
        }

        return breakdown;
    }

    private Map<String, Object> parseAnswers(String answersJson) {
        if (answersJson == null) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(
                    answersJson,
                    new TypeReference<Map<String, Object>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse submission answers");
        }
    }

    @Transactional
    public InstructorSubmissionDetailResponse gradeSubmission(
            Long courseId,
            Long assignmentId,
            Long submissionId,
            GradeSubmissionRequest request,
            String instructorEmail
    ) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourseId(
                        assignmentId,
                        courseId
                )
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("You are not allowed to grade this submission");
        }

        Submission submission = submissionRepository
                .findByIdAndAssignment(submissionId, assignment)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        Integer maxScore = assignment.getMaxScore();

        if (assignment.getType() == AssignmentType.FILE) {

            if (request.getScore() == null) {
                throw new RuntimeException("Score is required");
            }

            if (request.getScore() > maxScore) {
                throw new BusinessException(
                        "Score cannot exceed the assignment maximum of " + maxScore
                );
            }

            submission.setScore(request.getScore());
            submission.setFeedback(request.getFeedback());
            submission.setStatus(SubmissionStatus.GRADED);

            submissionRepository.save(submission);

            return getSubmissionDetailForInstructor(
                    courseId,
                    assignmentId,
                    submissionId,
                    instructorEmail
            );
        }

        if (assignment.getType() == AssignmentType.AUTO) {

            if (request.getOverriddenScore() == null) {
                throw new RuntimeException("Overridden score is required");
            }

            if (request.getOverriddenScore() > maxScore) {
                throw new BusinessException(
                        "Score cannot exceed the assignment maximum of " + maxScore
                );
            }

            submission.setOverriddenScore(request.getOverriddenScore());
            submission.setOverrideReason(request.getOverrideReason());
            submission.setOverriddenBy(instructor.getName());

            submissionRepository.save(submission);

            return getSubmissionDetailForInstructor(
                    courseId,
                    assignmentId,
                    submissionId,
                    instructorEmail
            );
        }

        throw new RuntimeException("Unsupported assignment type");
    }
}