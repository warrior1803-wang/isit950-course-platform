package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    long countByCourse(Course course);
}