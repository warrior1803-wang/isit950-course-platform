package com.learningplatform.backend.dto.submission;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InstructorSubmissionListResponse {

    private Long id;
    private StudentInfo student;
    private String filename;
    private LocalDateTime submittedAt;
    private Integer score;
    private String feedback;
    private String status;
    private Boolean autoGraded;

    @Getter
    @AllArgsConstructor
    public static class StudentInfo {
        private Long id;
        private String name;
    }
}