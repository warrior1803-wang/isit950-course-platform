package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    long countByCourse(Course course);

    List<Assignment> findByCourseOrderByDueDateAsc(Course course);
}
