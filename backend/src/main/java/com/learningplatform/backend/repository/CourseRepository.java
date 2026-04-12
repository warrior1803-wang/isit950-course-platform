package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    boolean existsByCode(String code);

    List<Course> findByInstructor(User instructor);

    boolean existsByCodeAndIdNot(String code, Long id);
}