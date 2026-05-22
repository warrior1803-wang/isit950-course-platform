package com.learningplatform.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MySubmissionResponse {

    private Long id;
    private String filename;
    private LocalDateTime submittedAt;
    private Integer score;
    private Integer maxScore;
    private String feedback;
    private String status;
    private Boolean autoGraded;
    private List<AutoSubmissionResponse.BreakdownItem> breakdown;
    private Long resubmissionsUsed;
    private Integer resubmissionsLimit;
    private Boolean unlimitedResubmissions;
}
