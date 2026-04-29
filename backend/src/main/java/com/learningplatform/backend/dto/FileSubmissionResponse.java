package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FileSubmissionResponse {

    private Long id;
    private String filename;
    private LocalDateTime submittedAt;
    private String status;
}