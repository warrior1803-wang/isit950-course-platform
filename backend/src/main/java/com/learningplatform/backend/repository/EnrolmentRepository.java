package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Enrolment;
import com.learningplatform.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {

    List<Enrolment> findByStudent(User student);

    long countByCourse(Course course);

    void deleteByCourse(Course course);

    boolean existsByStudentAndCourse(User student, Course course);

    void deleteByStudentAndCourse(User student, Course course);

    List<Enrolment> findByCourse(Course course);
}