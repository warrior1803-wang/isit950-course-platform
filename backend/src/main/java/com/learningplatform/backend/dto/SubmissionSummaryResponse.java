package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class SubmissionSummaryResponse {
    private Long id;
    private String filename;
    private LocalDateTime submittedAt;
    private Integer score;
    private String feedback;
    private String status;
}
