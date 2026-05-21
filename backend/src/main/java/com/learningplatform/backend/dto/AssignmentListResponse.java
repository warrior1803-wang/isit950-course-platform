package com.learningplatform.backend.dto;

import com.learningplatform.backend.model.enums.AssignmentType;
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
    private Integer fileSizeLimitMb;
    private AssignmentType type;
    private SubmissionSummaryResponse submissionStatus;
}
