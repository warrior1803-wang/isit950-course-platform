package com.learningplatform.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.learningplatform.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InstructorSubmissionDetailResponse {

    private Long id;
    private StudentInfo student;
    private LocalDateTime submittedAt;
    private Boolean autoGraded;
    private Integer score;
    private Integer maxScore;

    private String filename;
    private String fileUrl;
    private String feedback;

    private List<BreakdownItem> breakdown;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private Integer overriddenScore;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String overriddenBy;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String overrideReason;

    @Getter
    @AllArgsConstructor
    public static class StudentInfo {
        private Long id;
        private String name;
        private String email;
    }

    @Getter
    @AllArgsConstructor
    public static class BreakdownItem {
        private String questionId;
        private String questionText;
        private QuestionType questionType;
        private String studentAnswer;
        private String correctAnswer;
        private Boolean correct;
        private Integer points;
        private Integer maxPoints;
    }
}