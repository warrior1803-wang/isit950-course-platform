package com.learningplatform.backend.service;

import com.learningplatform.backend.dto.CourseProgressResponse;
import com.learningplatform.backend.dto.MyProgressResponse;
import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Enrolment;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.EnrolmentRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProgressService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    public ProgressService(
            CourseRepository courseRepository,
            UserRepository userRepository,
            EnrolmentRepository enrolmentRepository,
            AssignmentRepository assignmentRepository,
            SubmissionRepository submissionRepository
    ) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrolmentRepository = enrolmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public CourseProgressResponse getCourseProgress(Long courseId, String instructorEmail) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("You are not allowed to view progress for this course");
        }

        long totalAssignments = assignmentRepository.countByCourse(course);

        List<Enrolment> enrolments = enrolmentRepository.findByCourse(course);

        List<CourseProgressResponse.StudentProgressItem> students = enrolments.stream()
                .map(enrolment -> {
                    User student = enrolment.getStudent();
                    List<Submission> submissions =
                            submissionRepository.findByAssignmentCourseAndStudent(course, student);

                    long assignmentsSubmitted = submissions.stream()
                            .map(submission -> submission.getAssignment().getId())
                            .distinct()
                            .count();

                    Double averageScore = calculateAverageScore(submissions);

                    return new CourseProgressResponse.StudentProgressItem(
                            student.getId(),
                            student.getName(),
                            assignmentsSubmitted,
                            totalAssignments,
                            averageScore
                    );
                })
                .toList();

        return new CourseProgressResponse(course.getId(), students);
    }

    @Transactional
    public MyProgressResponse getMyProgress(Long courseId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!enrolmentRepository.existsByStudentAndCourse(student, course)) {
            throw new RuntimeException("You are not enrolled in this course");
        }

        long totalAssignments = assignmentRepository.countByCourse(course);

        List<Submission> submissions =
                submissionRepository.findByAssignmentCourseAndStudent(course, student);

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

    private Double calculateAverageScore(List<Submission> submissions) {
        List<Integer> scores = submissions.stream()
                .map(submission -> submission.getOverriddenScore() != null
                        ? submission.getOverriddenScore()
                        : submission.getScore())
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
}