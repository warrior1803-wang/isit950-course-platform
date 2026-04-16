package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class AssignmentListResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime openDate;
    private LocalDateTime dueDate;
    private Integer maxScore;
    private SubmissionSummaryResponse submissionStatus;
}
