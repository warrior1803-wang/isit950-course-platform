package com.learningplatform.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.learningplatform.backend.model.enums.AssignmentType;
import com.learningplatform.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssignmentDetailResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxScore;
    private Integer fileSizeLimitMb;
    private LocalDateTime createdAt;
    private AssignmentType type;
    private Integer questionCount;
    private Long resubmissionsUsed;
    private Integer resubmissionsLimit;

    // FILE = null → 不显示
    private List<QuestionResponse> questions;

    @Getter
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QuestionResponse {
        private String id;
        private QuestionType type;
        private String text;
        private Integer points;
        private List<String> options;

        // student = null → 不显示
        private Integer correctOption;
        private String correctAnswer;
    }
}
