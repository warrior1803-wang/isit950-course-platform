package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Material;
import com.learningplatform.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    long countByCourse(Course course);
    void deleteByCourse(Course course);
    List<Material> findByCourse(Course course);
    Optional<Material> findByIdAndCourse(Long id, Course course);
}