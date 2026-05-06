package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class AutoSubmissionResponse {

    private Long id;
    private LocalDateTime submittedAt;
    private String status;
    private Boolean autoGraded;
    private Integer score;
    private Integer maxScore;
    private List<BreakdownItem> breakdown;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BreakdownItem {

        private String questionId;

        private String questionText;

        private String studentAnswer;

        private String correctAnswer;

        private Boolean correct;

        private Integer pointsAwarded;

        private Integer maxPoints;
    }
}