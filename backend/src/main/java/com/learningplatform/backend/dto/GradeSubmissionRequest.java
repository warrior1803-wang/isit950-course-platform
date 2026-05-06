package com.learningplatform.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GradeSubmissionRequest {

    private Integer score;
    private String feedback;

    private Integer overriddenScore;
    private String overrideReason;
}