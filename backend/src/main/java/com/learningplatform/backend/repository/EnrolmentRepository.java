package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Enrolment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {
}