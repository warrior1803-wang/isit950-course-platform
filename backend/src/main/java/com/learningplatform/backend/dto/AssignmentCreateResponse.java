package com.learningplatform.backend.dto.assignment;

import com.learningplatform.backend.model.enums.AssignmentType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AssignmentCreateResponse {

    private Long id;
    private String title;
    private LocalDateTime dueDate;
    private Integer maxScore;
    private AssignmentType type;
    private int questionCount;
    private LocalDateTime createdAt;
}