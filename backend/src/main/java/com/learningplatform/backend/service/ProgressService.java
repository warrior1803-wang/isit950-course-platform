package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.dto.CourseProgressResponse;
import com.learningplatform.backend.dto.MyProgressResponse;
import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Enrolment;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.EnrolmentRepository;
import com.learningplatform.backend.repository.PostRepository;
import com.learningplatform.backend.repository.ReplyRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Calculates course participation and assignment progress metrics.
 *
 * <p>The service provides different progress views for instructors
 * and students based on their role within the course.</p>
 */
@Service
public class ProgressService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;

    public ProgressService(
            CourseRepository courseRepository,
            UserRepository userRepository,
            EnrolmentRepository enrolmentRepository,
            AssignmentRepository assignmentRepository,
            SubmissionRepository submissionRepository,
            PostRepository postRepository,
            ReplyRepository replyRepository
    ) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrolmentRepository = enrolmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.postRepository = postRepository;
        this.replyRepository = replyRepository;
    }

    /**
     * Returns aggregated progress information for an instructor-owned course.
     *
     * <p>The response combines assignment completion, discussion participation,
     * grading averages, and recent activity indicators.</p>
     */
    @Transactional
    public CourseProgressResponse getCourseProgress(
            Long courseId,
            String instructorEmail
    ) {

        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        // Instructors may only access analytics for courses they manage.
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException(
                    "You are not allowed to view progress for this course"
            );
        }

        long totalAssignments = assignmentRepository.countByCourse(course);

        List<Enrolment> enrolments =
                enrolmentRepository.findByCourse(course);

        List<CourseProgressResponse.StudentProgressItem> students =
                enrolments.stream()
                        .map(enrolment -> {

                            User student = enrolment.getStudent();

                            List<Submission> submissions =
                                    submissionRepository.findByAssignmentCourseAndStudent(
                                            course,
                                            student
                                    );

                            // Multiple submissions for the same assignment count
                            // as one completed assignment in progress tracking.
                            long assignmentsSubmitted = submissions.stream()
                                    .map(submission ->
                                            submission.getAssignment().getId())
                                    .distinct()
                                    .count();

                            Double averageScore =
                                    calculateAverageScore(submissions);

                            int postsCount = Math.toIntExact(
                                    postRepository.countByAuthorAndCourse(
                                            student,
                                            course
                                    )
                            );

                            int repliesCount = Math.toIntExact(
                                    replyRepository.countByAuthorAndPostCourse(
                                            student,
                                            course
                                    )
                            );

                            String lastActive =
                                    calculateLastActive(course, student);

                            return new CourseProgressResponse.StudentProgressItem(
                                    student.getId(),
                                    student.getName(),
                                    assignmentsSubmitted,
                                    totalAssignments,
                                    averageScore,
                                    postsCount,
                                    repliesCount,
                                    lastActive
                            );
                        })
                        .toList();

        return new CourseProgressResponse(course.getId(), students);
    }

    /**
     * Returns progress metrics for the authenticated student.
     */
    @Transactional
    public MyProgressResponse getMyProgress(
            Long courseId,
            String studentEmail
    ) {

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        // Students cannot access progress data for courses
        // they are not enrolled in.
        if (!enrolmentRepository.existsByStudentAndCourse(student, course)) {
            throw new BusinessException(
                    "You are not enrolled in this course"
            );
        }

        long totalAssignments = assignmentRepository.countByCourse(course);

        List<Submission> submissions =
                submissionRepository.findByAssignmentCourseAndStudent(
                        course,
                        student
                );

        long assignmentsSubmitted = submissions.stream()
                .map(submission -> submission.getAssignment().getId())
                .distinct()
                .count();

        Double averageScore = calculateAverageScore(submissions);

        return new MyProgressResponse(
                course.getId(),
                assignmentsSubmitted,
                totalAssignments,
                averageScore
        );
    }

    /**
     * Calculates the effective grading average for completed submissions.
     *
     * <p>Instructor override scores take precedence over automatic scores
     * when moderation adjustments have been applied.</p>
     */
    private Double calculateAverageScore(List<Submission> submissions) {

        List<Integer> scores = submissions.stream()
                .map(submission ->

                        // Manual instructor overrides replace
                        // the original automatic score.
                        submission.getOverriddenScore() != null
                                ? submission.getOverriddenScore()
                                : submission.getScore()
                )
                .filter(score -> score != null)
                .toList();

        if (scores.isEmpty()) {
            return null;
        }

        return scores.stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Determines the student's most recent course activity timestamp.
     *
     * <p>Discussion participation and assignment submissions are combined
     * into a single activity timeline for instructor visibility.</p>
     */
    private String calculateLastActive(Course course, User student) {

        Optional<LocalDateTime> lastPost = postRepository
                .findTopByAuthorAndCourseOrderByCreatedAtDesc(student, course)
                .map(post -> post.getCreatedAt());

        Optional<LocalDateTime> lastReply = replyRepository
                .findTopByAuthorAndPostCourseOrderByCreatedAtDesc(student, course)
                .map(reply -> reply.getCreatedAt());

        Optional<LocalDateTime> lastSubmission = submissionRepository
                .findTopByAssignmentCourseAndStudentOrderBySubmittedAtDesc(
                        course,
                        student
                )
                .map(submission -> submission.getSubmittedAt());

        // Activity timestamps from different participation sources are merged
        // to identify the latest interaction within the course.
        return Stream.of(lastPost, lastReply, lastSubmission)
                .flatMap(Optional::stream)
                .max(LocalDateTime::compareTo)
                .map(DateTimeFormatter.ISO_LOCAL_DATE_TIME::format)
                .orElse(null);
    }
}