package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    long countByAssignmentCourseAndScoreIsNull(Course course);

    Optional<Submission> findTopByAssignmentAndStudentOrderBySubmittedAtDesc(Assignment assignment, User student);

    long countByAssignmentAndStudent(Assignment assignment, User student);

    List<Submission> findByAssignmentOrderBySubmittedAtDesc(Assignment assignment);

    Optional<Submission> findByIdAndAssignment(Long id, Assignment assignment);

    void deleteByAssignment(Assignment assignment);

    List<Submission> findByAssignmentCourseAndStudent(Course course, User student);

    List<Submission> findByAssignmentCourse(Course course);

}
