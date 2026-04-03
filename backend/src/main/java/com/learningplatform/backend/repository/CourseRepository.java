package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {
}