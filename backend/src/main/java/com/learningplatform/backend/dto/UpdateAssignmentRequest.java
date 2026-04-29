package com.learningplatform.backend.dto;

import com.learningplatform.backend.model.enums.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class UpdateAssignmentRequest {

    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxScore;

    // AUTO type only: full replacement
    private List<QuestionRequest> questions;

    @Getter
    @Setter
    public static class QuestionRequest {
        private String id;
        private QuestionType type;
        private String text;
        private Integer points;
        private List<String> options;
        private Integer correctOption;
        private String correctAnswer;
    }
}