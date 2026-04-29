package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.AssignmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentQuestionRepository extends JpaRepository<AssignmentQuestion, Long> {
}